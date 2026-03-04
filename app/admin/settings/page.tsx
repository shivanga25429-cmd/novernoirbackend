'use client';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../layout';
import { Save, Truck } from 'lucide-react';

interface ShippingConfig {
  cost: number;
  free_above: number;
}

export default function AdminSettings() {
  const { token } = useAdminAuth();
  const [shipping, setShipping] = useState<ShippingConfig>({ cost: 99, free_above: 2000 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data.shipping) {
          setShipping(j.data.shipping as ShippingConfig);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
      body: JSON.stringify({ shipping }),
    });
    const json = await res.json();
    setMsg(json.success ? '✓ Settings saved' : `✗ ${json.error}`);
    setSaving(false);
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-semibold text-zinc-100">Settings</h1>

      {/* Shipping Config */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Truck className="w-4 h-4 text-amber-400" />
          Shipping Configuration
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            <div className="h-8 bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Shipping Charge (₹)
              </label>
              <input
                type="number"
                min={0}
                value={shipping.cost}
                onChange={(e) => setShipping((s) => ({ ...s, cost: Number(e.target.value) }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-xs text-zinc-500 mt-1">Charge applied to orders below the free-shipping threshold.</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">
                Free Shipping Above (₹)
              </label>
              <input
                type="number"
                min={0}
                value={shipping.free_above}
                onChange={(e) => setShipping((s) => ({ ...s, free_above: Number(e.target.value) }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Orders with subtotal above this amount get free shipping.
                Currently: orders ≥ ₹{shipping.free_above} → Free, below → ₹{shipping.cost}.
              </p>
            </div>

            <div className="bg-zinc-800 rounded p-3 text-xs text-zinc-400">
              <strong className="text-amber-400">Live preview:</strong>{' '}
              Customer orders ₹1,500 worth → pays <strong>₹{shipping.free_above > 1500 ? shipping.cost : 0}</strong> shipping.{' '}
              Customer orders ₹{shipping.free_above + 100} worth → pays <strong>₹0</strong> shipping.
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-5 py-2 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving…' : 'Save Settings'}
              </button>
              {msg && (
                <span className={`text-sm ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                  {msg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin account info */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-medium text-zinc-300 mb-3">Admin Account</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Admin credentials are stored as environment variables on the server (<code className="text-amber-400">ADMIN_USERNAME</code>, <code className="text-amber-400">ADMIN_PASSWORD_HASH</code>).
          They are never exposed to the browser or database.
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed mt-2">
          To change the password, generate a new bcrypt hash:<br />
          <code className="text-amber-400 block mt-1">
            node -e &quot;require(&apos;bcryptjs&apos;).hash(&apos;NewPass&apos;,12).then(console.log)&quot;
          </code>
          Then update <code className="text-amber-400">ADMIN_PASSWORD_HASH</code> in your environment and redeploy.
        </p>
      </div>
    </div>
  );
}
