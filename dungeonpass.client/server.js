import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT) || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const tokenSecret = process.env.AUTH_TOKEN_SECRET;
const encryptionKeyHex = process.env.VAULT_ENCRYPTION_KEY;
const encryptionKey = encryptionKeyHex && /^[\da-f]{64}$/i.test(encryptionKeyHex)
  ? Buffer.from(encryptionKeyHex, 'hex')
  : null;

if (!tokenSecret || !encryptionKey) {
  console.error('AUTH_TOKEN_SECRET and a 32-byte hex VAULT_ENCRYPTION_KEY are required.');
  process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

function signToken(userId) {
  const payload = Buffer.from(JSON.stringify({ userId: Number(userId), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function requireAuth(req, res, next) {
  const [payload, signature, extra] = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').split('.');
  if (!payload || !signature || extra) return res.status(401).json({ error: 'Требуется вход.' });
  const expected = crypto.createHmac('sha256', tokenSecret).update(payload).digest();
  let actual;
  try { actual = Buffer.from(signature, 'base64url'); } catch { return res.status(401).json({ error: 'Требуется вход.' }); }
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return res.status(401).json({ error: 'Требуется вход.' });
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    const userId = Number(claims.userId);
    if (!Number.isSafeInteger(userId) || userId <= 0 || claims.exp <= Date.now()) throw new Error('expired');
    req.userId = userId;
    next();
  } catch { res.status(401).json({ error: 'Сессия истекла. Войдите снова.' }); }
}

const authAttempts = new Map();
const authWindowMs = 15 * 60 * 1000;
const authAttemptLimit = 10;

function limitAuthAttempts(req, res, next) {
  const now = Date.now();
  const recentAttempts = (authAttempts.get(req.ip) || []).filter((timestamp) => now - timestamp < authWindowMs);
  if (recentAttempts.length >= authAttemptLimit) {
    res.setHeader('Retry-After', Math.ceil((authWindowMs - (now - recentAttempts[0])) / 1000));
    return res.status(429).json({ error: 'Слишком много попыток. Попробуйте позже.' });
  }
  recentAttempts.push(now);
  authAttempts.set(req.ip, recentAttempts);
  next();
}

const authAttemptCleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of authAttempts) {
    const recent = timestamps.filter((timestamp) => now - timestamp < authWindowMs);
    if (recent.length) authAttempts.set(ip, recent);
    else authAttempts.delete(ip);
  }
}, authWindowMs);
authAttemptCleanup.unref();

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')}`;
}

function decryptSecret(value) {
  if (!value.startsWith('v1:')) return value; // Legacy plaintext; re-save the record to encrypt it.
  const packed = Buffer.from(value.slice(3), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, packed.subarray(0, 12));
  decipher.setAuthTag(packed.subarray(12, 28));
  return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8');
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 120000, 64, 'sha512').toString('hex');
}

function createSalt() {
  return crypto.randomBytes(16).toString('hex');
}

async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT user_id, email, password_hash, salt FROM public.users WHERE lower(email) = lower($1) LIMIT 1',
    [email],
  );

  return result.rows[0] || null;
}

app.post('/api/auth/register', limitAuthAttempts, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || password.length < 12) {
    res.status(400).json({ error: 'Введите email и пароль длиной не менее 12 символов.' });
    return;
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'Аккаунт с таким email уже существует.' });
      return;
    }
    const salt = createSalt();
    const passwordHash = hashPassword(password, salt);
    const createdUser = await pool.query(
      `INSERT INTO public.users (email, password_hash, salt) VALUES ($1, $2, $3) RETURNING user_id, email`,
      [email, passwordHash, salt],
    );
    const user = createdUser.rows[0];
    res.status(201).json({ user, token: signToken(user.user_id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось создать аккаунт.' });
  }
});

app.post('/api/auth/login', limitAuthAttempts, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Введите email и пароль.' });
  try {
    const existingUser = await findUserByEmail(email);
    if (!existingUser) return res.status(401).json({ error: 'Неверный логин или пароль.' });
    const passwordHash = hashPassword(password, existingUser.salt);
    const actualHash = Buffer.from(passwordHash, 'hex');
    const storedHash = Buffer.from(existingUser.password_hash, 'hex');
    if (actualHash.length !== storedHash.length || !crypto.timingSafeEqual(actualHash, storedHash)) {
      return res.status(401).json({ error: 'Неверный логин или пароль.' });
    }
    res.json({ user: { user_id: existingUser.user_id, email: existingUser.email }, token: signToken(existingUser.user_id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось выполнить вход.' });
  }
});

app.put('/api/account/password', requireAuth, async (req, res) => {
  const currentPassword = String(req.body.current_password || '');
  const newPassword = String(req.body.new_password || '');
  if (!currentPassword || newPassword.length < 12) {
    return res.status(400).json({ error: 'Новый пароль должен содержать не менее 12 символов.' });
  }
  try {
    const result = await pool.query(
      'SELECT password_hash, salt FROM public.users WHERE user_id = $1',
      [req.userId],
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Аккаунт не найден.' });
    const actualHash = Buffer.from(hashPassword(currentPassword, user.salt), 'hex');
    const storedHash = Buffer.from(user.password_hash, 'hex');
    if (actualHash.length !== storedHash.length || !crypto.timingSafeEqual(actualHash, storedHash)) {
      return res.status(401).json({ error: 'Текущий пароль указан неверно.' });
    }
    const salt = createSalt();
    await pool.query(
      'UPDATE public.users SET password_hash = $1, salt = $2 WHERE user_id = $3',
      [hashPassword(newPassword, salt), salt, req.userId],
    );
    res.json({ message: 'Пароль изменён.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось изменить пароль.' });
  }
});

app.get('/api/records', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT record_id, user_id, service_name, login, encrypted_password
       FROM public.records
       WHERE user_id = $1
       ORDER BY record_id`,
      [req.userId],
    );
    const records = await Promise.all(result.rows.map(async (record) => {
      let storedPassword = record.encrypted_password;
      if (!storedPassword.startsWith('v1:')) {
        storedPassword = encryptSecret(storedPassword);
        await pool.query(
          'UPDATE public.records SET encrypted_password = $1 WHERE record_id = $2 AND user_id = $3',
          [storedPassword, record.record_id, req.userId],
        );
      }
      return { ...record, encrypted_password: decryptSecret(storedPassword) };
    }));
    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось загрузить записи.' });
  }
});

app.post('/api/records', requireAuth, async (req, res) => {
  const serviceName = String(req.body.service_name || '').trim();
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '').trim();

  if (!serviceName || !login || !password) {
    res.status(400).json({ error: 'Заполните сервис, логин и пароль.' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.records (user_id, service_name, login, encrypted_password)
       VALUES ($1, $2, $3, $4)
       RETURNING record_id, user_id, service_name, login, encrypted_password`,
      [req.userId, serviceName, login, encryptSecret(password)],
    );
    res.status(201).json({ record: { ...result.rows[0], encrypted_password: password } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось добавить запись.' });
  }
});

app.put('/api/records/:recordId', requireAuth, async (req, res) => {
  const recordId = Number(req.params.recordId);
  const serviceName = String(req.body.service_name || '').trim();
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '').trim();

  if (!Number.isInteger(recordId) || !serviceName || !login || !password) {
    res.status(400).json({ error: 'Заполните сервис, логин и пароль.' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE public.records
       SET service_name = $1, login = $2, encrypted_password = $3
       WHERE record_id = $4 AND user_id = $5
       RETURNING record_id, user_id, service_name, login, encrypted_password`,
      [serviceName, login, encryptSecret(password), recordId, req.userId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Запись не найдена.' });
      return;
    }

    res.json({ record: { ...result.rows[0], encrypted_password: password } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось сохранить запись.' });
  }
});

app.delete('/api/records/:recordId', requireAuth, async (req, res) => {
  const recordId = Number(req.params.recordId);
  if (!Number.isSafeInteger(recordId) || recordId <= 0) {
    res.status(400).json({ error: 'Некорректная запись.' });
    return;
  }

  try {
    const result = await pool.query(
      'DELETE FROM public.records WHERE record_id = $1 AND user_id = $2 RETURNING record_id',
      [recordId, req.userId],
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Запись не найдена.' });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось удалить запись.' });
  }
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Нет подключения к PostgreSQL.' });
  }
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`DungeonPass server is running on http://localhost:${port}`);
});
