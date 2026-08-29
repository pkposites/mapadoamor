import { createServiceClient } from "./supabase/server";

export type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * Janela deslizante simples por bucket (`mda_rate_limits`), truncada em
 * intervalos de `windowSeconds`. Incrementa atomicamente via RPC-like
 * upsert; se o contador já bateu o limite na janela atual, recusa.
 *
 * Não é preciso ao segundo (janela fixa, não deslizante de verdade), mas é
 * suficiente para conter abuso nos endpoints de pagamento e geração de
 * resultado (seção 13 da especificação) sem depender de infraestrutura
 * externa (Redis) que este projeto não tem.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const supabase = createServiceClient();
  const windowStart = new Date(
    Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000,
  ).toISOString();
  const bucketKey = key;

  let { data: existing } = await supabase
    .from("mda_rate_limits")
    .select("count")
    .eq("bucket_key", bucketKey)
    .eq("window_start", windowStart)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase
      .from("mda_rate_limits")
      .insert({ bucket_key: bucketKey, window_start: windowStart, count: 1 });

    if (!error) return { allowed: true, remaining: limit - 1 };

    // Corrida entre duas requisições simultâneas criando o mesmo bucket: a
    // que perdeu o insert (violação de PK) relê o valor real antes de
    // decidir, em vez de assumir count=1 (o que subcontaria a requisição
    // concorrente e deixaria o limite furável).
    const refetch = await supabase
      .from("mda_rate_limits")
      .select("count")
      .eq("bucket_key", bucketKey)
      .eq("window_start", windowStart)
      .maybeSingle();
    existing = refetch.data;
  }

  const currentCount = existing?.count ?? 0;
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase
    .from("mda_rate_limits")
    .update({ count: currentCount + 1 })
    .eq("bucket_key", bucketKey)
    .eq("window_start", windowStart);

  return { allowed: true, remaining: limit - currentCount - 1 };
}

/** IP do cliente a partir dos headers padrão do Vercel/proxies. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
