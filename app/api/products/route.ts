import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/products — list products (public)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const family = url.searchParams.get('family');
  const search = url.searchParams.get('q');

  let query = supabaseAdmin
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (family) query = query.eq('fragrance_family', family);
  if (search) query = query.ilike('name', `%${search}%`);

  const { data, error } = await query;
  if (error) return errorResponse(error.message, 500);

  return successResponse(data ?? []);
}
