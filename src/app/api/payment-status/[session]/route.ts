import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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

  const expired =
    payment.status === "pending" &&
    payment.expires_at &&
    new Date(payment.expires_at).getTime() <= Date.now();

  return NextResponse.json({ status: expired ? "expired" : payment.status });
}
