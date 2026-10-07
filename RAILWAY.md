# دیپلوی روی Railway

1. پروژه را (بدون `data/database.json`) روی یک ریپوی Private در GitHub بگذار؛ `railway.json` باید در ریشه باشد.
2. Railway → New Project → Deploy from GitHub repo.
3. New → Database → Add PostgreSQL.
4. روی سرویس اپ → Variables:

```
NODE_ENV=production
TRUST_PROXY=1
SESSION_TTL_HOURS=168
DB_POOL_MAX=5
SEED_DEMO_DATA=false
COUNSELOR_USERNAME=dr.parsa
COUNSELOR_PASSWORD_HASH=<خروجی node scripts/hash-password.mjs 'رمز'>
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=false
```

5. Settings → Networking → Generate Domain؛ سپس `/health` باید `{"ok":true}` بدهد.

انتقال داده‌ی قبلی (اختیاری): `data/database.json` را فقط روی کامپیوتر خودت نگه دار، `DATABASE_URL` را روی آدرس عمومی دیتابیس (`DATABASE_PUBLIC_URL`) بگذار و `npm run db:push` بزن.
