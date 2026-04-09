import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, generateTrackingId, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/orders/verify-payment
 *
 * Called after Razorpay checkout completes on the client.
 *
 * Body:
 *  {
 *    razorpay_order_id: string,
 *    razorpay_payment_id: string,
 *    razorpay_signature: string,
 *    order_id: string          // our internal DB order id
 *  }
 *
 * Returns the confirmed order with tracking_id.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
    return errorResponse('Missing payment verification fields');
  }

  // ── 1. Verify HMAC signature ────────────────────────────────────────────────
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    // Mark order as failed in DB
    await supabaseAdmin
      .from('orders')
      .update({ status: 'payment_failed', razorpay_payment_id })
      .eq('id', order_id)
      .eq('user_id', user.id);
    await supabaseAdmin
      .from('coupon_redemptions')
      .update({ status: 'released', updated_at: new Date().toISOString() })
      .eq('order_id', order_id)
      .eq('user_id', user.id);

    return errorResponse('Payment signature verification failed', 400);
  }

  // ── 2. Confirm ownership of the order ───────────────────────────────────────
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .eq('user_id', user.id)
    .eq('razorpay_order_id', razorpay_order_id)
    .single();

  if (orderErr || !order) return errorResponse('Order not found', 404);

  if (order.status !== 'pending_payment') {
    return errorResponse(`Order is already in status: ${order.status}`, 409);
  }

  // ── 3. Generate tracking ID & confirm order ──────────────────────────────────
  const tracking_id = generateTrackingId();

  const { data: updatedOrder, error: updateErr } = await supabaseAdmin
    .from('orders')
    .update({
      status: 'confirmed',
      razorpay_payment_id,
      razorpay_signature,
      tracking_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)
    .select('*, addresses(*)')
    .single();

  if (updateErr) return errorResponse('Failed to confirm order', 500);

  await supabaseAdmin
    .from('coupon_redemptions')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('order_id', order_id)
    .eq('user_id', user.id);

  // ── 4. Clear the user's active cart ─────────────────────────────────────────
  await supabaseAdmin
    .from('cart')
    .update({ is_cleared: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_cleared', false);

  return successResponse({
    order: updatedOrder,
    tracking_id,
    message: 'Payment verified. Your order has been confirmed!',
  });
}
