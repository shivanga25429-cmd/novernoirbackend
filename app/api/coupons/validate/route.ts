import { NextRequest } from 'next/server';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { validateCouponForItems } from '@/lib/coupons';
import type { OrderItem } from '@/lib/supabase';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const { code, items } = body as {
    code: string;
    items: { product_id: string; quantity: number }[];
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return errorResponse('Cart items are required');
  }

  const productIds = items.map((item) => item.product_id);
  const { data: products, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name, price, image, is_active, is_out_of_stock')
    .in('id', productIds);

  if (productError || !products) return errorResponse('Could not verify product prices', 500);
  const productMap = new Map(products.map((product) => [product.id, product]));

  const verifiedItems: OrderItem[] = [];
  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) return errorResponse(`Product not found: ${item.product_id}`, 400);
    if (!product.is_active) return errorResponse(`${product.name} is not available`, 400);
    if (product.is_out_of_stock) return errorResponse(`${product.name} is out of stock`, 400);
    if (item.quantity <= 0) return errorResponse(`Invalid quantity for ${product.name}`, 400);
    verifiedItems.push({
      product_id: item.product_id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.image ?? undefined,
    });
  }

  const validation = await validateCouponForItems(user.id, code, verifiedItems);
  if (!validation.ok) return errorResponse(validation.error, 400);

  return successResponse({
    code: validation.result.coupon.code,
    discount_type: validation.result.coupon.discount_type,
    discount_value: validation.result.coupon.discount_value,
    discount_amount: validation.result.discountAmount,
    eligible_subtotal: validation.result.eligibleSubtotal,
    eligible_product_ids: validation.result.eligibleProductIds,
  });
}
