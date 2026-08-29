import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { ANALYTICS_EVENTS, sanitizeEventMetadata } from "@/lib/analytics-events";

const EVENT_NAMES = new Set<string>(ANALYTICS_EVENTS);

// Log interno de eventos do funil (mda_events), usado pelo painel de
// métricas (seção 19). Endpoint público sem autenticação — por isso a
// whitelist de nomes e a sanitização de metadata: não pode virar uma
// caixa de entrada de texto livre nem guardar dado sensível por engano.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const eventName = typeof body?.event_name === "string" ? body.event_name : null;
  if (!eventName || !EVENT_NAMES.has(eventName)) {
    return NextResponse.json({ error: "event_name inválido." }, { status: 400 });
  }

  const sessionId = typeof body?.session_id === "string" ? body.session_id : null;
  const metadata = sanitizeEventMetadata(body?.metadata);

  const supabase = createServiceClient();
  const { error } = await supabase.from("mda_events").insert({
    session_id: sessionId,
    event_name: eventName,
    metadata,
  });

  if (error) {
    return NextResponse.json({ error: "Não foi possível registrar o evento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
