import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dbPath = path.join(root, 'data', 'database.json');
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is required.');
  process.exit(1);
}
if (!fs.existsSync(dbPath)) {
  console.error(`Local database not found: ${dbPath}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
for (const student of data.students ?? []) {
  if (student.password) {
    console.error(`Student ${student.username ?? student.id} still has a plaintext password. Start the app locally once to migrate passwords to scrypt hashes, then retry.`);
    process.exit(1);
  }
}

const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
const client = new Client({ connectionString, ssl, connectionTimeoutMillis: 10000 });

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const existing = await client.query('SELECT id FROM app_state WHERE id = 1 LIMIT 1');
  if (existing.rows.length && process.env.FORCE_MIGRATION !== 'true') {
    throw new Error('Render PostgreSQL already contains app data. Set FORCE_MIGRATION=true only when you intentionally want to replace it.');
  }

  await client.query(
    `INSERT INTO app_state (id, data, updated_at)
     VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id)
     DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [JSON.stringify(data)]
  );
  console.log('Local database successfully migrated to Render PostgreSQL.');
} finally {
  await client.end().catch(() => undefined);
}
