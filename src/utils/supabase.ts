import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use dummy values if missing to prevent createClient from throwing
// In production, these should be provided in .env
const safeUrl = supabaseUrl || 'https://placeholder-url.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Auth will not work correctly until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient(safeUrl, safeKey);
