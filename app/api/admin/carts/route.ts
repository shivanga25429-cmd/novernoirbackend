import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/carts — all non-cleared carts with user info and product details
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const url = new URL(req.url);
  const page  = Math.max(1, Number(url.searchParams.get('page')  ?? 1));
  const limit = Math.min(50, Number(url.searchParams.get('limit') ?? 20));
  const search = url.searchParams.get('q') ?? '';
  const from  = (page - 1) * limit;

  // Fetch carts that are not cleared and have items
  const { data: carts, error: cartsError, count } = await supabaseAdmin
    .from('cart')
    .select(`
      id, user_id, items, total, updated_at,
      users!cart_user_id_fkey(id, name, email, phone_number)
    `, { count: 'exact' })
    .eq('is_cleared', false)
    .order('updated_at', { ascending: false })
    .range(from, from + limit - 1);

  if (cartsError) return adminError(cartsError.message, 500);

  if (!carts || carts.length === 0) {
    return adminSuccess({ carts: [], total: 0, page, limit });
  }

  // Collect all unique product IDs across all carts
  const allProductIds = [...new Set(carts.flatMap((c) => c.items as string[]))];

  // Fetch product details for all referenced products
  const { data: products } = allProductIds.length
    ? await supabaseAdmin
        .from('products')
        .select('id, name, price, original_price, image')
        .in('id', allProductIds)
    : { data: [] };

  const productMap: Record<string, { id: string; name: string; price: number; original_price: number | null; image: string | null }> = {};
  for (const p of products ?? []) productMap[p.id] = p;

  // Enrich carts: map items (array of IDs) → product details with quantity count
  const enriched = carts
    .filter((c) => {
      if (!search) return true;
      const u = c.users as { name?: string; email?: string } | null;
      return u?.name?.toLowerCase().includes(search.toLowerCase()) ||
             u?.email?.toLowerCase().includes(search.toLowerCase());
    })
    .map((c) => {
      // items is an array of product IDs (may have duplicates = quantity)
      const itemIds = c.items as string[];
      const qtyMap: Record<string, number> = {};
      for (const id of itemIds) qtyMap[id] = (qtyMap[id] ?? 0) + 1;

      const cartItems = Object.entries(qtyMap).map(([id, qty]) => ({
        product_id: id,
        quantity: qty,
        product: productMap[id] ?? null,
      }));

      return {
        id: c.id,
        user: c.users,
        items: cartItems,
        item_count: itemIds.length,
        total: c.total,
        updated_at: c.updated_at,
      };
    });

  return adminSuccess({ carts: enriched, total: count ?? 0, page, limit });
}
