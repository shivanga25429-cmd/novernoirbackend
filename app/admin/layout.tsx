'use client';
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

// ─── Admin Auth Context ────────────────────────────────────────────────────────

interface AdminAuthCtx {
  token: string | null;
  login: (t: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthCtx>({
  token: null,
  login: () => {},
  logout: () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

// ─── Sidebar nav items ─────────────────────────────────────────────────────────

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

// ─── Layout ────────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const t = sessionStorage.getItem('admin_token');
    if (!t && pathname !== '/admin/login') {
      router.replace('/admin/login');
    } else {
      setToken(t);
    }
  }, [pathname]);

  const login = (t: string) => {
    sessionStorage.setItem('admin_token', t);
    setToken(t);
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    setToken(null);
    router.replace('/admin/login');
  };

  if (pathname === '/admin/login') {
    return (
      <AdminAuthContext.Provider value={{ token, login, logout }}>
        {children}
      </AdminAuthContext.Provider>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ token, login, logout }}>
      <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
        {/* ── Sidebar ── */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex flex-col w-60 bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:relative lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="flex items-center justify-between px-5 py-5 border-b border-zinc-800">
            <span className="font-bold tracking-widest text-sm text-amber-400">NOVER NOIR</span>
            <span className="text-[9px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">ADMIN</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-amber-400/10 text-amber-400 border-r-2 border-amber-400'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-5 py-4 text-sm text-zinc-500 hover:text-red-400 border-t border-zinc-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </aside>

        {/* Sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-zinc-400 hover:text-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <span>Admin</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-zinc-300 capitalize">
                {pathname.split('/').filter(Boolean).slice(1).join(' / ') || 'Dashboard'}
              </span>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AdminAuthContext.Provider>
  );
}
