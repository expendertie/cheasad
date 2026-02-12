
# Пошаговый план деплоя

## Шаг 1: Настройка базы данных MySQL (бесплатно)

1. Зарегистрируйтесь на https://aiven.io (бесплатный аккаунт)
2. Создайте проект
3. Создайте сервис MySQL:
   - Service Type: MySQL
   - Plan: Free (бесплатно)
   - Region: eu-central-1
4. После создания получите данные для подключения:
   - Host (например: xxx.aivencloud.com)
   - Port (обычно: 13092)
   - User
   - Password
   - Database name: thw_club

## Шаг 2: Подключение к базе и создание таблиц

1. Скачайте MySQL Workbench (https://www.mysql.com/products/workbench/) или используйте онлайн-клиент
2. Подключитесь к вашей базе данных используя данные из Aiven
3. Выполните этот SQL код для создания таблиц (если это новая установка):

```sql
CREATE DATABASE IF NOT EXISTS thw_club;
USE thw_club;

CREATE TABLE IF NOT EXISTS users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'User',
    avatar_url VARCHAR(500) DEFAULT '',
    avatar_color VARCHAR(7) DEFAULT '#333333',
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    priority INT DEFAULT 0,
    can_mute BOOLEAN DEFAULT FALSE,
    can_ban BOOLEAN DEFAULT FALSE,
    can_delete_shouts BOOLEAN DEFAULT FALSE,

    location VARCHAR(100) DEFAULT '',
    website VARCHAR(200) DEFAULT '',
    about TEXT,
    dob_day INT,
    dob_month INT,
    dob_year INT,
    show_dob_date BOOLEAN DEFAULT TRUE,
    show_dob_year BOOLEAN DEFAULT FALSE,
    receive_emails BOOLEAN DEFAULT FALSE,

    is_banned BOOLEAN DEFAULT FALSE,
    is_muted BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(500) DEFAULT ''
);

CREATE TABLE IF NOT EXISTS invite_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    uses_left INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL
);

CREATE TABLE IF NOT EXISTS shouts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    message TEXT NOT NULL,
    time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ip_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid INT NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    count INT DEFAULT 1,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Создаём пригласительный код
INSERT INTO invite_codes (code, uses_left) VALUES ('THW2024', -1);
```

### Обновление существующей базы (ВАЖНО!)
Если вы обновляетесь с предыдущей версии, ваша таблица `users` может быть устаревшей. Выполните этот код, чтобы добавить новые поля:
```sql
ALTER TABLE `users`
ADD COLUMN `priority` INT DEFAULT 0,
ADD COLUMN `can_mute` BOOLEAN DEFAULT FALSE,
ADD COLUMN `can_ban` BOOLEAN DEFAULT FALSE,
ADD COLUMN `can_delete_shouts` BOOLEAN DEFAULT FALSE;
```

## Шаг 3: Деплой на Vercel

1. Перейдите на https://vercel.com
2. Нажмите "Add New..." → "Project"
3. Выберите репозиторий `expendertie/cheasad`
4. Настройте:
   - Framework Preselect: Vite
   - Build Command: npm run build
   - Output Directory: dist
5. Нажмите "Deploy"

## Шаг 4: Настройка переменных окружения

1. После деплоя перейдите в Settings → Environment Variables
2. Добавьте переменные:
   - DB_HOST = (ваш хост из Aiven)
   - DB_PORT = 13092
   - DB_USER = (ваш пользователь из Aiven)
   - DB_PASSWORD = (ваш пароль из Aiven)
   - DB_NAME = thw_club
3. Перейдите в Deployments и нажмите "Redeploy"

## Шаг 5: Подключение своего домена

1. Купите домен (например: namecheap.com, goDaddy.com)
2. В Vercel перейдите в Settings → Domains
3. Введите ваш домен
4. Добавьте DNS записи у регистратора домена:
   - Тип A, Name: @, Value: 76.76.21.21
   - Тип CNAME, Name: www, Value: cname.vercel-dns.com
5. Подождите 5-10 минут пока DNS обновится

---

## Готово! Ваш сайт будет доступен на вашем домене.