import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

const PAID = ['confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

function startOf(period: 'today' | 'week' | 'month' | 'year'): string {
  const now = new Date();
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  }
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
  // year
  return new Date(now.getFullYear(), 0, 1).toISOString();
}

async function revenueFrom(from: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('total')
    .in('status', PAID)
    .gte('created_at', from);
  return data?.reduce((s, r) => s + Number(r.total), 0) ?? 0;
}

async function ordersFrom(from: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', from);
  return count ?? 0;
}

// GET /api/admin/dashboard — aggregated stats
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const todayStart = startOf('today');
  const weekStart  = startOf('week');
  const monthStart = startOf('month');
  const yearStart  = startOf('year');

  const [
    { count: totalUsers },
    { count: totalOrders },
    { data: allRevenueData },
    { data: recentOrders },
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    todayOrders,
    weekOrders,
    monthOrders,
    { data: allOrdersForStatus },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('orders').select('total').in('status', PAID),
    supabaseAdmin
      .from('orders')
      .select('id, status, total, tracking_id, created_at, users!orders_user_id_fkey(name, email)')
      .order('created_at', { ascending: false })
      .limit(10),
    revenueFrom(todayStart),
    revenueFrom(weekStart),
    revenueFrom(monthStart),
    revenueFrom(yearStart),
    ordersFrom(todayStart),
    ordersFrom(weekStart),
    ordersFrom(monthStart),
    supabaseAdmin.from('orders').select('status'),
  ]);

  const totalRevenue = allRevenueData?.reduce((s, r) => s + Number(r.total), 0) ?? 0;

  const statusCounts: Record<string, number> = {};
  for (const row of allOrdersForStatus ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  return adminSuccess({
    total_users: totalUsers ?? 0,
    total_orders: totalOrders ?? 0,
    total_revenue: totalRevenue,
    recent_orders: recentOrders ?? [],
    orders_by_status: statusCounts,
    revenue: {
      today: todayRevenue,
      week: weekRevenue,
      month: monthRevenue,
      year: yearRevenue,
    },
    orders: {
      today: todayOrders,
      week: weekOrders,
      month: monthOrders,
    },
  });
}
