import { createClient } from '@supabase/supabase-js';

export const initSupabase = (url: string, anonKey: string) => {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: false // We don't need user login auth, we access via anonymized API table access.
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
};
