import { createClient } from "@supabase/supabase-js";
import env from "./env";

/**
 * Supabase Admin Client using SERVICE_ROLE_KEY.
 * Bypasses RLS for backend operations where needed.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Standard Supabase Client using ANON_KEY.
 */
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
});

export default supabaseAdmin;
