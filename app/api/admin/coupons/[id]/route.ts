import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const allowed: Record<string, unknown> = {};
  if (body.is_active !== undefined) allowed.is_active = Boolean(body.is_active);
  if (body.expires_after_use !== undefined) allowed.expires_after_use = Boolean(body.expires_after_use);
  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update(allowed)
    .eq('id', id)
    .select('*, users!coupons_assigned_user_id_fkey(name, email)')
    .single();

  if (error) return adminError(error.message, 500);
  return adminSuccess(data);
}
