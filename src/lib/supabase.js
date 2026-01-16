import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
        url: supabaseUrl ? 'SET' : 'MISSING',
        key: supabaseAnonKey ? 'SET' : 'MISSING'
    });
}

// Create client only if both values exist, otherwise create a mock that throws helpful errors
export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        from: () => ({
            select: () => Promise.reject(new Error('Supabase not configured. Please check environment variables.')),
            insert: () => Promise.reject(new Error('Supabase not configured. Please check environment variables.')),
            update: () => Promise.reject(new Error('Supabase not configured. Please check environment variables.')),
            delete: () => Promise.reject(new Error('Supabase not configured. Please check environment variables.')),
        })
    };

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
