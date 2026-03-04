'use client';
import { useEffect, useState } from 'react';
import { useAdminAuth } from './layout';
import Link from 'next/link';
import {
  Users, ShoppingCart, IndianRupee, Package,
  TrendingUp, Clock, CalendarDays, ShoppingBag,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending_payment:  'text-yellow-400 bg-yellow-400/10',
  payment_failed:   'text-red-400 bg-red-400/10',
  confirmed:        'text-blue-400 bg-blue-400/10',
  processing:       'text-purple-400 bg-purple-400/10',
  shipped:          'text-indigo-400 bg-indigo-400/10',
  out_for_delivery: 'text-orange-400 bg-orange-400/10',
  delivered:        'text-green-400 bg-green-400/10',
  cancelled:        'text-zinc-400 bg-zinc-400/10',
  refunded:         'text-zinc-400 bg-zinc-400/10',
};

const fmt = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

interface DashboardData {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  recent_orders: Array<{
    id: string; status: string; total: number;
    tracking_id: string | null; created_at: string;
    users: { name: string; email: string } | null;
  }>;
  orders_by_status: Record<string, number>;
  revenue: { today: number; week: number; month: number; year: number };
  orders:  { today: number; week: number; month: number };
}

type RevPeriod = 'today' | 'week' | 'month' | 'year';

export default function AdminDashboard() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<RevPeriod>('today');

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => j.success && setData(j.data))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-zinc-500">Failed to load dashboard.</p>;

  const topStats = [
    { label: 'Total Users',   value: data.total_users,   icon: Users,         color: 'text-blue-400' },
    { label: 'Total Orders',  value: data.total_orders,  icon: ShoppingCart,  color: 'text-purple-400' },
    { label: 'Total Revenue', value: fmt(data.total_revenue), icon: IndianRupee, color: 'text-green-400' },
    { label: 'Delivered',     value: data.orders_by_status['delivered'] ?? 0, icon: Package, color: 'text-amber-400' },
  ];

  const todayStats = [
    { label: "Today's Orders",     value: data.orders.today,       icon: ShoppingBag,  color: 'text-sky-400' },
    { label: "Today's Revenue",    value: fmt(data.revenue.today), icon: IndianRupee,  color: 'text-emerald-400' },
    { label: "This Week's Orders", value: data.orders.week,        icon: CalendarDays, color: 'text-violet-400' },
    { label: "This Month's Orders",value: data.orders.month,       icon: TrendingUp,   color: 'text-rose-400' },
  ];

  const revTabs: { key: RevPeriod; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: '7 Days' },
    { key: 'month', label: 'Month' },
    { key: 'year',  label: 'Year' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-amber-400" />
        Dashboard
      </h1>

      {/* All-time stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {topStats.map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Today / this-week / this-month cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {todayStats.map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue period picker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-sm font-medium text-zinc-300">Revenue</h2>
          <div className="flex gap-1">
            {revTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setPeriod(t.key)}
                className={`text-xs px-3 py-1 rounded transition-colors ${
                  period === t.key
                    ? 'bg-amber-400 text-zinc-950 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-4xl font-bold text-green-400">{fmt(data.revenue[period])}</p>
        <p className="text-xs text-zinc-500 mt-1">
          {period === 'today' && 'Since midnight today'}
          {period === 'week'  && 'Last 7 days'}
          {period === 'month' && 'This calendar month'}
          {period === 'year'  && 'This calendar year'}
        </p>
      </div>

      {/* Orders by status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Orders by Status</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(data.orders_by_status).map(([status, count]) => (
            <span
              key={status}
              className={`text-xs px-3 py-1 rounded-full font-medium ${STATUS_COLORS[status] ?? 'bg-zinc-800 text-zinc-300'}`}
            >
              {status.replace(/_/g, ' ')} ({count})
            </span>
          ))}
          {Object.keys(data.orders_by_status).length === 0 && (
            <span className="text-xs text-zinc-500">No orders yet.</span>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Recent Orders
          </h2>
          <Link href="/admin/orders" className="text-xs text-amber-400 hover:underline">View all →</Link>
        </div>
        <div className="divide-y divide-zinc-800">
          {data.recent_orders.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/50 transition-colors"
            >
              <div>
                <p className="text-sm text-zinc-200">#{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-zinc-500">{order.users?.name ?? 'Unknown'}</p>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-zinc-800'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-zinc-400 mt-1">₹{order.total}</p>
              </div>
            </Link>
          ))}
          {data.recent_orders.length === 0 && (
            <p className="px-5 py-6 text-sm text-zinc-500 text-center">No orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}