-- ============================================================
--  NOVER NOIR — Admin + Pricing schema migration
--  Run this AFTER supabase-migration.sql
-- ============================================================

-- ─── Extend products table with pricing fields ───────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price numeric(10,2) NULL,
  -- original_price = "fake MRP" shown as strikethrough
  -- price          = actual selling price (already exists)
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- ─── App settings (shipping config, etc.) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
) TABLESPACE pg_default;

-- Insert default shipping settings
INSERT INTO public.app_settings (key, value) VALUES
  ('shipping', '{"cost": 99, "free_above": 2000}')
ON CONFLICT (key) DO NOTHING;

-- ─── Admin sessions (server-side only, no RLS needed) ───────────────────────

CREATE TABLE IF NOT EXISTS public.admin_sessions (
  token       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (token)
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires
  ON public.admin_sessions USING btree (expires_at) TABLESPACE pg_default;

-- Disable RLS on admin tables (only accessible via service role key from server)
ALTER TABLE public.app_settings   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions DISABLE ROW LEVEL SECURITY;

-- ─── DONE ────────────────────────────────────────────────────────────────────
