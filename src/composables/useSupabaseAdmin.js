// Create a separate admin client for admin operations
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceRoleKey = import.meta.env.VITE_APP_SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey, // This is the service_role key, not anon key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
