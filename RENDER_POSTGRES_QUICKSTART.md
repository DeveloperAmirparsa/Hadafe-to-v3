# هدف تو — Render + Render PostgreSQL

این نسخه برای اجرای Production با Render PostgreSQL آماده شده است.

## ساختار
- Web Service: Node.js + Express + React
- PostgreSQL: Render Postgres
- داده‌های اپ در جدول `app_state` با ستون `data JSONB` نگه‌داری می‌شوند تا ساختار فعلی برنامه بدون بازنویسی کامل حفظ شود.
- در Production فایل `data/database.json` خوانده یا نوشته نمی‌شود.

## Web Service
Build Command:
`npm install --include=dev && npm run build`

Start Command:
`npm start`

Health Check Path:
`/health`

Node Version:
`22.16.0` (فایل `.node-version` در پروژه قرار دارد.)

## Variables
این‌ها را در Render Web Service قرار بده:

`NODE_ENV=production`
`PORT=10000`
`TRUST_PROXY=1`
`SESSION_TTL_HOURS=168`
`SEED_DEMO_DATA=false`
`COUNSELOR_USERNAME=dr.parsa`
`COUNSELOR_PASSWORD_HASH=<scrypt hash>`
`DATABASE_URL=<Render Postgres Internal Database URL>`
`DATABASE_SSL=false`

Render خودش `PORT` را فراهم می‌کند و سرویس باید روی `0.0.0.0` گوش بدهد؛ کد پروژه همین کار را انجام می‌دهد.

## PostgreSQL در Render
1. داخل همان Render Project گزینه New → PostgreSQL را بزن.
2. Web Service و Postgres را در یک Region قرار بده.
3. از صفحه Connect دیتابیس، **Internal Database URL** را بردار.
4. مقدار آن را در Web Service با نام `DATABASE_URL` قرار بده.
5. Deploy را اجرا کن.

برنامه در اولین Startup جدول زیر را خودش می‌سازد:

`app_state(id INTEGER PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL)`

نیازی به اجرای SQL دستی نیست.

## انتقال database.json فعلی
اگر می‌خواهی داده‌های فعلی روی کامپیوترت منتقل شوند:

1. `data/database.json` فعلی را در پروژه محلی نگه دار؛ آن را وارد Git/Repository نکن.
2. متغیر `DATABASE_URL` را روی **External Database URL** Render در `.env` محلی بگذار.
3. برای اتصال خارجی Render، `DATABASE_SSL=true` بگذار.
4. `npm install` را اجرا کن.
5. `npm run db:push` را اجرا کن.

اسکریپت فقط وقتی رکورد مقصد وجود نداشته باشد وارد می‌کند. برای جایگزینی عمدی دیتابیس مقصد، `FORCE_MIGRATION=true` را فقط یک‌بار تنظیم کن.

## تست بدون GitHub
این پروژه `Dockerfile` دارد. می‌توانی Image را بسازی و در یک Registry مثل Docker Hub قرار بدهی، سپس در Render گزینه Existing Image را انتخاب کنی.

## امنیت
- رمز مشاور فقط به صورت `scrypt` hash در Environment Variable قرار می‌گیرد.
- Cookie نشست `HttpOnly` و `SameSite=Strict` است و در Production `Secure` می‌شود.
- password و passwordHash در API خروجی داده نمی‌شوند.
- احراز هویت و Role checks سمت سرور اعمال می‌شوند.
- Render Web Service در Production بدون `DATABASE_URL` عمداً Start نمی‌شود.
- `data/database.json` و `.env` در Docker/Source deploy کنار گذاشته می‌شوند.
