import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import type { FullResult } from "@/lib/result-content";

// Só retorna conteúdo completo quando o pagamento está confirmado
// server-side (mda_payments.status = 'paid'). Nunca libera por resposta
// do frontend/redirect — a única fonte de verdade é o registro de
// pagamento gravado pelo webhook (Commit 6).
export async function GET(
  request: Request,
  { params }: { params: Promise<{ session: string }> },
) {
  const { session: sessionId } = await params;

  const rateLimit = await checkRateLimit(`result:${clientIp(request)}`, 30, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("mda_payments")
    .select("status")
    .eq("session_id", sessionId)
    .eq("status", "paid")
    .maybeSingle();

  if (!payment) {
    return NextResponse.json(
      { error: "Pagamento não confirmado para esta sessão.", paid: false },
      { status: 402 },
    );
  }

  const { data: resultRow } = await supabase
    .from("mda_results")
    .select("narrative")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!resultRow?.narrative) {
    return NextResponse.json({ error: "Resultado ainda não gerado." }, { status: 404 });
  }

  const fullResult = JSON.parse(resultRow.narrative) as FullResult;
  return NextResponse.json(fullResult);
}
