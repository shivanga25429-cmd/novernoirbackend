import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/products — list all products (including inactive)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) return adminError(error.message, 500);
  return adminSuccess(data ?? []);
}
