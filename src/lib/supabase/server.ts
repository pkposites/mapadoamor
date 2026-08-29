import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client server-only, autenticado com a service role key. Nunca importar
 * este módulo em código que roda no browser — RLS não tem policies
 * públicas, então é este client (via Route Handlers) quem faz todo o
 * acesso a leitura/escrita das tabelas mda_*.
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar definidos.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
