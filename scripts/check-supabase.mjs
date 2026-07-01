/**
 * Verifica la conexión con Supabase.
 * Uso: node scripts/check-supabase.mjs
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  const envLocalPath = resolve(process.cwd(), ".env.local");

  for (const file of [envPath, envLocalPath]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\n🔍 Verificando Supabase...\n");

if (!url || url.includes("tu-proyecto")) {
  console.error("❌ Falta NEXT_PUBLIC_SUPABASE_URL en .env");
  process.exit(1);
}

if (!anonKey || anonKey === "eyJ...") {
  console.error("❌ Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

try {
  const res = await fetch(`${url}/rest/v1/profiles?select=id&limit=1`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (res.status === 404 || res.status === 406) {
    console.error("❌ La tabla 'profiles' no existe.");
    console.error("   → Ve a Supabase → SQL Editor y ejecuta supabase/schema.sql\n");
    process.exit(1);
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`❌ Error ${res.status}: ${text}`);
    process.exit(1);
  }

  console.log("✅ Conexión OK");
  console.log("✅ Tabla 'profiles' encontrada");
  console.log(`✅ URL: ${url}\n`);

  if (!serviceKey || serviceKey === "eyJ...") {
    console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada (necesaria para webhooks de Stripe)\n");
  } else {
    console.log("✅ Service role key configurada\n");
  }

  console.log("Siguiente paso: npm run dev → registra una cuenta en localhost:3000\n");
} catch (err) {
  console.error("❌ No se pudo conectar:", err.message);
  process.exit(1);
}
