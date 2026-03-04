import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET /api/orders/[id]/track
 *
 * Public-ish endpoint: anyone with the order ID + auth token can see tracking.
 * Returns status, tracking_id, timeline events.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { id } = await params;

  const { data: order, error: dbErr } = await supabaseAdmin
    .from('orders')
    .select('id, status, tracking_id, created_at, updated_at, items, total, addresses(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (dbErr || !order) return errorResponse('Order not found', 404);

  // Build a human-readable timeline based on current status
  const statusTimeline = buildTimeline(order.status as string, order.created_at as string);

  return successResponse({
    order_id: order.id,
    tracking_id: order.tracking_id,
    status: order.status,
    total: order.total,
    items: order.items,
    address: (order as Record<string, unknown>).addresses,
    timeline: statusTimeline,
    placed_at: order.created_at,
    last_updated: order.updated_at,
  });
}

// ─── Status ordering ──────────────────────────────────────────────────────────

const STATUS_ORDER = [
  'pending_payment',
  'payment_failed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const;

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Payment Pending',
  payment_failed: 'Payment Failed',
  confirmed: 'Order Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  pending_payment: 'Waiting for payment confirmation.',
  payment_failed: 'Payment was not successful.',
  confirmed: 'Your order has been confirmed and will be processed shortly.',
  processing: 'We are packing your items.',
  shipped: 'Your order is on its way!',
  out_for_delivery: 'Your order is out for delivery today.',
  delivered: 'Your order has been delivered. Enjoy!',
  cancelled: 'This order has been cancelled.',
  refunded: 'A refund has been initiated.',
};

function buildTimeline(currentStatus: string, placedAt: string) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus as typeof STATUS_ORDER[number]);

  return STATUS_ORDER.map((status, idx) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    description: STATUS_DESCRIPTIONS[status] ?? '',
    completed: idx <= currentIndex,
    active: status === currentStatus,
  }));
}
