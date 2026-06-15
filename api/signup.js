// POST /api/signup  — store an early-access email in Postgres (Neon).
//
// Uses Neon's serverless driver over HTTP, ideal for Vercel functions.
// Reads the connection string from DATABASE_URL (set by the Vercel <> Neon
// integration in production; from .env locally via `vercel dev`).
//
// Local dev: `vercel dev` so this route + env vars exist. A plain static
// server has no /api and the form will surface a friendly error.

const { neon } = require('@neondatabase/serverless');

let _sql;
function getSql() {
  if (!_sql) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('No database URL (DATABASE_URL / POSTGRES_URL).');
    _sql = neon(url);
  }
  return _sql;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Vercel parses JSON bodies automatically; guard for the string case too.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  // Honeypot: real users never fill this. Pretend success, store nothing.
  if (body.company) return res.status(200).json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  const source = String(body.source || 'landing').slice(0, 64);

  try {
    const sql = getSql();
    // Create-if-needed + insert in a single round trip. The table normally
    // already exists (see `npm run migrate`); this keeps the route self-healing.
    await sql.transaction([
      sql`
        CREATE TABLE IF NOT EXISTS signups (
          id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          email      TEXT NOT NULL UNIQUE,
          source     TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`,
      sql`
        INSERT INTO signups (email, source)
        VALUES (${email}, ${source})
        ON CONFLICT (email) DO NOTHING`,
    ]);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Could not save your email — please try again.' });
  }
};
