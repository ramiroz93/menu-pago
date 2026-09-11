import { createClient } from '@supabase/supabase-js'

// Reemplaza estos valores con los de tu proyecto Supabase
// Los encuentras en: supabase.com → tu proyecto → Settings → API
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'TU_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
