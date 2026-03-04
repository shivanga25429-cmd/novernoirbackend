'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../layout';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'text-blue-400 bg-blue-400/10',
  delivered: 'text-green-400 bg-green-400/10',
  shipped: 'text-indigo-400 bg-indigo-400/10',
  cancelled: 'text-zinc-400 bg-zinc-400/10',
  pending_payment: 'text-yellow-400 bg-yellow-400/10',
};

interface UserDetail {
  user: { id: string; name: string; email: string; phone_number: string; created_at: string };
  orders: Array<{ id: string; status: string; total: number; tracking_id: string | null; created_at: string }>;
  order_count: number;
}

export default function AdminUserDetail() {
  const { token } = useAdminAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => j.success && setData(j.data))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) return <div className="bg-zinc-900 rounded-lg h-40 animate-pulse" />;
  if (!data) return <p className="text-zinc-500">User not found.</p>;

  const { user, orders } = data;

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-zinc-100">{user.name}</h1>
      </div>

      {/* User info card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 grid grid-cols-2 gap-3 text-sm">
        <div><p className="text-xs text-zinc-500 mb-0.5">Email</p><p className="text-zinc-200">{user.email}</p></div>
        <div><p className="text-xs text-zinc-500 mb-0.5">Phone</p><p className="text-zinc-200">{user.phone_number}</p></div>
        <div><p className="text-xs text-zinc-500 mb-0.5">User ID</p><p className="text-zinc-400 font-mono text-xs">{user.id}</p></div>
        <div><p className="text-xs text-zinc-500 mb-0.5">Joined</p><p className="text-zinc-200">{new Date(user.created_at).toLocaleDateString('en-IN')}</p></div>
      </div>

      {/* Orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ShoppingCart className="w-4 h-4 text-amber-400" />
          Orders ({data.order_count})
        </div>
        {orders.length === 0 ? (
          <p className="text-center py-8 text-zinc-500 text-sm">No orders yet</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/40 transition-colors"
              >
                <div>
                  <p className="text-sm text-zinc-200 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] ?? 'bg-zinc-800 text-zinc-400'}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <p className="text-xs text-zinc-400 mt-1">₹{order.total}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
