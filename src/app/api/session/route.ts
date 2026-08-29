import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { QuizSession } from "@/lib/supabase/types";

// Cria uma sessão anônima de quiz. Sem autenticação/cadastro — a sessão é o
// único identificador usado pelo resto do funil.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const utm = typeof body === "object" && body !== null ? body : {};

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("mda_quiz_sessions")
    .insert({
      source: sanitize(utm.source),
      utm_source: sanitize(utm.utm_source),
      utm_medium: sanitize(utm.utm_medium),
      utm_campaign: sanitize(utm.utm_campaign),
      utm_content: sanitize(utm.utm_content),
      utm_term: sanitize(utm.utm_term),
    })
    .select()
    .single<QuizSession>();

  if (error || !data) {
    return NextResponse.json(
      { error: "Não foi possível criar a sessão." },
      { status: 500 },
    );
  }

  return NextResponse.json({ session_id: data.id }, { status: 201 });
}

// UTMs são texto livre vindo do client: limitar tamanho e descartar tipos
// inesperados antes de persistir.
function sanitize(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 200);
  return trimmed.length > 0 ? trimmed : null;
}
