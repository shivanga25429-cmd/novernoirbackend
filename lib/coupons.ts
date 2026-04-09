import { supabaseAdmin } from '@/lib/supabase';
import type { OrderItem } from '@/lib/supabase';

export interface CouponRow {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  product_ids: string[] | null;
  assigned_user_id: string | null;
  is_active: boolean;
  expires_after_use: boolean;
}

export interface CouponValidationResult {
  coupon: CouponRow;
  discountAmount: number;
  eligibleSubtotal: number;
  eligibleProductIds: string[];
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function validateCouponForItems(
  userId: string,
  rawCode: string,
  items: OrderItem[]
): Promise<{ ok: true; result: CouponValidationResult } | { ok: false; error: string }> {
  const code = normalizeCouponCode(rawCode);
  if (!code) return { ok: false, error: 'Coupon code is required' };
  if (items.length === 0) return { ok: false, error: 'Cart items are required' };

  const { data: coupon, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !coupon) return { ok: false, error: 'Invalid coupon code' };
  const row = coupon as CouponRow;

  if (!row.is_active) return { ok: false, error: 'This coupon is no longer active' };
  if (row.assigned_user_id && row.assigned_user_id !== userId) {
    return { ok: false, error: 'This coupon is not available for your account' };
  }

  if (row.expires_after_use) {
    const { count, error: redemptionError } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_id', row.id)
      .eq('locks_coupon', true)
      .in('status', ['pending_payment', 'confirmed']);

    if (redemptionError) return { ok: false, error: 'Could not verify coupon usage' };
    if ((count ?? 0) > 0) return { ok: false, error: 'This coupon has already been used' };
  }

  const allowedIds = row.product_ids?.filter(Boolean) ?? [];
  const eligibleItems = allowedIds.length > 0
    ? items.filter((item) => allowedIds.includes(item.product_id))
    : items;

  const eligibleSubtotal = eligibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (eligibleSubtotal <= 0) {
    return { ok: false, error: 'This coupon cannot be applied to the items in your cart' };
  }

  const rawDiscount = row.discount_type === 'percentage'
    ? eligibleSubtotal * (Number(row.discount_value) / 100)
    : Number(row.discount_value);
  const discountAmount = Math.min(eligibleSubtotal, Math.max(0, rawDiscount));

  if (discountAmount <= 0) return { ok: false, error: 'This coupon has no discount value' };

  return {
    ok: true,
    result: {
      coupon: row,
      discountAmount: Number(discountAmount.toFixed(2)),
      eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
      eligibleProductIds: eligibleItems.map((item) => item.product_id),
    },
  };
}
