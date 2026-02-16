import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Relaxed check for build time (SSG)
if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('WARNING: Invalid Supabase URL. Using placeholder for build. Check .env.local for production.')
}

const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)
