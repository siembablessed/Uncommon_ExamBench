import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    throw new Error('Invalid Supabase URL. Please check your .env.local file. It should start with https://')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
