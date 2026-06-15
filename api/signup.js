// POST /api/signup  — store an early-access email in Postgres.
//
// Backed by Vercel Postgres (Neon). Connect a Postgres store to the project
// in the Vercel dashboard and it injects POSTGRES_URL automatically; the
// @vercel/postgres `sql` helper reads it with no extra config.
//
// Local dev: run `vercel dev` (with the store linked via `vercel env pull`)
// so this route and the env vars exist. A plain static server won't have /api.

const { sql } = require('@vercel/postgres');

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
    // Lazy bootstrap so there's no separate migration step for the MVP.
    // Move to real migrations once more tables (users, advertisers…) land.
    await sql`
      CREATE TABLE IF NOT EXISTS signups (
        id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        email      TEXT NOT NULL UNIQUE,
        source     TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;

    await sql`
      INSERT INTO signups (email, source)
      VALUES (${email}, ${source})
      ON CONFLICT (email) DO NOTHING`;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Could not save your email — please try again.' });
  }
};
