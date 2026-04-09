'use client';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../layout';
import { Plus, Save, TicketPercent } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  product_ids: string[] | null;
  assigned_user_id: string | null;
  is_active: boolean;
  expires_after_use: boolean;
  created_at: string;
  users?: { name: string; email: string } | null;
}

const emptyForm = {
  code: '',
  discount_type: 'percentage' as 'percentage' | 'fixed_amount',
  discount_value: '',
  product_ids: '',
  assigned_user_email: '',
  is_active: true,
  expires_after_use: true,
};

export default function AdminCoupons() {
  const { token } = useAdminAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const loadCoupons = async () => {
    if (!token) return;
    setLoading(true);
    const res = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) setCoupons(json.data);
    setLoading(false);
  };

  useEffect(() => { loadCoupons(); }, [token]);

  const handleCreate = async () => {
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
      body: JSON.stringify({
        ...form,
        discount_value: Number(form.discount_value),
        product_ids: form.product_ids.split(',').map((id) => id.trim()).filter(Boolean),
        assigned_user_email: form.assigned_user_email.trim() || undefined,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setCoupons((prev) => [json.data, ...prev]);
      setForm(emptyForm);
      setMsg('✓ Coupon created');
    } else {
      setMsg(`✗ ${json.error}`);
    }
    setSaving(false);
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ is_active: !coupon.is_active }),
    });
    const json = await res.json();
    if (json.success) {
      setCoupons((prev) => prev.map((item) => item.id === coupon.id ? json.data : item));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Coupons</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
          <TicketPercent className="w-4 h-4" />
          New Coupon
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Coupon Code</label>
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="NOVER10" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Discount Type</label>
              <select value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed_amount' }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400">
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed ₹</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Discount Value</label>
              <input type="number" min={0} value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))}
                placeholder={form.discount_type === 'percentage' ? '10' : '100'} className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Product IDs <span className="text-zinc-600">(blank = all products)</span></label>
            <input value={form.product_ids} onChange={(e) => setForm((f) => ({ ...f, product_ids: e.target.value }))}
              placeholder="midnight-rush, oud-sovereign" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Specific User Email <span className="text-zinc-600">(optional)</span></label>
            <input value={form.assigned_user_email} onChange={(e) => setForm((f) => ({ ...f, assigned_user_email: e.target.value }))}
              placeholder="customer@example.com" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setForm((f) => ({ ...f, expires_after_use: true }))}
              className={`text-sm px-3 py-1.5 rounded border ${form.expires_after_use ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-zinc-700 text-zinc-400'}`}>
              One-time code
            </button>
            <button onClick={() => setForm((f) => ({ ...f, expires_after_use: false }))}
              className={`text-sm px-3 py-1.5 rounded border ${!form.expires_after_use ? 'border-amber-400/50 bg-amber-400/10 text-amber-400' : 'border-zinc-700 text-zinc-400'}`}>
              Reusable until disabled
            </button>
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-5 py-2 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors">
              <Plus className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-zinc-900 rounded-lg animate-pulse" />)
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-sm">No coupons yet.</div>
        ) : coupons.map((coupon) => (
          <div key={coupon.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold tracking-widest text-zinc-100">{coupon.code}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.is_active ? 'bg-green-400/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {coupon.is_active ? 'Active' : 'Disabled'}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">
                  {coupon.expires_after_use ? 'One-time' : 'Reusable'}
                </span>
              </div>
              <p className="text-sm text-zinc-400 mt-1">
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`}
                {coupon.product_ids?.length ? ` on ${coupon.product_ids.join(', ')}` : ' on all products'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {coupon.users ? `Assigned to ${coupon.users.email}` : 'Available to any signed-in customer'}
              </p>
            </div>
            <button onClick={() => toggleCoupon(coupon)}
              className={`flex items-center justify-center gap-2 text-sm px-4 py-2 rounded border transition-colors ${
                coupon.is_active ? 'border-red-500/40 text-red-400 hover:bg-red-500/10' : 'border-green-500/40 text-green-400 hover:bg-green-500/10'
              }`}>
              <Save className="w-3.5 h-3.5" />
              {coupon.is_active ? 'Set false' : 'Set true'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
