import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/products/[id] — get a single product (public)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return errorResponse('Product not found', 404);

  return successResponse(data);
}
