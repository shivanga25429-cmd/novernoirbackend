import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/orders/[id] — get a single order (with address joined)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { id } = await params;

  const { data, error: dbErr } = await supabaseAdmin
    .from('orders')
    .select('*, addresses(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (dbErr || !data) return errorResponse('Order not found', 404);

  return successResponse(data);
}
