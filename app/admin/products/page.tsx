'use client';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../layout';
import { Save, Tag, Eye, EyeOff, Percent, Plus, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  description: string | null;
  fragrance_family: string | null;
  image: string | null;
  is_active: boolean;
}

function discountPct(original: number | null, selling: number): string {
  if (!original || original <= selling) return '';
  return Math.round(((original - selling) / original) * 100) + '% OFF';
}

function ProductRow({ product, token, onUpdate }: {
  product: Product;
  token: string;
  onUpdate: (updated: Product) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price),
    original_price: product.original_price != null ? String(product.original_price) : '',
    description: product.description ?? '',
    is_active: product.is_active,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setMsg('');
    const body: Record<string, unknown> = {
      name: form.name,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      description: form.description,
      is_active: form.is_active,
    };
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (json.success) {
      onUpdate(json.data);
      setMsg('✓ Saved');
      setEditing(false);
    } else {
      setMsg(`✗ ${json.error}`);
    }
    setSaving(false);
  };

  const discount = discountPct(product.original_price, product.price);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-4 p-4">
        {product.image && (
          <img src={product.image} alt={product.name} className="w-16 h-20 object-cover rounded flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-100">{product.name}</h3>
              <p className="text-xs text-zinc-500">{product.fragrance_family}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-base font-bold text-amber-400">₹{product.price}</span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-xs text-zinc-500 line-through">₹{product.original_price}</span>
                    <span className="text-xs bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                      <Percent className="w-3 h-3" />
                      {discount}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_active ? 'bg-green-400/10 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                {product.is_active ? 'Active' : 'Hidden'}
              </span>
              <button
                onClick={() => setEditing((e) => !e)}
                className="text-xs text-amber-400 hover:underline"
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="border-t border-zinc-800 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Product Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Selling Price (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="899"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> MRP / Original (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.original_price}
                  onChange={(e) => setForm((f) => ({ ...f, original_price: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
                  placeholder="1499 (shown as strikethrough)"
                />
                {form.original_price && form.price && parseFloat(form.original_price) > parseFloat(form.price) && (
                  <p className="text-xs text-green-400 mt-1">
                    Shows: {Math.round(((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price)) * 100)}% OFF
                  </p>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition-colors ${
                form.is_active
                  ? 'border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {form.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {form.is_active ? 'Visible to customers' : 'Hidden from shop'}
            </button>

            <div className="flex items-center gap-3">
              {msg && <span className={`text-xs ${msg.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>{msg}</span>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-4 py-1.5 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  const { token } = useAdminAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '', price: '', original_price: '', description: '',
    fragrance_family: '', image: '',
    top_notes: '', middle_notes: '', base_notes: '',
    is_active: true,
  });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((j) => j.success && setProducts(j.data))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpdate = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleAdd = async () => {
    if (!addForm.name || !addForm.price) { setAddMsg('Name and price are required'); return; }
    setAdding(true); setAddMsg('');
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token!}` },
      body: JSON.stringify({
        name: addForm.name.trim(),
        price: parseFloat(addForm.price),
        original_price: addForm.original_price ? parseFloat(addForm.original_price) : null,
        description: addForm.description || null,
        fragrance_family: addForm.fragrance_family || null,
        image: addForm.image || null,
        top_notes: addForm.top_notes ? addForm.top_notes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        middle_notes: addForm.middle_notes ? addForm.middle_notes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        base_notes: addForm.base_notes ? addForm.base_notes.split(',').map((s) => s.trim()).filter(Boolean) : [],
        is_active: addForm.is_active,
      }),
    });
    const json = await res.json();
    if (json.success) {
      setProducts((prev) => [json.data, ...prev]);
      setAddForm({ name: '', price: '', original_price: '', description: '', fragrance_family: '', image: '', top_notes: '', middle_notes: '', base_notes: '', is_active: true });
      setShowAdd(false);
      setAddMsg('');
    } else {
      setAddMsg(`✗ ${json.error}`);
    }
    setAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Products <span className="text-zinc-500 text-sm font-normal">({products.length})</span></h1>
        <button
          onClick={() => { setShowAdd((v) => !v); setAddMsg(''); }}
          className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-4 py-2 text-sm hover:bg-amber-300 transition-colors"
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAdd ? 'Cancel' : 'Add Product'}
        </button>
      </div>

      {/* Add product form */}
      {showAdd && (
        <div className="bg-zinc-900 border border-amber-400/30 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-amber-400">New Product</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Product Name *</label>
              <input value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Midnight Rush" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1"><Tag className="w-3 h-3" /> Selling Price (₹) *</label>
              <input type="number" min={0} value={addForm.price} onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="899" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1 flex items-center gap-1"><Percent className="w-3 h-3" /> MRP / Original (₹)</label>
              <input type="number" min={0} value={addForm.original_price} onChange={(e) => setAddForm((f) => ({ ...f, original_price: e.target.value }))}
                placeholder="1499 (optional, shown as strikethrough)" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
              {addForm.original_price && addForm.price && parseFloat(addForm.original_price) > parseFloat(addForm.price) && (
                <p className="text-xs text-green-400 mt-1">
                  Shows: {Math.round(((parseFloat(addForm.original_price) - parseFloat(addForm.price)) / parseFloat(addForm.original_price)) * 100)}% OFF
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Fragrance Family</label>
              <input value={addForm.fragrance_family} onChange={(e) => setAddForm((f) => ({ ...f, fragrance_family: e.target.value }))}
                placeholder="e.g. Woody & Smoky" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Image URL</label>
              <input value={addForm.image} onChange={(e) => setAddForm((f) => ({ ...f, image: e.target.value }))}
                placeholder="https://..." className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-500 mb-1">Description</label>
              <textarea value={addForm.description} onChange={(e) => setAddForm((f) => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="Short description…" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Top Notes <span className="text-zinc-600">(comma-separated)</span></label>
              <input value={addForm.top_notes} onChange={(e) => setAddForm((f) => ({ ...f, top_notes: e.target.value }))}
                placeholder="Bergamot, Lemon" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Middle Notes <span className="text-zinc-600">(comma-separated)</span></label>
              <input value={addForm.middle_notes} onChange={(e) => setAddForm((f) => ({ ...f, middle_notes: e.target.value }))}
                placeholder="Rose, Jasmine" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Base Notes <span className="text-zinc-600">(comma-separated)</span></label>
              <input value={addForm.base_notes} onChange={(e) => setAddForm((f) => ({ ...f, base_notes: e.target.value }))}
                placeholder="Musk, Sandalwood" className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAddForm((f) => ({ ...f, is_active: !f.is_active }))}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition-colors ${
                addForm.is_active ? 'border-green-500/40 text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {addForm.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {addForm.is_active ? 'Visible in shop' : 'Hidden from shop'}
            </button>
            <div className="flex items-center gap-3">
              {addMsg && <span className={`text-xs ${addMsg.startsWith('✗') ? 'text-red-400' : 'text-green-400'}`}>{addMsg}</span>}
              <button onClick={handleAdd} disabled={adding}
                className="flex items-center gap-2 bg-amber-400 text-zinc-950 font-semibold rounded px-5 py-2 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors">
                <Plus className="w-4 h-4" />
                {adding ? 'Adding…' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3 text-xs text-zinc-400">
        <strong className="text-amber-400">Discount tip:</strong> Set a higher <em>MRP / Original</em> price and a lower <em>Selling Price</em> — the storefront will automatically show the strikethrough price and percentage discount badge.
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} token={token!} onUpdate={handleUpdate} />
          ))}
          {products.length === 0 && (
            <div className="text-center py-12 text-zinc-500 text-sm">No products yet. Add one above.</div>
          )}
        </div>
      )}
    </div>
  );
}
