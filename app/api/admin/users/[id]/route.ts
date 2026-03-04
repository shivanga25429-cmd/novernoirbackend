import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/users/[id] — get user with their order history, addresses and cart
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;

  const [userResult, ordersResult, addressesResult, cartResult] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('orders')
      .select('id, status, total, tracking_id, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('user_id', id)
      .order('is_default', { ascending: false }),
    supabaseAdmin
      .from('cart')
      .select('items, total, updated_at')
      .eq('user_id', id)
      .eq('is_cleared', false)
      .maybeSingle(),
  ]);

  if (userResult.error || !userResult.data) return adminError('User not found', 404);

  // Enrich cart items with product details
  let cartItems = null;
  if (cartResult.data?.items?.length) {
    const itemIds = cartResult.data.items as string[];
    const qtyMap: Record<string, number> = {};
    for (const pid of itemIds) qtyMap[pid] = (qtyMap[pid] ?? 0) + 1;

    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, price, image')
      .in('id', Object.keys(qtyMap));

    const productMap: Record<string, { name: string; price: number; image: string | null }> = {};
    for (const p of products ?? []) productMap[p.id] = p;

    cartItems = {
      total: cartResult.data.total,
      updated_at: cartResult.data.updated_at,
      items: Object.entries(qtyMap).map(([pid, qty]) => ({
        product_id: pid,
        quantity: qty,
        product: productMap[pid] ?? null,
      })),
    };
  }

  return adminSuccess({
    user: userResult.data,
    orders: ordersResult.data ?? [],
    order_count: ordersResult.data?.length ?? 0,
    addresses: addressesResult.data ?? [],
    cart: cartItems,
  });
}
