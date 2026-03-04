import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/dashboard — aggregated stats
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const [
    { count: totalUsers },
    { count: totalOrders },
    { data: revenueData },
    { data: recentOrders },
    { data: statusBreakdown },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    // Sum revenue from confirmed/delivered orders
    supabaseAdmin
      .from('orders')
      .select('total')
      .in('status', ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered']),
    // Last 5 orders
    supabaseAdmin
      .from('orders')
      .select('id, status, total, tracking_id, created_at, users!orders_user_id_fkey(name, email)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Count per status
    supabaseAdmin
      .from('orders')
      .select('status')
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const row of data ?? []) {
          counts[row.status] = (counts[row.status] ?? 0) + 1;
        }
        return { data: counts };
      }),
  ]);

  const totalRevenue = revenueData?.reduce((s, r) => s + Number(r.total), 0) ?? 0;

  return adminSuccess({
    total_users: totalUsers ?? 0,
    total_orders: totalOrders ?? 0,
    total_revenue: totalRevenue,
    recent_orders: recentOrders ?? [],
    orders_by_status: statusBreakdown ?? {},
  });
}
