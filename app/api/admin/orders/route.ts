import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/orders — all orders with user + address details, paginated
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(url.searchParams.get('page_size') ?? '20', 10);
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('q'); // search by tracking_id or order id

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabaseAdmin
    .from('orders')
    .select(
      `*, 
       addresses(*),
       users!orders_user_id_fkey(id, name, email, phone_number)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (search) {
    query = query.or(`tracking_id.ilike.%${search}%,id.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) return adminError(error.message, 500);

  return adminSuccess({
    orders: data ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
  });
}
