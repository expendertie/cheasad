# Инструкция по деплою на Vercel

## Требования

- Аккаунт на [Vercel](https://vercel.com)
- Аккаунт на [GitHub](https://github.com) (для хранения кода)
- Аккаунт для MySQL базы данных (например, [Aiven](https://aiven.io), [PlanetScale](https://planetscale.com), [Neon](https://neon.tech) или [Cloudflare D1](https://developers.cloudflare.com/d1/))

---

## Шаг 1: Подготовка кода

### 1.1 Создайте файл `.env` с переменными окружения

Создайте файл `.env.local` в корне проекта:

```env
VITE_API_URL=/api
```

### 1.2 Настройте API для Vercel

Убедитесь, что [`api/index.js`](api/index.js:1) настроен для работы с переменными окружения Vercel (он уже настроен).

---

## Шаг 2: Настройка базы данных MySQL

### 2.1 Создайте аккаунт на Aiven (бесплатный вариант)

1. Зарегистрируйтесь на [Aiven](https://aiven.io)
2. Создайте новый проект
3. Создайте сервис MySQL:
   - Выберите "MySQL" как тип сервиса
   - Выберите бесплатный план (Free)
   - Выберите регион (например, eu-central-1)
4. После создания получите:
   - **Host** (например, `host-name.aivencloud.com`)
   - **Port** (обычно `13092`)
   - **User** (например, `avnadmin`)
   - **Password**
   - **Database name** (например., `thw_club`)

### 2.2 Создайте таблицы в базе данных

Подключитесь к вашей базе данных и выполните SQL из [`backend/schema.sql`](backend/schema.sql:1):

```sql
-- Создайте базу данных (если ещё не создана)
CREATE DATABASE IF NOT EXISTS thw_club;

USE thw_club;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'User',
    avatar_url VARCHAR(500) DEFAULT '',
    avatar_color VARCHAR(7) DEFAULT '#333333',
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    location VARCHAR(100) DEFAULT '',
    website VARCHAR(200) DEFAULT '',
    about TEXT DEFAULT '',
    dob_day INT DEFAULT 0,
    dob_month INT DEFAULT 0,
    dob_year INT DEFAULT 0,
    show_dob_date BOOLEAN DEFAULT FALSE,
    show_dob_year BOOLEAN DEFAULT FALSE,
    receive_emails BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(500) DEFAULT ''
);

-- Таблица пригласительных кодов
CREATE TABLE IF NOT EXISTS invite_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    uses_left INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сообщений (shouts)
CREATE TABLE IF NOT EXISTS shouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    message TEXT NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid)
);

-- Таблица логов IP
CREATE TABLE IF NOT EXISTS ip_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    count INT DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid)
);

-- Создайте первый пригласительный код
INSERT INTO invite_codes (code, uses_left) VALUES ('THW2024', -1);
```

---

## Шаг 3: Деплой на Vercel

### 3.1 Загрузите код на GitHub

1. Создайте новый репозиторий на GitHub
2. Инициализируйте git в локальной папке:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ВАШ_НИК/ВАШ_РЕПОЗИТОРИЙ.git
   git push -u origin main
   ```

### 3.2 Деплой через Vercel

1. Перейдите на [Vercel](https://vercel.com) и войдите в аккаунт
2. Нажмите "Add New..." → "Project"
3. Выберите ваш репозиторий из списка
4. Настройте проект:
   - **Framework Preselect**: Vite (или Other)
   - **Build Command**: `npm run build` или `tsc && vite build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Нажмите "Deploy"

---

## Шаг 4: Настройка переменных окружения

После деплоя перейдите в настройки проекта:

1. Откройте ваш проект на Vercel
2. Перейдите в **Settings** → **Environment Variables**
3. Добавьте следующие переменные:

| Имя переменной | Значение | Пример |
|---------------|----------|--------|
| `DB_HOST` | Хост вашей базы данных | `host-name.aivencloud.com` |
| `DB_PORT` | Порт базы данных | `13092` |
| `DB_USER` | Имя пользователя | `avnadmin` |
| `DB_PASSWORD` | Пароль | `ваш_пароль` |
| `DB_NAME` | Имя базы данных | `thw_club` |

4. Перейдите в **Deployments**
5. Нажмите на последний деплой и выберите **"Redeploy"**

---

## Шаг 5: Подключение своего домена

### 5.1 Купите домен

Купите домен у любого регистратора (Namecheap, GoDaddy, UA-hosting и т.д.)

### 5.2 Добавьте домен в Vercel

1. Перейдите в **Settings** → **Domains**
2. Введите ваш домен
3. Vercel предоставит вам DNS-записи для настройки

### 5.3 Настройте DNS у регистратора

Добавьте следующие записи:

**Вариант 1 (полный контроль):**
- Тип: **A**, Имя: `@`, Значение: `76.76.21.21`
- Тип: **CNAME**, Имя: `www`, Значение: `cname.vercel-dns.com`

**Вариант 2 (через Vercel Nameservers):**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
ns3.vercel-dns.com
```

### 5.4 SSL/HTTPS

Vercel автоматически предоставляет бесплатный SSL-сертификат через Let's Encrypt. Дождитесь активации (обычно несколько минут).

---

## Шаг 6: Проверка работоспособности

1. Откройте ваш домен в браузере
2. Проверьте, что сайт загружается
3. Попробуйте зарегистрироваться (используйте пригласительный код `THW2024`)
4. Проверьте `/api/health` endpoint: `https://ваш-домен.com/api/health`

---

## Возможные проблемы

### Ошибка подключения к базе данных
- Проверьте правильность переменных окружения
- Убедитесь, что IP Vercel разрешён в настройках базы данных (Aiven требует добавить IP в whitelist)

### Ошибки сборки
- Убедитесь, что все зависимости установлены
- Проверьте, что TypeScript компилируется без ошибок

### CORS ошибки
- Проверьте настройки CORS в [`api/index.js`](api/index.js:10)

---

## Альтернативные варианты деплоя

### Вариант 1:Vercel + PlanetScale (Serverless MySQL)
PlanetScale предлагает бесплатный serverless MySQL с хорошей интеграцией с Vercel.

### Вариант 2: Railway
[Railway](https://railway.app) позволяет деплоить и фронтенд, и бэкенд, и MySQL в одном месте.

### Вариант 3: VPS (Hetzner, DigitalOcean)
Можно арендовать VPS и разместить всё там:
- Nginx как reverse proxy
- Frontend (собранный)
- Backend (Node.js)
- MySQL

Это даёт полный контроль, но требует больше настройки.
