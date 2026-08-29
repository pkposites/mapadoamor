import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { computeResult } from "@/lib/scoring";
import { buildFullResult } from "@/lib/result-content";

// Valida que a sessão respondeu todas as perguntas e calcula os scores
// deterministicamente (camadas 1–4 do motor de personalização). Idempotente:
// pode ser chamado de novo (ex.: retry de rede) que apenas recalcula e
// substitui a linha em mda_quiz_scores.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === "string" ? body.session_id : null;

  if (!sessionId) {
    return NextResponse.json({ error: "session_id é obrigatório." }, { status: 400 });
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

  const { data: answers, error: answersError } = await supabase
    .from("mda_quiz_answers")
    .select("question_id, numeric_value")
    .eq("session_id", sessionId);

  if (answersError) {
    return NextResponse.json({ error: "Não foi possível ler as respostas." }, { status: 500 });
  }

  if (!answers || answers.length < TOTAL_QUESTIONS) {
    return NextResponse.json(
      { error: `Quiz incompleto: ${answers?.length ?? 0}/${TOTAL_QUESTIONS} respostas.` },
      { status: 409 },
    );
  }

  const result = computeResult(answers);

  const { error: upsertError } = await supabase.from("mda_quiz_scores").upsert(
    {
      session_id: sessionId,
      reciprocity: result.scores.reciprocity,
      communication: result.scores.communication,
      security: result.scores.security,
      connection: result.scores.connection,
      intimacy: result.scores.intimacy,
      future_alignment: result.scores.future_alignment,
      profile_key: result.profile_key,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: "Não foi possível salvar os scores." }, { status: 500 });
  }

  const fullResult = buildFullResult(result);

  const { error: resultsError } = await supabase.from("mda_results").upsert(
    {
      session_id: sessionId,
      strengths: fullResult.strengths,
      attention: fullResult.attention,
      pattern_key: fullResult.profile_key,
      actions: fullResult.next_moves,
      narrative: JSON.stringify(fullResult),
      generated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );

  if (resultsError) {
    return NextResponse.json({ error: "Não foi possível salvar o resultado." }, { status: 500 });
  }

  if (session.status !== "paid") {
    await supabase
      .from("mda_quiz_sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);
  }

  return NextResponse.json({
    profile_key: result.profile_key,
    scores: result.scores,
    strengths: result.strengths,
    attention: result.attention,
    combinations: result.combinations,
  });
}
