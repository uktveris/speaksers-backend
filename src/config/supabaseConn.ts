import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_AUTH_URL;
const key = process.env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  const msg = `cannot create supabase client: url is: ${url} and key is: ${key}`;
  throw new Error(msg);
}

const supabase = createClient(url, key);

export default supabase;
