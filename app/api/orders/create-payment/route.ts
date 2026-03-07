import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { razorpay } from '@/lib/razorpay';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';
import type { OrderItem } from '@/lib/supabase';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/orders/create-payment
 *
 * Body:
 *  {
 *    items: OrderItem[],
 *    address_id: string,
 *    notes?: string
 *  }
 *
 * Returns:
 *  {
 *    razorpay_order_id: string,
 *    amount: number,          // in paise
 *    currency: string,
 *    order_id: string,        // our DB order id
 *    key_id: string
 *  }
 */
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const { items, address_id, notes } = body as {
    items: OrderItem[];
    address_id: string;
    notes?: string;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse('Cart items are required');
  }
  if (!address_id) return errorResponse('Delivery address is required');

  // Verify address belongs to this user
  const { data: address, error: addrErr } = await supabaseAdmin
    .from('addresses')
    .select('id')
    .eq('id', address_id)
    .eq('user_id', user.id)
    .single();

  if (addrErr || !address) return errorResponse('Invalid delivery address', 404);

  // Fetch live prices from DB to prevent client-side price tampering
  const productIds = items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('id, name, price, image')
    .in('id', productIds);

  if (prodErr || !products) return errorResponse('Could not verify product prices', 500);

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Fetch dynamic shipping config from app_settings
  const { data: shippingConfig } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'shipping')
    .single();

  const SHIPPING_COST: number = (shippingConfig?.value as { cost: number; free_above: number })?.cost ?? 49;
  const SHIPPING_THRESHOLD: number = (shippingConfig?.value as { cost: number; free_above: number })?.free_above ?? 2000;

  // Build verified order items with server-side prices
  const verifiedItems: OrderItem[] = items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product) throw new Error(`Product not found: ${item.product_id}`);
    return {
      product_id: item.product_id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image ?? undefined,
    };
  });

  const subtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = 0;
  const shipping = subtotal > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = parseFloat((subtotal + tax + shipping).toFixed(2));
  const amountInPaise = Math.round(total * 100); // Razorpay uses smallest currency unit

  // Create a pending order in DB first
  const { data: orderRecord, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: user.id,
      items: verifiedItems,
      subtotal,
      tax,
      shipping,
      total,
      status: 'pending_payment',
      address_id,
      notes: notes ?? null,
      razorpay_order_id: null,
      razorpay_payment_id: null,
      razorpay_signature: null,
      tracking_id: null,
    })
    .select()
    .single();

  if (orderErr || !orderRecord) {
    console.error('Order DB insert error:', orderErr);
    return errorResponse('Failed to create order', 500);
  }

  // Create Razorpay order
  let rzpOrder: { id: string; amount: number; currency: string };
  try {
    rzpOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderRecord.id,
      notes: {
        order_id: orderRecord.id,
        user_id: user.id,
      },
    }) as { id: string; amount: number; currency: string };
  } catch (rzpErr: unknown) {
    console.error('Razorpay order creation failed:', rzpErr);
    // Mark our order as failed
    await supabaseAdmin
      .from('orders')
      .update({ status: 'payment_failed' })
      .eq('id', orderRecord.id);
    return errorResponse('Payment gateway error', 502);
  }

  // Persist Razorpay order ID back to our record
  await supabaseAdmin
    .from('orders')
    .update({ razorpay_order_id: rzpOrder.id })
    .eq('id', orderRecord.id);

  return successResponse(
    {
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      order_id: orderRecord.id,
      key_id: process.env.RAZORPAY_KEY_ID,
      prefill: {
        name: user.user_metadata?.name ?? '',
        email: user.email ?? '',
        contact: user.user_metadata?.phone_number ?? '',
      },
    },
    201
  );
}
