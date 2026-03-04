-- ============================================================
--  NOVER NOIR — Full e-commerce schema migration
--  Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ─── Utility trigger function (reuse or create) ──────────────────────────────

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── ADDRESSES ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.addresses (
  id              uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL,
  label           text        NOT NULL DEFAULT 'Home',       -- "Home", "Work", etc.
  full_name       text        NOT NULL,
  phone           text        NOT NULL,
  address_line1   text        NOT NULL,
  address_line2   text        NULL,
  city            text        NOT NULL,
  state           text        NOT NULL,
  pincode         text        NOT NULL,
  country         text        NOT NULL DEFAULT 'India',
  is_default      boolean     NOT NULL DEFAULT false,
  created_at      timestamptz NULL     DEFAULT now(),
  updated_at      timestamptz NULL     DEFAULT now(),

  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_addresses_user_id
  ON public.addresses USING btree (user_id) TABLESPACE pg_default;

CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── ORDER STATUS TYPE ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM (
      'pending_payment',
      'payment_failed',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'refunded'
    );
  END IF;
END$$;

-- ─── ORDERS ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
  id                    uuid         NOT NULL DEFAULT gen_random_uuid(),
  user_id               uuid         NOT NULL,
  items                 jsonb        NOT NULL DEFAULT '[]'::jsonb,
  -- items JSON shape: [{ product_id, name, price, quantity, image }]
  subtotal              numeric(10,2) NOT NULL DEFAULT 0,
  tax                   numeric(10,2) NOT NULL DEFAULT 0,
  shipping              numeric(10,2) NOT NULL DEFAULT 0,
  total                 numeric(10,2) NOT NULL DEFAULT 0,
  status                order_status NOT NULL DEFAULT 'pending_payment',
  tracking_id           text         NULL,
  address_id            uuid         NOT NULL,
  razorpay_order_id     text         NULL,
  razorpay_payment_id   text         NULL,
  razorpay_signature    text         NULL,
  notes                 text         NULL,
  created_at            timestamptz  NULL DEFAULT now(),
  updated_at            timestamptz  NULL DEFAULT now(),

  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT orders_address_id_fkey FOREIGN KEY (address_id)
    REFERENCES public.addresses (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON public.orders USING btree (user_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders USING btree (status) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders USING btree (razorpay_order_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id
  ON public.orders USING btree (razorpay_payment_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_id
  ON public.orders USING btree (tracking_id) TABLESPACE pg_default;

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────

-- Enable RLS
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;

-- Addresses: users can only see/manage their own
CREATE POLICY "addresses: own rows" ON public.addresses
  FOR ALL USING (auth.uid() = user_id);

-- Orders: users can only see their own
CREATE POLICY "orders: own rows" ON public.orders
  FOR ALL USING (auth.uid() = user_id);

-- ─── GRANT SERVICE ROLE BYPASS (Next.js API uses service key) ────────────────
-- The service_role key bypasses RLS automatically — no extra grants needed.

-- ─── DONE ────────────────────────────────────────────────────────────────────
-- Run this script once in Supabase SQL Editor.
-- Tables: addresses, orders
-- RLS policies: users see only their own data
