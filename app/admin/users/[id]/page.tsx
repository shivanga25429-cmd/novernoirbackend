'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../layout';
import { ArrowLeft, ShoppingCart, MapPin, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS: Record<string, string> = {
  confirmed:        'text-blue-400 bg-blue-400/10',
  delivered:        'text-green-400 bg-green-400/10',
  shipped:          'text-indigo-400 bg-indigo-400/10',
  cancelled:        'text-zinc-400 bg-zinc-400/10',
  pending_payment:  'text-yellow-400 bg-yellow-400/10',
  payment_failed:   'text-red-400 bg-red-400/10',
  processing:       'text-purple-400 bg-purple-400/10',
  out_for_delivery: 'text-orange-400 bg-orange-400/10',
  refunded:         'text-zinc-400 bg-zinc-400/10',
};

interface Address {
  id: string; label: string; full_name: string; phone: string;
  address_line1: string; address_line2?: string;
  city: string; state: string; pincode: string; country: string;
  is_default: boolean;
}

interface CartProduct { name: string; price: number; image: string | null }
interface CartItem { product_id: string; quantity: number; product: CartProduct | null }
interface Cart { total: number; updated_at: string; items: CartItem[] }

interface UserDetail {
  user: { id: string; name: string; email: string; phone_number: string; created_at: string };
  orders: Array<{ id: string; status: string; total: number; tracking_id: string | null; created_at: string }>;
  order_count: number;
  addresses: Address[];
  cart: Cart | null;
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

  const { user, orders, addresses, cart } = data;

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
        <div><p className="text-xs text-zinc-500 mb-0.5">User ID</p><p className="text-zinc-400 font-mono text-xs break-all">{user.id}</p></div>
        <div><p className="text-xs text-zinc-500 mb-0.5">Joined</p><p className="text-zinc-200">{new Date(user.created_at).toLocaleDateString('en-IN')}</p></div>
      </div>

      {/* Saved Addresses */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <MapPin className="w-4 h-4 text-amber-400" />
          Saved Addresses ({addresses.length})
        </div>
        {addresses.length === 0 ? (
          <p className="text-center py-6 text-zinc-500 text-sm">No saved addresses</p>
        ) : (
          <div className="divide-y divide-zinc-800">
            {addresses.map((addr) => (
              <div key={addr.id} className="px-5 py-4 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{addr.label}</span>
                  {addr.is_default && (
                    <span className="text-xs bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded">Default</span>
                  )}
                  <span className="text-zinc-300 font-medium">{addr.full_name}</span>
                  <span className="text-zinc-500">· {addr.phone}</span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}, {addr.city}, {addr.state} – {addr.pincode}, {addr.country}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Current Cart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 font-medium text-zinc-300">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            Current Cart
          </div>
          {cart && (
            <span className="text-xs text-zinc-500">
              Last updated {new Date(cart.updated_at).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>
        {!cart || cart.items.length === 0 ? (
          <p className="text-center py-6 text-zinc-500 text-sm">Cart is empty</p>
        ) : (
          <>
            <div className="divide-y divide-zinc-800">
              {cart.items.map((item) => (
                <div key={item.product_id} className="flex items-center gap-4 px-5 py-3">
                  {item.product?.image ? (
                    <img src={item.product.image} alt={item.product.name}
                      className="w-10 h-12 object-cover rounded bg-zinc-800 flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-12 bg-zinc-800 rounded flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-200 truncate">{item.product?.name ?? item.product_id}</p>
                    <p className="text-xs text-zinc-500">₹{item.product?.price ?? '—'}</p>
                  </div>
                  <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded flex-shrink-0">× {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-zinc-800/30 flex justify-end">
              <p className="text-sm font-semibold text-zinc-100">
                Total: <span className="text-amber-400">₹{cart.total}</span>
              </p>
            </div>
          </>
        )}
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