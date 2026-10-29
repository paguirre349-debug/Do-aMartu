import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Copiá .env.local.example a .env.local y completá tus datos."
  );
}

export const supabase = createClient(url || "http://localhost", anonKey || "public-anon-key", {
  auth: {
    persistSession: true,       // recuerda la sesión al recargar
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const supabaseReady = Boolean(url && anonKey && !url.includes("TU-PROYECTO"));
