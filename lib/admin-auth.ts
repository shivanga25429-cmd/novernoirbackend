import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest } from 'next/server';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME!;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH!;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET!;
const SESSION_TTL_HOURS = 12;

// ─── Simple HMAC-signed session token (no JWT library dep needed) ─────────────

function signToken(payload: string): string {
  return crypto
    .createHmac('sha256', ADMIN_JWT_SECRET)
    .update(payload)
    .digest('hex');
}

export function createAdminToken(adminId: string): string {
  const expiresAt = Date.now() + SESSION_TTL_HOURS * 3600_000;
  const payload = `${adminId}:${expiresAt}`;
  const sig = signToken(payload);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function verifyAdminToken(token: string): { valid: boolean; adminId?: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length < 3) return { valid: false };

    const sig = parts.pop()!;
    const payload = parts.join(':');
    const expectedSig = signToken(payload);

    if (sig !== expectedSig) return { valid: false };

    const [adminId, expiresAt] = parts;
    if (Date.now() > parseInt(expiresAt, 10)) return { valid: false };

    return { valid: true, adminId };
  } catch {
    return { valid: false };
  }
}

// ─── Verify admin credentials ─────────────────────────────────────────────────

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USERNAME) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

// ─── Middleware: protect admin routes ─────────────────────────────────────────

export function requireAdmin(req: NextRequest): { ok: boolean; error?: string } {
  const authHeader = req.headers.get('Authorization');
  const cookieToken = req.cookies.get('admin_token')?.value;
  const token = authHeader?.replace('Bearer ', '') ?? cookieToken;

  if (!token) return { ok: false, error: 'No admin token' };

  const { valid } = verifyAdminToken(token);
  if (!valid) return { ok: false, error: 'Invalid or expired admin token' };

  return { ok: true };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function adminError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

export function adminSuccess(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export const ADMIN_CORS = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
};
