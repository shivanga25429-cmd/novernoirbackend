import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';
import { normalizeCouponCode } from '@/lib/coupons';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*, users!coupons_assigned_user_id_fkey(name, email)')
    .order('created_at', { ascending: false });

  if (error) return adminError(error.message, 500);
  return adminSuccess(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const {
    code,
    discount_type,
    discount_value,
    product_ids,
    assigned_user_email,
    is_active,
    expires_after_use,
  } = body as {
    code?: string;
    discount_type?: string;
    discount_value?: number;
    product_ids?: string[];
    assigned_user_email?: string;
    is_active?: boolean;
    expires_after_use?: boolean;
  };

  if (!code) return adminError('Coupon code is required');
  if (discount_type !== 'percentage' && discount_type !== 'fixed_amount') {
    return adminError('Discount type must be percentage or fixed_amount');
  }
  const discountValue = Number(discount_value);
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return adminError('Discount value must be greater than 0');
  }
  if (discount_type === 'percentage' && discountValue > 100) {
    return adminError('Percentage discount cannot be greater than 100');
  }

  let assignedUserId: string | null = null;
  const email = assigned_user_email?.trim();
  if (email) {
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .single();
    if (userError || !user) return adminError('Assigned user email was not found', 404);
    assignedUserId = user.id;
  }

  const cleanProductIds = Array.isArray(product_ids)
    ? product_ids.map((id) => id.trim()).filter(Boolean)
    : [];

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: normalizeCouponCode(code),
      discount_type,
      discount_value: discountValue,
      product_ids: cleanProductIds.length > 0 ? cleanProductIds : null,
      assigned_user_id: assignedUserId,
      is_active: is_active !== false,
      expires_after_use: expires_after_use !== false,
    })
    .select('*, users!coupons_assigned_user_id_fkey(name, email)')
    .single();

  if (error) return adminError(error.message, 500);
  return adminSuccess(data, 201);
}
