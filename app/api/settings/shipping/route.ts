import { supabaseAdmin } from '@/lib/supabase';
import { errorResponse, successResponse, CORS_HEADERS } from '@/lib/auth';

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/settings/shipping — public: returns { cost, free_above }
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('value')
    .eq('key', 'shipping')
    .single();

  if (error || !data) {
    return successResponse({ cost: 99, free_above: 2000 });
  }

  return successResponse(data.value as { cost: number; free_above: number });
}
