import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { Database } from '$lib/database.types'

const SUPABASE_URL = PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Missing Supabase environment variables. Set PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY.',
  )
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY ?? '',
)

export default supabase
