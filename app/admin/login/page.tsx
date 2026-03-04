'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../layout';
import { Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Invalid credentials');
        return;
      }

      login(json.data.token);
      router.replace('/admin');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.4em] text-amber-400 mb-2">NOVER NOIR</p>
          <h1 className="text-2xl font-bold text-zinc-100">Admin Panel</h1>
          <p className="text-zinc-500 text-sm mt-1">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-amber-400"
                placeholder="admin username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-amber-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-400 text-zinc-950 font-semibold rounded py-2.5 text-sm hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-zinc-800/40 border-t-zinc-800 rounded-full animate-spin" />
            ) : null}
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-600 mt-4">
          Credentials are verified server-side only.
        </p>
      </div>
    </div>
  );
}
