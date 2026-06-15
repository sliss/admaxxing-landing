// Apply db/schema.sql to the connected Postgres, then report row count.
// Usage: npm run migrate   (loads .env locally; uses Vercel env in CI)

const fs = require('fs');
const path = require('path');

loadEnv();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function main() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const raw = fs.readFileSync(schemaPath, 'utf8');

  // Strip line comments, split into statements.
  const statements = raw
    .split('\n')
    .filter((l) => !l.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await sql.query(stmt);
  }

  const rows = await sql.query('SELECT count(*)::int AS n FROM signups');
  console.log('✓ Migration applied. signups table ready — current rows:', rows[0].n);
}

// Minimal .env loader (no dependency). Real env vars win over the file.
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Migration failed:', err.message);
    process.exit(1);
  });
