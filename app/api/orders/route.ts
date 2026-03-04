import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/orders — list all orders for authenticated user
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const pageSize = parseInt(url.searchParams.get('page_size') ?? '10', 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error: dbErr, count } = await supabaseAdmin
    .from('orders')
    .select('*, addresses(*)', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (dbErr) return errorResponse(dbErr.message, 500);

  return successResponse({
    orders: data ?? [],
    total: count ?? 0,
    page,
    page_size: pageSize,
  });
}
