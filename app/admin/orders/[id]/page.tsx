'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminAuth } from '../../layout';
import { ArrowLeft, Save, MapPin, Package } from 'lucide-react';

const ALL_STATUSES = [
  'pending_payment', 'confirmed', 'processing',
  'shipped', 'out_for_delivery', 'delivered',
  'payment_failed', 'cancelled', 'refunded',
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'text-yellow-400',
  payment_failed: 'text-red-400',
  confirmed: 'text-green-400',
  processing: 'text-purple-400',
  shipped: 'text-indigo-400',
  out_for_delivery: 'text-orange-400',
  delivered: 'text-green-400',
  cancelled: 'text-zinc-400',
  refunded: 'text-zinc-400',
};

const STATUS_DISPLAY: Record<string, string> = {
  pending_payment: 'Payment Pending',
  payment_failed: 'Payment Failed',
  confirmed: 'Payment Received',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

interface OrderDetail {
  id: string;
  status: string;
  tracking_id: string | null;
  total: number;
  subtotal: number;
  tax: number;
  shipping: number;
  created_at: string;
  razorpay_payment_id: string | null;
  items: Array<{ product_id: string; name: string; price: number; quantity: number }>;
  addresses: {
    full_name: string; phone: string; address_line1: string;
    address_line2?: string; city: string; state: string; pincode: string; country: string;
  } | null;
  users: { name: string; email: string; phone_number: string } | null;
}

export default function AdminOrderDetail() {
  const { token } = useAdminAuth();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newTracking, setNewTracking] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/admin/orders/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setOrder(j.data);
          setNewStatus(j.data.status);
          setNewTracking(j.data.tracking_id ?? '');
        }
      })
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleSave = async () => {
    if (!token || !id) return;
    setSaving(true);
    setMsg('');
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        status: newStatus,
        tracking_id: newTracking || null,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setOrder(json.data);
      setMsg('✓ Order updated successfully');
    } else {
      setMsg(`✗ ${json.error}`);
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="bg-zinc-900 rounded-lg h-64 animate-pulse" />;
  }
  if (!order) {
    return <p className="text-zinc-500">Order not found.</p>;
  }

  const addr = order.addresses;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-zinc-100">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <span className={`text-sm font-medium ${STATUS_COLORS[order.status] ?? 'text-zinc-400'}`}>
          {STATUS_DISPLAY[order.status] ?? order.status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Update status */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-medium text-zinc-300">Update Order</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Status</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_DISPLAY[s] ?? s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Tracking ID</label>
            <input
              value={newTracking}
              onChange={(e) => setNewTracking(e.target.value)}
              placeholder="NVR-20260304-XXXX"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-4 py-2 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {msg && <span className={`text-sm ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
        </div>
      </div>

      {/* Customer + payment info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs text-zinc-500 mb-3">Customer</h2>
          <p className="text-zinc-200 font-medium">{order.users?.name ?? '—'}</p>
          <p className="text-xs text-zinc-400">{order.users?.email}</p>
          <p className="text-xs text-zinc-400">{order.users?.phone_number}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs text-zinc-500 mb-3">Payment</h2>
          <p className="text-xs text-zinc-400">
            Razorpay ID: <span className="text-zinc-200 font-mono">{order.razorpay_payment_id ?? '—'}</span>
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Date: {new Date(order.created_at).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Items */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Package className="w-4 h-4 text-amber-400" /> Items
        </div>
        <div className="divide-y divide-zinc-800">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center px-5 py-3 text-sm">
              <div>
                <p className="text-zinc-200">{item.name}</p>
                <p className="text-xs text-zinc-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-zinc-300">₹{(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 border-t border-zinc-800 space-y-1 text-sm">
          <div className="flex justify-between text-zinc-500"><span>Subtotal</span><span>₹{order.subtotal}</span></div>
          <div className="flex justify-between text-zinc-500"><span>Shipping</span><span>{order.shipping === 0 ? 'Free' : `₹${order.shipping}`}</span></div>
          <div className="flex justify-between font-semibold text-zinc-100 pt-1 border-t border-zinc-800"><span>Total</span><span>₹{order.total}</span></div>
        </div>
      </div>

      {/* Address */}
      {addr && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
          <h2 className="text-xs text-zinc-500 mb-3 flex items-center gap-1"><MapPin className="w-3 h-3" /> Delivery Address</h2>
          <p className="text-zinc-200">{addr.full_name}</p>
          <p className="text-xs text-zinc-400">{addr.phone}</p>
          <p className="text-xs text-zinc-400">{addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ''}</p>
          <p className="text-xs text-zinc-400">{addr.city}, {addr.state} – {addr.pincode}</p>
        </div>
      )}
    </div>
  );
}
