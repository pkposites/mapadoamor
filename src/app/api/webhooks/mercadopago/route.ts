import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getPayment, verifyWebhookSignature } from "@/lib/mercadopago";

// Recebe a notificação do Mercado Pago, valida a assinatura, confirma o
// status direto na API do provedor (nunca confia no corpo do webhook) e
// atualiza mda_payments/mda_quiz_sessions. Idempotente: reprocessar o
// mesmo evento só reafirma o mesmo status.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const rawBody = await request.text();
  const body = safeParse(rawBody);

  const dataId =
    body?.data?.id != null ? String(body.data.id) : url.searchParams.get("data.id");
  const topic = body?.type ?? url.searchParams.get("type");

  if (topic !== "payment" || !dataId) {
    // Outros tópicos (ex.: merchant_order) são ignorados sem erro para o MP
    // não ficar reenviando o mesmo evento indefinidamente.
    return NextResponse.json({ received: true });
  }

  const isValid = await verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  let payment;
  try {
    payment = await getPayment(dataId);
  } catch (error) {
    console.error("Falha ao consultar pagamento no Mercado Pago", error);
    return NextResponse.json({ error: "Falha ao consultar pagamento." }, { status: 502 });
  }

  const sessionId = payment.external_reference;
  if (!sessionId) {
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();
  const status = mapStatus(payment.status);

  const { data: currentRow } = await supabase
    .from("mda_payments")
    .select("status, paid_at")
    .eq("session_id", sessionId)
    .eq("provider", "mercadopago")
    .eq("provider_payment_id", payment.id)
    .maybeSingle();

  if (!currentRow) {
    // O Mercado Pago retenta webhooks várias vezes até receber 200; se o
    // pagamento já foi substituído por um novo PIX (expirado/regerado),
    // não há mais linha correspondente — apenas confirma o recebimento.
    return NextResponse.json({ received: true });
  }

  // Idempotência: já processamos essa mesma transição para "paid" antes
  // (reentrega do mesmo evento). Evita duplicar paid_at e o evento
  // Purchase no analytics a cada retry do Mercado Pago.
  const alreadyPaid = currentRow.status === "paid";

  const { error: updateError } = await supabase
    .from("mda_payments")
    .update({
      status,
      paid_at: status === "paid" ? (currentRow.paid_at ?? new Date().toISOString()) : null,
    })
    .eq("session_id", sessionId)
    .eq("provider", "mercadopago")
    .eq("provider_payment_id", payment.id);

  if (updateError) {
    return NextResponse.json({ error: "Não foi possível atualizar o pagamento." }, { status: 500 });
  }

  if (status === "paid") {
    await supabase.from("mda_quiz_sessions").update({ status: "paid" }).eq("id", sessionId);

    if (!alreadyPaid) {
      await supabase.from("mda_events").insert({
        session_id: sessionId,
        event_name: "Purchase",
        metadata: { provider: "mercadopago", amount: 37.9, currency: "BRL" },
      });
    }
  }

  return NextResponse.json({ received: true });
}

function mapStatus(mpStatus: string): "pending" | "paid" | "expired" | "cancelled" {
  if (mpStatus === "approved") return "paid";
  if (mpStatus === "cancelled") return "cancelled";
  if (mpStatus === "rejected") return "cancelled";
  return "pending";
}

function safeParse(text: string): { type?: string; data?: { id?: string | number } } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
