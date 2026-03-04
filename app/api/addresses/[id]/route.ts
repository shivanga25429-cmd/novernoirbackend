import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/addresses/[id] — get a single address
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { id } = await params;

  const { data, error: dbErr } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (dbErr || !data) return errorResponse('Address not found', 404);

  return successResponse(data);
}

// PUT /api/addresses/[id] — update an address
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  // Ensure address belongs to user
  const { data: existing } = await supabaseAdmin
    .from('addresses')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!existing) return errorResponse('Address not found', 404);

  // If setting as default, unset others
  if (body.is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', id);
  }

  const { data, error: updateErr } = await supabaseAdmin
    .from('addresses')
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) return errorResponse(updateErr.message, 500);

  return successResponse(data);
}

// DELETE /api/addresses/[id] — delete an address
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { id } = await params;

  const { error: delErr } = await supabaseAdmin
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (delErr) return errorResponse(delErr.message, 500);

  return successResponse({ deleted: true });
}
