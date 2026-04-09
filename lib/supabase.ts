import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Server-side admin client (bypasses RLS - use only in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Create a client authenticated as the calling user (respects RLS)
export function createUserClient(accessToken: string) {
  return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ─── DB Types ─────────────────────────────────────────────────────────────────

export interface DBUser {
  id: string;
  name: string;
  phone_number: string;
  email: string;
  created_at?: string;
}

export interface DBAddress {
  id: string;
  user_id: string;
  label: string;           // e.g. "Home", "Work"
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DBOrder {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount_amount: number;
  coupon_id: string | null;
  coupon_code: string | null;
  total: number;
  status: OrderStatus;
  tracking_id: string | null;
  address_id: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export type OrderStatus =
  | 'pending_payment'
  | 'payment_failed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface DBCart {
  id: string;
  user_id: string;
  items: string[];
  total: number;
  is_cleared: boolean;
  created_at?: string;
  updated_at?: string;
}
