import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { QUESTIONS, TOTAL_QUESTIONS } from "@/lib/questions";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const QUESTIONS_BY_ID = new Map(QUESTIONS.map((q) => [q.id, q]));

// Salva uma resposta e atualiza o progresso da sessão. Idempotente por
// (session_id, question_id): responder a mesma pergunta de novo substitui
// o valor anterior em vez de duplicar.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const sessionId = typeof body?.session_id === "string" ? body.session_id : null;
  const questionId = typeof body?.question_id === "string" ? body.question_id : null;
  const answerKey = typeof body?.answer_key === "string" ? body.answer_key : null;

  if (!sessionId || !questionId || !answerKey) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const question = QUESTIONS_BY_ID.get(questionId);
  const option = question?.options.find((o) => o.key === answerKey);

  if (!question || !option) {
    return NextResponse.json({ error: "Pergunta ou alternativa inválida." }, { status: 400 });
  }

  // O valor da resposta nunca vem do client: é sempre derivado do banco de
  // perguntas no servidor, a partir de question_id + answer_key. Confiar em
  // um numeric_value enviado pelo frontend permitiria forjar pontuação alta
  // sem responder as perguntas de verdade.
  const numericValue = option.value;

  const rateLimit = await checkRateLimit(`answers:${clientIp(request)}`, 60, 60);
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

  const { error: upsertError } = await supabase.from("mda_quiz_answers").upsert(
    {
      session_id: sessionId,
      question_id: questionId,
      answer_key: answerKey,
      numeric_value: numericValue,
    },
    { onConflict: "session_id,question_id" },
  );

  if (upsertError) {
    return NextResponse.json({ error: "Não foi possível salvar a resposta." }, { status: 500 });
  }

  const { count } = await supabase
    .from("mda_quiz_answers")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  const answeredCount = count ?? 0;
  const completed = answeredCount >= TOTAL_QUESTIONS;

  await supabase
    .from("mda_quiz_sessions")
    .update({
      current_step: answeredCount,
      status: completed ? "completed" : session.status,
    })
    .eq("id", sessionId);

  return NextResponse.json({ answered_count: answeredCount, completed });
}
