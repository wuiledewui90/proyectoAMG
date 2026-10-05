import "server-only"

import { createClient } from "@supabase/supabase-js"

import { validateSupabaseServerEnvironment } from "@/lib/supabase/config"

validateSupabaseServerEnvironment()

/**
 * Cliente privilegiado de Supabase para uso exclusivo en código de servidor.
 * Nunca debe importarse desde componentes marcados con "use client".
 */
export const supabaseServer = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
