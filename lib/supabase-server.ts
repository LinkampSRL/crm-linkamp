import { createClient } from '@supabase/supabase-js'

// Solo para uso en API Routes (servidor).
// Usa la service_role key que bypassa RLS.
// NUNCA importar en componentes del cliente ('use client').
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
