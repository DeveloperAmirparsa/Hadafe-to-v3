# Deploy — هدف تو on Render + Render PostgreSQL

## Web Service
Build Command:
`npm install --include=dev && npm run build`

Start Command:
`npm start`

Health Check:
`/health`

The app binds to `0.0.0.0:${PORT}`.

## PostgreSQL
Create a PostgreSQL database in the same Render Project and Region as the Web Service. Copy its **Internal Database URL** into the Web Service environment as `DATABASE_URL`.

The application automatically creates the `app_state` table on first start and stores the current application state in PostgreSQL JSONB. No SQL setup is required.

## Required production environment variables
- `NODE_ENV=production`
- `PORT=10000`
- `TRUST_PROXY=1`
- `SESSION_TTL_HOURS=168`
- `SEED_DEMO_DATA=false`
- `COUNSELOR_USERNAME=dr.parsa`
- `COUNSELOR_PASSWORD_HASH=<scrypt hash>`
- `DATABASE_URL=<Render Postgres internal URL>`
- `DATABASE_SSL=false`

## Existing local data migration
Keep the current local `data/database.json` outside the deploy archive. Set `DATABASE_URL` in a local `.env` to the Render **External Database URL** and set `DATABASE_SSL=true`, then run:

`npm install`

`npm run db:push`

The migration refuses to overwrite an existing database unless `FORCE_MIGRATION=true` is explicitly set.

## Secrets
Never commit `.env`, `database.json`, real passwords, database URLs, or API keys. Production login uses a scrypt password hash.
