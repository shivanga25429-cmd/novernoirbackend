import { NextRequest } from 'next/server';
import { verifyAdminCredentials, createAdminToken, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

/**
 * POST /api/admin/login
 * Body: { username, password }
 * Returns: { token, expires_in }
 *
 * The token is both returned in JSON AND set as an HttpOnly cookie.
 * Credentials are NEVER stored client-side — they are verified
 * entirely against env vars on the server.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const { username, password } = body as { username: string; password: string };
  if (!username || !password) return adminError('Username and password required');

  const valid = await verifyAdminCredentials(username, password);
  if (!valid) {
    // Constant-time-ish delay to slow brute force
    await new Promise((r) => setTimeout(r, 500));
    return adminError('Invalid credentials', 401);
  }

  const token = createAdminToken('admin');

  const res = adminSuccess({ token, expires_in: 43200 /* 12h in seconds */ });

  // Also set as HttpOnly cookie so the browser-based admin panel can use it
  const headers = new Headers(res.headers);
  headers.set(
    'Set-Cookie',
    `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/api/admin; Max-Age=43200`
  );
  Object.entries(ADMIN_CORS).forEach(([k, v]) => headers.set(k, v));

  return new Response(res.body, { status: res.status, headers });
}
