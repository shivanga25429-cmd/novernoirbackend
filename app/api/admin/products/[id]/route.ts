import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// PUT /api/admin/products/[id] — update product pricing, name, description, active status
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  // Only allow safe fields to be updated
  const allowed: Record<string, unknown> = {};
  if (body.name !== undefined) allowed.name = body.name;
  if (body.price !== undefined) allowed.price = Number(body.price);
  if (body.original_price !== undefined)
    allowed.original_price = body.original_price === null ? null : Number(body.original_price);
  if (body.description !== undefined) allowed.description = body.description;
  if (body.fragrance_family !== undefined) allowed.fragrance_family = body.fragrance_family;
  if (body.is_active !== undefined) allowed.is_active = Boolean(body.is_active);
  if (body.image !== undefined) allowed.image = body.image;

  if (Object.keys(allowed).length === 0) return adminError('Nothing to update');

  allowed.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(allowed)
    .eq('id', id)
    .select()
    .single();

  if (error) return adminError(error.message, 500);
  if (!data) return adminError('Product not found', 404);

  return adminSuccess(data);
}
