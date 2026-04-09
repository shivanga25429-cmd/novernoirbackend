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

// POST /api/admin/products — create a new product
export async function POST(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const { name, price, original_price, description, fragrance_family, image,
          top_notes, middle_notes, base_notes, is_active, is_out_of_stock } = body;

  if (!name || price === undefined) return adminError('name and price are required');

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({
      name: String(name).trim(),
      price: Number(price),
      original_price: original_price != null ? Number(original_price) : null,
      description: description ?? null,
      fragrance_family: fragrance_family ?? null,
      image: image ?? null,
      top_notes: top_notes ?? [],
      middle_notes: middle_notes ?? [],
      base_notes: base_notes ?? [],
      is_active: is_active !== false,
      is_out_of_stock: Boolean(is_out_of_stock),
    })
    .select()
    .single();

  if (error) return adminError(error.message, 500);
  return adminSuccess(data, 201);
}
