import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/cart — get active cart for user
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { data, error: dbErr } = await supabaseAdmin
    .from('cart')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_cleared', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (dbErr && dbErr.code !== 'PGRST116') return errorResponse(dbErr.message, 500);

  return successResponse(data ?? null);
}

// POST /api/cart — sync cart (upsert)
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const { items, total } = body as { items: string[]; total: number };
  if (!Array.isArray(items)) return errorResponse('items must be an array');

  // Check for existing active cart
  const { data: existing } = await supabaseAdmin
    .from('cart')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_cleared', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  let result;
  if (existing) {
    result = await supabaseAdmin
      .from('cart')
      .update({ items, total, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
  } else {
    result = await supabaseAdmin
      .from('cart')
      .insert({ user_id: user.id, items, total, is_cleared: false })
      .select()
      .single();
  }

  if (result.error) return errorResponse(result.error.message, 500);

  return successResponse(result.data);
}

// DELETE /api/cart — clear the active cart
export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { error: clearErr } = await supabaseAdmin
    .from('cart')
    .update({ is_cleared: true, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('is_cleared', false);

  if (clearErr) return errorResponse(clearErr.message, 500);

  return successResponse({ cleared: true });
}
