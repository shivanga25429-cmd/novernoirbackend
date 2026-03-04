'use client';
import { useEffect, useState } from 'react';
import { useAdminAuth } from './layout';
import Link from 'next/link';
import {
  Users,
  ShoppingCart,
  IndianRupee,
  Package,
  TrendingUp,
  Clock,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
  payment_failed: 'text-red-400 bg-red-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  processing: 'text-purple-400 bg-purple-400/10',
  shipped: 'text-indigo-400 bg-indigo-400/10',
  out_for_delivery: 'text-orange-400 bg-orange-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  cancelled: 'text-zinc-400 bg-zinc-400/10',
  refunded: 'text-zinc-400 bg-zinc-400/10',
};

interface DashboardData {
  total_users: number;
  total_orders: number;
  total_revenue: number;
  recent_orders: Array<{
    id: string;
    status: string;
    total: number;
    tracking_id: string | null;
    created_at: string;
    users: { name: string; email: string } | null;
  }>;
  orders_by_status: Record<string, number>;
}

export default function AdminDashboard() {
  const { token } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-lg h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return <p className="text-zinc-500">Failed to load dashboard.</p>;

  const stats = [
    { label: 'Total Users', value: data.total_users, icon: Users, color: 'text-blue-400' },
    { label: 'Total Orders', value: data.total_orders, icon: ShoppingCart, color: 'text-purple-400' },
    {
      label: 'Revenue',
      value: `₹${data.total_revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      icon: IndianRupee,
      color: 'text-green-400',
    },
    {
      label: 'Delivered',
      value: data.orders_by_status['delivered'] ?? 0,
      icon: Package,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-amber-400" />
        Dashboard
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-500">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
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
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Recent Orders
          </h2>
          <Link href="/admin/orders" className="text-xs text-amber-400 hover:underline">
            View all →
          </Link>
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
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-zinc-800'}`}
                >
                  {order.status.replace(/_/g, ' ')}
                </span>
                <p className="text-xs text-zinc-400 mt-1">₹{order.total}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
