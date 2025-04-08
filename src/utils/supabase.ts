import { createClient } from '@supabase/supabase-js';

// Create a single supabase client for interacting with your database
export const createSupabaseClient = (supabaseKey: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// Client-side supabase instance (uses anon key)
export const supabase = createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string);

// Admin-level supabase instance (uses service role key - server-side only)
export const getAdminSupabase = () => {
  return createSupabaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY as string);
};
