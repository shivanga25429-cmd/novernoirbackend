import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';
import type { OrderStatus } from '@/lib/supabase';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

const VALID_STATUSES: OrderStatus[] = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
];

// PATCH /api/admin/orders/[id] — update order status (and optionally tracking_id)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) {
    if (!VALID_STATUSES.includes(body.status)) {
      return adminError(`Invalid status: ${body.status}`);
    }
    update.status = body.status;
  }

  if (body.tracking_id !== undefined) {
    update.tracking_id = body.tracking_id;
  }

  if (Object.keys(update).length === 1) return adminError('Nothing to update');

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(update)
    .eq('id', id)
    .select('*, addresses(*), users!orders_user_id_fkey(id, name, email)')
    .single();

  if (error) return adminError(error.message, 500);
  if (!data) return adminError('Order not found', 404);

  return adminSuccess(data);
}

// GET /api/admin/orders/[id] — get single order with full details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, addresses(*), users!orders_user_id_fkey(id, name, email, phone_number)')
    .eq('id', id)
    .single();

  if (error || !data) return adminError('Order not found', 404);

  return adminSuccess(data);
}
