'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAdminAuth } from '../layout';
import { Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  created_at: string;
}

export default function AdminUsers() {
  const { token } = useAdminAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: '20' });
    if (search) params.set('q', search);
    const res = await fetch(`/api/admin/users?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (json.success) {
      setUsers(json.data.users);
      setTotal(json.data.total);
    }
    setLoading(false);
  }, [token, page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-zinc-100">Users</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, email, phone…"
          className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-zinc-800 rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-10 text-zinc-500">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 text-zinc-200">{u.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                    <td className="px-4 py-3 text-zinc-400">{u.phone_number}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="text-amber-400 hover:underline">
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 text-sm text-zinc-500">
          <span>{total} users total</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1 disabled:opacity-30 hover:text-zinc-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="p-1 disabled:opacity-30 hover:text-zinc-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
