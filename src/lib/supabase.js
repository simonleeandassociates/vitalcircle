import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const MISSING = !supabaseUrl || !supabaseAnonKey

if (MISSING) {
  console.warn(
    '[VitalCircle] Supabase credentials not found in .env.local.\n' +
    'Auth and database features will not work until you add:\n' +
    '  VITE_SUPABASE_URL=...\n' +
    '  VITE_SUPABASE_ANON_KEY=...'
  )
}

// Use a valid-looking URL shape so the SDK does not throw on import.
// Actual calls will fail with network errors until real credentials are provided.
export const supabase = MISSING
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)
