import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { generateTrackingId } from '@/lib/auth';
import type { OrderStatus } from '@/lib/supabase';

/**
 * POST /api/webhooks/razorpay
 *
 * Razorpay sends signed webhook events here.
 * Set this URL in your Razorpay Dashboard → Settings → Webhooks.
 *
 * Handles:
 *  - payment.captured  → confirm order
 *  - payment.failed    → mark as payment_failed
 *  - refund.processed  → mark as refunded
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // ── Verify webhook signature ──────────────────────────────────────────────
  const expectedSig = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex');

  if (expectedSig !== signature) {
    console.warn('[Webhook] Invalid Razorpay signature');
    return Response.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = event.event;

  // ── payment.captured ─────────────────────────────────────────────────────
  if (eventType === 'payment.captured') {
    const payment = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    const rzpOrderId = payment?.order_id as string;
    const paymentId = payment?.id as string;

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, status, tracking_id')
      .eq('razorpay_order_id', rzpOrderId)
      .single();

    if (order && order.status === 'pending_payment') {
      const tracking_id = order.tracking_id ?? generateTrackingId();
      await supabaseAdmin
        .from('orders')
        .update({
          status: 'confirmed' as OrderStatus,
          razorpay_payment_id: paymentId,
          tracking_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      // Clear the user's cart
      const { data: fullOrder } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', order.id)
        .single();

      if (fullOrder) {
        await supabaseAdmin
          .from('cart')
          .update({ is_cleared: true, updated_at: new Date().toISOString() })
          .eq('user_id', (fullOrder as Record<string, unknown>).user_id)
          .eq('is_cleared', false);
      }
    }
  }

  // ── payment.failed ────────────────────────────────────────────────────────
  if (eventType === 'payment.failed') {
    const payment = (event.payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown>;
    const rzpOrderId = payment?.order_id as string;

    await supabaseAdmin
      .from('orders')
      .update({
        status: 'payment_failed' as OrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_order_id', rzpOrderId)
      .eq('status', 'pending_payment');
  }

  // ── refund.processed ─────────────────────────────────────────────────────
  if (eventType === 'refund.processed') {
    const refund = (event.payload?.refund as Record<string, unknown>)?.entity as Record<string, unknown>;
    const paymentId = refund?.payment_id as string;

    await supabaseAdmin
      .from('orders')
      .update({
        status: 'refunded' as OrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('razorpay_payment_id', paymentId);
  }

  return Response.json({ received: true }, { status: 200 });
}
