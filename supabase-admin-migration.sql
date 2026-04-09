-- ============================================================
--  NOVER NOIR — Admin + Pricing schema migration
--  Run this AFTER supabase-migration.sql
-- ============================================================

-- ─── Extend products table with pricing fields ───────────────────────────────

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS original_price numeric(10,2) NULL,
  -- original_price = "fake MRP" shown as strikethrough
  -- price          = actual selling price (already exists)
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_out_of_stock boolean NOT NULL DEFAULT false;

-- ─── App settings (shipping config, etc.) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.app_settings (
  key   text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz NULL DEFAULT now(),
  CONSTRAINT app_settings_pkey PRIMARY KEY (key)
) TABLESPACE pg_default;

-- Insert default shipping settings
INSERT INTO public.app_settings (key, value) VALUES
  ('shipping', '{"cost": 49, "free_above": 2000}')
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

-- ─── RLS on app_settings (public read, no client writes) ────────────────────

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (anon included) can read — needed for shipping config on the storefront
DROP POLICY IF EXISTS "app_settings_public_read" ON public.app_settings;
CREATE POLICY "app_settings_public_read"
  ON public.app_settings
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE from the client; service role key (API server) bypasses RLS

-- ─── RLS on admin_sessions (fully locked — service role only) ────────────────

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Deny every client-side operation; only the server's service role key can access
DROP POLICY IF EXISTS "admin_sessions_deny_all" ON public.admin_sessions;
CREATE POLICY "admin_sessions_deny_all"
  ON public.admin_sessions
  FOR ALL
  USING (false);

-- ─── RLS on products: enforce is_active filter at DB level ───────────────────

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated users only see active products
DROP POLICY IF EXISTS "products_active_only" ON public.products;
CREATE POLICY "products_active_only"
  ON public.products
  FOR SELECT
  USING (is_active = true);

-- Service role (API server) bypasses RLS, so admin routes see all products

-- ─── DONE ────────────────────────────────────────────────────────────────────
