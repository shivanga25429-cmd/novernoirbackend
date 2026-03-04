'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../layout';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

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

const ALL_STATUSES = [
  'all', 'pending_payment', 'confirmed', 'processing',
  'shipped', 'out_for_delivery', 'delivered', 'payment_failed',
  'cancelled', 'refunded',
];

interface Order {
  id: string;
  status: string;
  total: number;
  tracking_id: string | null;
  created_at: string;
  users: { name: string; email: string } | null;
  addresses: { city: string; state: string } | null;
}

export default function AdminOrders() {
  const { token } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: '20' });
    if (search) params.set('q', search);
    if (status !== 'all') params.set('status', status);

    const res = await fetch(`/api/admin/orders?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      setOrders(json.data.orders);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [token, page, search, status]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-100">Orders</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID or tracking ID…"
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Tracking</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-zinc-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-200">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-zinc-200">{order.users?.name ?? '—'}</p>
                      <p className="text-xs text-zinc-500">{order.users?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-zinc-800'}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">
                      {order.tracking_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-200">₹{order.total}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-amber-400 hover:underline">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-sm text-zinc-500">
          <span>Showing {Math.min((page - 1) * 20 + 1, total)}–{Math.min(page * 20, total)} of {total}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1 disabled:opacity-30 hover:text-zinc-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage((p) => p + 1)}
              className="p-1 disabled:opacity-30 hover:text-zinc-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
