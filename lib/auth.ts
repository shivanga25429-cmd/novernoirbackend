import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Verifies the Bearer token in the Authorization header using Supabase.
 * Returns the authenticated user or throws with a 401 response.
 */
export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null, error: 'Missing or invalid Authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error } = await client.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: 'Unauthorized' };
  }

  return { user, error: null, token };
}

/** Generate a human-readable tracking ID like NVR-20260304-XKQT */
export function generateTrackingId(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `NVR-${date}-${suffix}`;
}

/** Standard JSON error response */
export function errorResponse(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

/** Standard JSON success response */
export function successResponse(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status });
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
