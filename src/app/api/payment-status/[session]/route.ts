import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { effectiveStatus } from "@/lib/payment-state";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session: string }> },
) {
  const { session: sessionId } = await params;
  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("mda_payments")
    .select("status, expires_at")
    .eq("session_id", sessionId)
    .eq("provider", "mercadopago")
    .maybeSingle();

  if (!payment) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const status = effectiveStatus(payment);

  // Persiste a transição pending → expired para o histórico refletir a
  // realidade (e para /api/payments/create não precisar recalcular do zero
  // sempre que a tela de pagamento reabrir).
  if (status !== payment.status) {
    await supabase
      .from("mda_payments")
      .update({ status })
      .eq("session_id", sessionId)
      .eq("provider", "mercadopago");
  }

  return NextResponse.json({ status });
}
