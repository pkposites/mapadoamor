import { notFound, redirect } from "next/navigation";
import { QuizFlow } from "@/components/QuizFlow";
import { createServiceClient } from "@/lib/supabase/server";
import { QUESTIONS } from "@/lib/questions";
import type { QuizSession } from "@/lib/supabase/types";

export default async function QuizPage({
  params,
}: PageProps<"/quiz/[session]">) {
  const { session: sessionId } = await params;

  const supabase = createServiceClient();
  const { data: session } = await supabase
    .from("mda_quiz_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle<QuizSession>();

  if (!session) notFound();
  if (session.status === "paid") redirect(`/resultado/${sessionId}`);
  if (session.status === "completed") redirect(`/analise/${sessionId}`);

  const { data: answers } = await supabase
    .from("mda_quiz_answers")
    .select("question_id, answer_key")
    .eq("session_id", sessionId);

  const initialAnswers = Object.fromEntries(
    (answers ?? []).map((a) => [a.question_id, a.answer_key]),
  );

  return (
    <main className="flex flex-1 flex-col bg-primary-light px-6 py-10">
      <QuizFlow
        sessionId={sessionId}
        questions={QUESTIONS}
        initialAnswers={initialAnswers}
      />
    </main>
  );
}
