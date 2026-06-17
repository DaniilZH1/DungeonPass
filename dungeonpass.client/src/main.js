const credentials = [];

const generatorOptions = {
  length: 16,
  upper: true,
  lower: true,
  numbers: true,
  symbols: true,
};

const apiBaseUrl = window.location.protocol === 'file:' ? 'http://localhost:3001' : '';

let isAuthenticated = false;
let activeView = 'vault';
let generatedPassword = '';
let editingRecordIndex = null;
let currentUser = null;
let vaultMessage = '';
const revealedPasswords = new Set();

function icon(name) {
  const icons = {
    lock: '<path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M12 14v2"/>',
    storage: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><path d="M8 6v.01"/><path d="M8 12v.01"/><path d="M8 18v.01"/>',
    settings: '<path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8.92 4a1.65 1.65 0 0 0 1-1.51V2a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.46.52.83 1 1H21a2 2 0 1 1 0 4h-.09c-.48.17-.86.54-1.01 1Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    key: '<circle cx="7.5" cy="14.5" r="3.5"/><path d="M10 12 21 1"/><path d="m16 6 2 2"/><path d="m13 9 2 2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="m2 2 20 20"/><path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58"/><path d="M9.88 4.24A9.3 9.3 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-3.1 4.35"/><path d="M6.61 6.61A17.3 17.3 0 0 0 2 12s3.5 8 10 8a9.7 9.7 0 0 0 4.4-1.08"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><rect x="2" y="2" width="13" height="13" rx="2"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5"/><path d="M15 12H3"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-15.6 6.1"/><path d="M3 12A9 9 0 0 1 18.6 5.9"/><path d="M3 19v-5h5"/><path d="M21 5v5h-5"/>',
    bolt: '<path d="m13 2-9 13h7l-1 7 9-13h-7l1-7Z"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  };

  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
}

function maskPassword(password) {
  return '•'.repeat(Math.max(password.length, 8));
}

function getPasswordText(index) {
  const password = credentials[index].encrypted_password;
  return revealedPasswords.has(index) ? password : maskPassword(password);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

async function requestJson(url, options = {}) {
  const response = await fetch(`${apiBaseUrl}${url}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Ошибка запроса.');
  }

  return data;
}

async function loadVaultRecords() {
  if (!currentUser) return;

  const data = await requestJson(`/api/users/${currentUser.user_id}/records`);
  credentials.splice(0, credentials.length, ...data.records);
  revealedPasswords.clear();
  editingRecordIndex = null;
}

function generatePassword() {
  const groups = [
    generatorOptions.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '',
    generatorOptions.lower ? 'abcdefghijklmnopqrstuvwxyz' : '',
    generatorOptions.numbers ? '0123456789' : '',
    generatorOptions.symbols ? '!@#$%^&*()_+-=[]{};:,.<>?' : '',
  ].filter(Boolean);

  if (groups.length === 0) {
    generatorOptions.lower = true;
    groups.push('abcdefghijklmnopqrstuvwxyz');
  }

  const allCharacters = groups.join('');
  const result = [];

  groups.forEach((group) => {
    result.push(group[Math.floor(Math.random() * group.length)]);
  });

  while (result.length < generatorOptions.length) {
    result.push(allCharacters[Math.floor(Math.random() * allCharacters.length)]);
  }

  generatedPassword = result
    .sort(() => Math.random() - 0.5)
    .join('')
    .slice(0, generatorOptions.length);
}

function getStrengthLabel() {
  const checkedCount = ['upper', 'lower', 'numbers', 'symbols'].filter((key) => generatorOptions[key]).length;
  const score = generatorOptions.length + checkedCount * 4;

  if (score >= 28) return 'Очень надежный';
  if (score >= 20) return 'Надежный';
  if (score >= 14) return 'Средний';
  return 'Слабый';
}

function renderLogin() {
  document.body.className = 'login-body';
  document.getElementById('root').innerHTML = `
    <main class="login-shell">
      <section class="brand-panel">
        <div class="brand-mark">${icon('lock')}</div>
        <p class="eyebrow">DUNGEONPASS</p>
        <h1>Вход в хранилище</h1>
        <p class="brand-copy">Защитите доступ к паролям и продолжите работу с личным зашифрованным хранилищем.</p>
        <div class="signal-grid" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
      </section>

      <section class="auth-card" aria-labelledby="login-title">
        <div class="auth-heading">
          <div>
            <p class="eyebrow">Авторизация</p>
            <h2 id="login-title">Добро пожаловать</h2>
          </div>
          <span class="auth-badge">${icon('shield')} Local vault</span>
        </div>

        <form id="login-form" class="login-form">
          <label class="field">
            <span>Логин</span>
            <span class="input-wrap">${icon('mail')}<input id="email" type="email" autocomplete="username" placeholder="you@example.com" required /></span>
          </label>

          <label class="field">
            <span>Пароль</span>
            <span class="input-wrap">${icon('key')}<input id="password" type="password" autocomplete="current-password" placeholder="Введите пароль" required /><button class="icon-button" type="button" id="toggle-password" aria-label="Показать пароль">${icon('eye')}</button></span>
          </label>

          <div class="form-row">
            <label class="check"><input type="checkbox" checked /> <span>Запомнить вход</span></label>
            <button type="button" class="link-button">Забыли пароль?</button>
          </div>

          <button class="primary-button" type="submit">${icon('login')} Войти</button>
          <p id="form-note" class="form-note" role="status"></p>
        </form>
      </section>
    </main>
  `;

  document.getElementById('toggle-password').addEventListener('click', () => {
    const password = document.getElementById('password');
    password.type = password.type === 'password' ? 'text' : 'password';
  });

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const note = document.getElementById('form-note');
    const submitButton = form.querySelector('button[type="submit"]');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    note.textContent = 'Проверяю данные...';
    submitButton.disabled = true;

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Не удалось выполнить вход.');
      }

      currentUser = data.user;
      isAuthenticated = true;
      activeView = 'vault';
      note.textContent = data.created ? 'Пользователь создан. Открываю хранилище...' : 'Вход выполнен. Открываю хранилище...';
      await loadVaultRecords();
      renderApp();
    } catch (error) {
      note.textContent = error.message;
      submitButton.disabled = false;
    }
  });
}

function renderApp() {
  if (!generatedPassword) {
    generatePassword();
  }

  document.body.className = 'app-body';
  document.getElementById('root').innerHTML = `
    <div class="app-layout">
      <aside class="sidebar">
        <div class="logo-row">${icon('lock')}<strong>DUNGEONPASS</strong></div>
        <nav>
          <p>ОСНОВНОЕ</p>
          <button class="nav-link ${activeView === 'vault' ? 'active' : ''}" type="button" data-view="vault">${icon('storage')} Хранилище</button>
          <button class="nav-link ${activeView === 'generator' ? 'active' : ''}" type="button" data-view="generator">${icon('bolt')} Генератор</button>
        </nav>
        <span class="version">v0.1</span>
      </aside>

      <div class="workspace">
        <header class="topbar">
          <input type="search" placeholder="Поиск паролей... (Under construction)" />
          <button class="profile-button" type="button" aria-label="Профиль">${icon('user')}</button>
        </header>

        <main class="content">
          ${activeView === 'generator' ? renderGeneratorContent() : renderVaultContent()}
        </main>
      </div>
    </div>
  `;

  bindNavigation();
  if (activeView === 'generator') {
    bindGeneratorActions();
  } else {
    bindVaultActions();
  }
}

function renderVaultContent() {
  return `
    <div class="content-title">
      <h1>Хранилище паролей</h1>
    </div>
    <form class="add-record-form" id="add-record-form">
      <label>
        <span>Сервис</span>
        <input name="service_name" type="text" placeholder="Например, Steam" required />
      </label>
      <label>
        <span>Логин</span>
        <input name="login" type="text" placeholder="login@example.com" required />
      </label>
      <label>
        <span>Пароль</span>
        <input name="password" type="text" placeholder="Введите пароль" required />
      </label>
      <button class="add-record-button" type="submit">${icon('plus')} Добавить</button>
    </form>
    <p class="vault-message" id="vault-message">${escapeHtml(vaultMessage)}</p>
    <div class="vault-list">
      ${credentials.length ? credentials.map((item, index) => renderVaultItem(item, index)).join('') : '<p class="empty-vault">Записей пока нет. Добавьте первый сервис выше.</p>'}
    </div>
  `;
}

function renderVaultItem(item, index) {
  const isEditing = editingRecordIndex === index;

  if (isEditing) {
    return `
      <article class="vault-item vault-item-editing" data-record-index="${index}">
        <div class="item-icon">${icon('key')}</div>
        <form class="record-edit-form">
          <label class="record-edit-field">
            <span>Сервис</span>
            <input name="service_name" type="text" value="${escapeHtml(item.service_name)}" required />
          </label>
          <label class="record-edit-field">
            <span>Логин</span>
            <input name="login" type="text" value="${escapeHtml(item.login)}" required />
          </label>
          <label class="record-edit-field">
            <span>Пароль</span>
            <input name="password" type="text" value="${escapeHtml(item.encrypted_password)}" required />
          </label>
        </form>
        <div class="item-actions">
          <button class="icon-button save-record" type="button" aria-label="Сохранить" title="Сохранить">${icon('check')}</button>
          <button class="icon-button cancel-record-edit" type="button" aria-label="Отменить" title="Отменить">${icon('x')}</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="vault-item" data-record-index="${index}">
      <div class="item-icon">${icon('key')}</div>
      <div>
        <h2>${escapeHtml(item.service_name)}</h2>
        <p>Логин: ${escapeHtml(item.login)}</p>
        <p>Пароль: <span class="password-value">${escapeHtml(getPasswordText(index))}</span></p>
      </div>
      <div class="item-actions">
        <button class="icon-button edit-record" type="button" aria-label="Редактировать" title="Редактировать">${icon('edit')}</button>
        <button class="icon-button copy-password" type="button" aria-label="Копировать пароль" title="Копировать пароль">${icon('copy')}</button>
        <button class="icon-button toggle-record-password" type="button" aria-label="Показать пароль" title="Показать пароль">${icon(revealedPasswords.has(index) ? 'eyeOff' : 'eye')}</button>
      </div>
    </article>
  `;
}

function renderGeneratorContent() {
  const strengthLabel = getStrengthLabel();

  return `
    <div class="content-title">
      <h1>Генератор паролей</h1>
    </div>
    <section class="generator-panel" aria-labelledby="generator-title">
      <h2 id="generator-title">${strengthLabel}</h2>

      <div class="generated-row">
        <output id="generated-password">${generatedPassword}</output>
        <button class="icon-button refresh-password" type="button" aria-label="Обновить пароль" title="Обновить пароль">${icon('refresh')}</button>
        <button class="copy-generated" type="button">Копировать</button>
      </div>

      <label class="length-row">
        <span>Длина пароля</span>
        <input id="password-length-number" type="number" min="4" max="64" value="${generatorOptions.length}" />
        <input id="password-length-range" type="range" min="4" max="64" value="${generatorOptions.length}" />
      </label>

      <div class="generator-options">
        ${renderGeneratorCheck('upper', 'Верхний регистр')}
        ${renderGeneratorCheck('lower', 'Нижний регистр')}
        ${renderGeneratorCheck('numbers', 'Цифры')}
        ${renderGeneratorCheck('symbols', 'Символы')}
      </div>
    </section>
  `;
}

function renderGeneratorCheck(key, label) {
  return `
    <label class="generator-check">
      <input type="checkbox" data-generator-option="${key}" ${generatorOptions[key] ? 'checked' : ''} />
      <span>${label}</span>
    </label>
  `;
}

function bindNavigation() {
  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextView = button.dataset.view;

      activeView = nextView;
      renderApp();
    });
  });
}

function bindVaultActions() {
  const addRecordForm = document.getElementById('add-record-form');
  if (addRecordForm) {
    addRecordForm.addEventListener('submit', addRecord);
  }

  document.querySelectorAll('.edit-record').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.vault-item');
      editingRecordIndex = Number(item.dataset.recordIndex);
      renderApp();
    });
  });

  document.querySelectorAll('.cancel-record-edit').forEach((button) => {
    button.addEventListener('click', () => {
      editingRecordIndex = null;
      renderApp();
    });
  });

  document.querySelectorAll('.save-record').forEach((button) => {
    button.addEventListener('click', () => {
      saveEditedRecord(button.closest('.vault-item'));
    });
  });

  document.querySelectorAll('.record-edit-form').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      saveEditedRecord(form.closest('.vault-item'));
    });
  });

  document.querySelectorAll('.copy-password').forEach((button) => {
    button.addEventListener('click', async () => {
      const item = button.closest('.vault-item');
      const index = Number(item.dataset.recordIndex);

      await copyText(credentials[index].encrypted_password);
      flashButton(button, 'Скопировано', 'Копировать пароль');
    });
  });

  document.querySelectorAll('.toggle-record-password').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.vault-item');
      const index = Number(item.dataset.recordIndex);

      if (revealedPasswords.has(index)) {
        revealedPasswords.delete(index);
      } else {
        revealedPasswords.add(index);
      }

      item.querySelector('.password-value').textContent = getPasswordText(index);
      button.innerHTML = icon(revealedPasswords.has(index) ? 'eyeOff' : 'eye');
      button.title = revealedPasswords.has(index) ? 'Скрыть пароль' : 'Показать пароль';
      button.setAttribute('aria-label', button.title);
    });
  });
}

async function addRecord(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const formData = new FormData(form);
  const payload = {
    service_name: String(formData.get('service_name')).trim(),
    login: String(formData.get('login')).trim(),
    password: String(formData.get('password')).trim(),
  };

  if (!payload.service_name || !payload.login || !payload.password) {
    form.classList.add('has-error');
    vaultMessage = 'Заполните сервис, логин и пароль.';
    renderApp();
    return;
  }

  try {
    const data = await requestJson(`/api/users/${currentUser.user_id}/records`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    credentials.push(data.record);
    form.reset();
    vaultMessage = 'Запись добавлена.';
    renderApp();
  } catch (error) {
    vaultMessage = error.message;
    renderApp();
  }
}

async function saveEditedRecord(item) {
  const index = Number(item.dataset.recordIndex);
  const form = item.querySelector('.record-edit-form');
  const formData = new FormData(form);
  const serviceName = String(formData.get('service_name')).trim();
  const login = String(formData.get('login')).trim();
  const password = String(formData.get('password')).trim();

  if (!serviceName || !login || !password) {
    form.classList.add('has-error');
    return;
  }

  try {
    const data = await requestJson(`/api/users/${currentUser.user_id}/records/${credentials[index].record_id}`, {
      method: 'PUT',
      body: JSON.stringify({
        service_name: serviceName,
        login,
        password,
      }),
    });
    credentials[index] = data.record;
    editingRecordIndex = null;
    vaultMessage = 'Запись сохранена.';
    renderApp();
  } catch (error) {
    vaultMessage = error.message;
    renderApp();
  }
}

function bindGeneratorActions() {
  const lengthNumber = document.getElementById('password-length-number');
  const lengthRange = document.getElementById('password-length-range');

  const updateLength = (value) => {
    generatorOptions.length = Math.min(64, Math.max(4, Number(value) || 16));
    generatePassword();
    updateGeneratorDisplay();
  };

  lengthNumber.addEventListener('change', () => updateLength(lengthNumber.value));
  lengthRange.addEventListener('input', () => updateLength(lengthRange.value));

  document.querySelectorAll('[data-generator-option]').forEach((input) => {
    input.addEventListener('change', () => {
      generatorOptions[input.dataset.generatorOption] = input.checked;
      generatePassword();
      updateGeneratorDisplay();
    });
  });

  document.querySelector('.refresh-password').addEventListener('click', () => {
    generatePassword();
    updateGeneratorDisplay();
  });

  document.querySelector('.copy-generated').addEventListener('click', async (event) => {
    await copyText(generatedPassword);
    flashButton(event.currentTarget, 'Скопировано', 'Копировать');
  });
}

function updateGeneratorDisplay() {
  const title = document.getElementById('generator-title');
  const output = document.getElementById('generated-password');
  const lengthNumber = document.getElementById('password-length-number');
  const lengthRange = document.getElementById('password-length-range');

  if (title) title.textContent = getStrengthLabel();
  if (output) output.textContent = generatedPassword;
  if (lengthNumber) lengthNumber.value = generatorOptions.length;
  if (lengthRange) lengthRange.value = generatorOptions.length;
}

function flashButton(button, activeTitle, defaultTitle) {
  button.classList.add('is-done');
  button.title = activeTitle;
  if (button.classList.contains('copy-generated')) {
    button.textContent = activeTitle;
  }

  setTimeout(() => {
    button.classList.remove('is-done');
    button.title = defaultTitle;
    if (button.classList.contains('copy-generated')) {
      button.textContent = defaultTitle;
    }
  }, 1200);
}

if (isAuthenticated) {
  renderApp();
} else {
  renderLogin();
}
