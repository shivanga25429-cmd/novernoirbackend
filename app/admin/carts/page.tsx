'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../layout';
import Link from 'next/link';
import { ShoppingBag, Search, ChevronDown, ChevronUp, User } from 'lucide-react';

interface CartProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image: string | null;
}

interface CartItem {
  product_id: string;
  quantity: number;
  product: CartProduct | null;
}

interface CartRow {
  id: string;
  user: { id: string; name: string; email: string; phone_number: string } | null;
  items: CartItem[];
  item_count: number;
  total: number;
  updated_at: string;
}

export default function AdminCarts() {
  const { token } = useAdminAuth();
  const [carts, setCarts] = useState<CartRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const LIMIT = 20;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT), ...(query ? { q: query } : {}) });
    const res = await fetch(`/api/admin/carts?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (json.success) {
      setCarts(json.data.carts);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [token, page, query]);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-amber-400" />
        Active Carts
        <span className="text-sm font-normal text-zinc-500">({total})</span>
      </h1>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(search); setPage(1); } }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400"
          />
        </div>
        <button
          onClick={() => { setQuery(search); setPage(1); }}
          className="px-4 py-2 bg-amber-400 text-zinc-950 font-semibold text-sm rounded hover:bg-amber-300 transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-zinc-900 rounded-lg h-16 animate-pulse" />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-10 text-center text-zinc-500 text-sm">
          No active carts found.
        </div>
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => {
            const open = expanded.has(cart.id);
            return (
              <div key={cart.id} className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                {/* Cart header row */}
                <button
                  onClick={() => toggle(cart.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <User className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">
                        {cart.user?.name ?? 'Unknown User'}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">{cart.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500">{cart.item_count} item{cart.item_count !== 1 ? 's' : ''}</p>
                      <p className="text-sm font-semibold text-amber-400">₹{cart.total}</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-zinc-500">
                        {new Date(cart.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {open ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </div>
                </button>

                {/* Expanded cart items */}
                {open && (
                  <div className="border-t border-zinc-800">
                    {/* User info */}
                    <div className="px-5 py-3 bg-zinc-800/30 flex items-center gap-6 text-xs text-zinc-400 flex-wrap">
                      <span>📱 {cart.user?.phone_number ?? '—'}</span>
                      <Link
                        href={`/admin/users/${cart.user?.id}`}
                        className="text-amber-400 hover:underline"
                      >
                        View user profile →
                      </Link>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-zinc-800">
                      {cart.items.map((item) => (
                        <div key={item.product_id} className="flex items-center gap-4 px-5 py-3">
                          {item.product?.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-12 h-14 object-cover rounded bg-zinc-800 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-14 bg-zinc-800 rounded flex-shrink-0 flex items-center justify-center text-zinc-600 text-xs">
                              No img
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-200 font-medium truncate">
                              {item.product?.name ?? item.product_id}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              ₹{item.product?.price ?? '—'}
                              {item.product?.original_price && item.product.original_price > (item.product.price ?? 0) && (
                                <span className="text-zinc-600 line-through ml-2">₹{item.product.original_price}</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs bg-zinc-800 text-zinc-300 px-2 py-1 rounded">
                              × {item.quantity}
                            </span>
                            {item.product?.price && (
                              <p className="text-xs text-zinc-400 mt-1">
                                = ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart total */}
                    <div className="px-5 py-3 bg-zinc-800/30 flex justify-end">
                      <p className="text-sm font-semibold text-zinc-100">
                        Cart Total: <span className="text-amber-400">₹{cart.total}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-300 disabled:opacity-40 hover:bg-zinc-700 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-zinc-500">{page} / {pages}</span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs rounded bg-zinc-800 text-zinc-300 disabled:opacity-40 hover:bg-zinc-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
