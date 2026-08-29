import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createPixPayment } from "@/lib/mercadopago";
import { effectiveStatus, isReusable } from "@/lib/payment-state";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const PIX_AMOUNT = 37.9;

// Cria (ou reaproveita) o PIX vinculado à sessão. Idempotente: se já existe
// um pagamento pending não expirado para a sessão, retorna o mesmo QR Code
// em vez de gerar um novo a cada re-render da tela de pagamento.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === "string" ? body.session_id : null;

  if (!sessionId) {
    return NextResponse.json({ error: "session_id é obrigatório." }, { status: 400 });
  }

  const rateLimit = await checkRateLimit(`payments:create:${clientIp(request)}`, 10, 60);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um instante." }, { status: 429 });
  }

  const supabase = createServiceClient();

  const { data: session } = await supabase
    .from("mda_quiz_sessions")
    .select("id, status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 404 });
  }

  // Não vende PIX antes do quiz estar concluído e pontuado — evita cobrar
  // por um resultado que ainda não existe.
  if (session.status !== "completed" && session.status !== "paid") {
    return NextResponse.json(
      { error: "Quiz ainda não concluído para esta sessão." },
      { status: 409 },
    );
  }

  const { data: existing } = await supabase
    .from("mda_payments")
    .select("*")
    .eq("session_id", sessionId)
    .eq("provider", "mercadopago")
    .maybeSingle();

  const currentStatus = existing ? effectiveStatus(existing) : null;

  if (currentStatus === "paid") {
    return NextResponse.json({ status: "paid" });
  }

  if (isReusable(existing)) {
    return NextResponse.json({
      status: "pending",
      qr_code: existing!.qr_code,
      pix_copy_paste: existing!.pix_copy_paste,
      expires_at: existing!.expires_at,
      amount: PIX_AMOUNT,
    });
  }

  // Pagamento anterior expirado/cancelado: marca o estado antes de gerar um
  // novo, para o histórico não ficar preso em "pending" para sempre.
  if (existing && currentStatus && currentStatus !== existing.status) {
    await supabase
      .from("mda_payments")
      .update({ status: currentStatus })
      .eq("session_id", sessionId)
      .eq("provider", "mercadopago");
  }

  let payment;
  try {
    // "Sem cadastro" no produto = sem login/conta própria; o PSP ainda exige
    // um e-mail mínimo para processar PIX (ver seção 9.1 da especificação).
    // Placeholder sintético por sessão até definirmos se coletamos e-mail
    // real do pagador na tela de pagamento.
    payment = await createPixPayment({
      sessionId,
      payerEmail: `sessao-${sessionId}@mapadoamor.app`,
    });
  } catch (error) {
    console.error("Falha ao criar pagamento PIX", error);
    return NextResponse.json({ error: "Não foi possível gerar o PIX agora." }, { status: 502 });
  }

  const { error: upsertError } = await supabase.from("mda_payments").upsert(
    {
      session_id: sessionId,
      provider: "mercadopago",
      provider_payment_id: payment.payment_id,
      amount: PIX_AMOUNT,
      status: "pending",
      qr_code: payment.qr_code_base64,
      pix_copy_paste: payment.qr_code,
      expires_at: payment.expires_at,
      paid_at: null,
    },
    { onConflict: "session_id,provider" },
  );

  if (upsertError) {
    return NextResponse.json({ error: "Não foi possível registrar o pagamento." }, { status: 500 });
  }

  return NextResponse.json({
    status: "pending",
    qr_code: payment.qr_code_base64,
    pix_copy_paste: payment.qr_code,
    expires_at: payment.expires_at,
    amount: PIX_AMOUNT,
  });
}
