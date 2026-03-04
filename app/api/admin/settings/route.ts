import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, adminError, adminSuccess, ADMIN_CORS } from '@/lib/admin-auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: ADMIN_CORS });
}

// GET /api/admin/settings — get all app settings (shipping config etc.)
export async function GET(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('*');

  if (error) return adminError(error.message, 500);

  // Convert array of {key, value} rows into a flat object
  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }

  return adminSuccess(settings);
}

// PUT /api/admin/settings — update one or more settings keys
// Body: { shipping?: { cost: number, free_above: number } }
export async function PUT(req: NextRequest) {
  const auth = requireAdmin(req);
  if (!auth.ok) return adminError(auth.error!, 401);

  const body = await req.json().catch(() => null);
  if (!body) return adminError('Invalid JSON');

  const results: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select()
      .single();

    if (error) return adminError(`Failed to update "${key}": ${error.message}`, 500);
    results[key] = data?.value;
  }

  return adminSuccess(results);
}
