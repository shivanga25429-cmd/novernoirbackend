import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/user/profile — fetch current user's profile
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { data, error: dbErr } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (dbErr || !data) return errorResponse('Profile not found', 404);

  return successResponse(data);
}

// PUT /api/user/profile — update name / phone
export async function PUT(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const allowedFields: Record<string, unknown> = {};
  if (body.name) allowedFields.name = body.name;
  if (body.phone_number) allowedFields.phone_number = body.phone_number;

  if (Object.keys(allowedFields).length === 0) {
    return errorResponse('Nothing to update');
  }

  const { data, error: updateErr } = await supabaseAdmin
    .from('users')
    .update(allowedFields)
    .eq('id', user.id)
    .select()
    .single();

  if (updateErr) return errorResponse(updateErr.message, 500);

  return successResponse(data);
}
