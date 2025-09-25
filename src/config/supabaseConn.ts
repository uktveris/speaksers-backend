import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_AUTH_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  const msg = "cannot create supabase client. cannot resolve url or key";
  throw new Error(msg);
}

const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
