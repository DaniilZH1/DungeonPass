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

app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }

  next();
});
app.use(express.static(__dirname));

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

app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) {
    res.status(400).json({ error: 'Введите email и пароль.' });
    return;
  }

  try {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      const passwordHash = hashPassword(password, existingUser.salt);

      if (passwordHash !== existingUser.password_hash) {
        res.status(401).json({ error: 'Неверный логин или пароль.' });
        return;
      }

      res.json({
        user: {
          user_id: existingUser.user_id,
          email: existingUser.email,
        },
      });
      return;
    }

    const salt = createSalt();
    const passwordHash = hashPassword(password, salt);
    const createdUser = await pool.query(
      `INSERT INTO public.users (email, password_hash, salt)
       VALUES ($1, $2, $3)
       RETURNING user_id, email`,
      [email, passwordHash, salt],
    );

    res.status(201).json({ user: createdUser.rows[0], created: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось выполнить вход.' });
  }
});

app.get('/api/users/:userId/records', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId)) {
    res.status(400).json({ error: 'Некорректный пользователь.' });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT record_id, user_id, service_name, login, encrypted_password
       FROM public.records
       WHERE user_id = $1
       ORDER BY record_id`,
      [userId],
    );

    res.json({ records: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось загрузить записи.' });
  }
});

app.post('/api/users/:userId/records', async (req, res) => {
  const userId = Number(req.params.userId);
  const serviceName = String(req.body.service_name || '').trim();
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '').trim();

  if (!Number.isInteger(userId) || !serviceName || !login || !password) {
    res.status(400).json({ error: 'Заполните сервис, логин и пароль.' });
    return;
  }

  try {
    const result = await pool.query(
      `INSERT INTO public.records (user_id, service_name, login, encrypted_password)
       VALUES ($1, $2, $3, $4)
       RETURNING record_id, user_id, service_name, login, encrypted_password`,
      [userId, serviceName, login, password],
    );

    res.status(201).json({ record: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось добавить запись.' });
  }
});

app.put('/api/users/:userId/records/:recordId', async (req, res) => {
  const userId = Number(req.params.userId);
  const recordId = Number(req.params.recordId);
  const serviceName = String(req.body.service_name || '').trim();
  const login = String(req.body.login || '').trim();
  const password = String(req.body.password || '').trim();

  if (!Number.isInteger(userId) || !Number.isInteger(recordId) || !serviceName || !login || !password) {
    res.status(400).json({ error: 'Заполните сервис, логин и пароль.' });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE public.records
       SET service_name = $1, login = $2, encrypted_password = $3
       WHERE record_id = $4 AND user_id = $5
       RETURNING record_id, user_id, service_name, login, encrypted_password`,
      [serviceName, login, password, recordId, userId],
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Запись не найдена.' });
      return;
    }

    res.json({ record: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не удалось сохранить запись.' });
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
