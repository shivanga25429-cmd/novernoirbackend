import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/users/[id] — get user with their order history
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;

  const [userResult, ordersResult] = await Promise.all([
    supabaseAdmin.from('users').select('*').eq('id', id).single(),
    supabaseAdmin
      .from('orders')
      .select('id, status, total, tracking_id, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  if (userResult.error || !userResult.data) return adminError('User not found', 404);

  return adminSuccess({
    user: userResult.data,
    orders: ordersResult.data ?? [],
    order_count: ordersResult.data?.length ?? 0,
  });
}
