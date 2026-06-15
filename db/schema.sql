-- Admaxxing database schema
-- ---------------------------------------------------------------------------
-- The /api/signup function creates the `signups` table lazily, so you don't
-- have to run this by hand for the waitlist. It's kept here as the source of
-- truth and as a sketch of where the schema is headed once we "commit to the
-- bit" and onboard real users + advertisers.
--
-- Run against the connected Postgres (Neon) store:
--   psql "$POSTGRES_URL" -f db/schema.sql

-- Early-access waitlist (live now) -------------------------------------------
CREATE TABLE IF NOT EXISTS signups (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  source     TEXT,                                   -- where the signup came from
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- FUTURE (sketch — intentionally not created yet) ----------------------------
-- ---------------------------------------------------------------------------
-- users        -- accounts that run the toolbar and earn
--   id, email (FK-ish to signups), created_at, payout_method, balance_cents
-- advertisers  -- brands buying attention
--   id, name, category, contact_email, created_at, status
-- ads          -- creatives owned by an advertiser
--   id, advertiser_id, text, target, rate_cpm_cents, active
-- impressions  -- attention events; drive earnings + the 50% revenue split
--   id, user_id, ad_id, shown_at, revenue_cents, user_share_cents
