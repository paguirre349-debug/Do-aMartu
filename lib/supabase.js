import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Si faltan las variables, avisamos claro en consola en vez de romper feo.
if (!url || !anonKey) {
  console.warn(
    "[Supabase] Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
    "Copiá .env.local.example a .env.local y completá tus datos."
  );
}

export const supabase = createClient(url || "http://localhost", anonKey || "public-anon-key");

// ¿Está configurado de verdad? (para mostrar aviso en la UI)
export const supabaseReady = Boolean(url && anonKey && !url.includes("TU-PROYECTO"));
