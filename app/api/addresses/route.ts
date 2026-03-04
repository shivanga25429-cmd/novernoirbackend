import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth, errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/addresses — list all saved addresses for the user
export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const { data, error: dbErr } = await supabaseAdmin
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (dbErr) return errorResponse(dbErr.message, 500);

  return successResponse(data ?? [], 200);
}

// POST /api/addresses — create a new address
export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth(req);
  if (error || !user) return errorResponse('Unauthorized', 401);

  const body = await req.json().catch(() => null);
  if (!body) return errorResponse('Invalid JSON body');

  const { label, full_name, phone, address_line1, address_line2, city, state, pincode, country, is_default } = body;

  if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
    return errorResponse('Missing required address fields');
  }

  // If this new address is default, unset any existing default
  if (is_default) {
    await supabaseAdmin
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  const { data, error: insertErr } = await supabaseAdmin
    .from('addresses')
    .insert({
      user_id: user.id,
      label: label || 'Home',
      full_name,
      phone,
      address_line1,
      address_line2: address_line2 || null,
      city,
      state,
      pincode,
      country: country || 'India',
      is_default: is_default ?? false,
    })
    .select()
    .single();

  if (insertErr) return errorResponse(insertErr.message, 500);

  return successResponse(data, 201);
}
