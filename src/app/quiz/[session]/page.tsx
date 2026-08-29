import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { createServiceClient } from "@/lib/supabase/server";
import type { QuizSession } from "@/lib/supabase/types";

// Motor de perguntas — implementado no Commit 3 (banco de perguntas +
// interface do quiz), consumindo POST /api/answers. Por ora, apenas
// resolve a sessão existente para permitir retomada após refresh.
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

  return (
    <main className="flex flex-1 flex-col bg-primary-light px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(session.current_step / 24) * 100}%` }}
          />
        </div>
        <Card>
          <p className="text-sm text-muted">Sessão: {session.id}</p>
          <p className="mt-2 text-foreground">
            Motor de perguntas em construção — uma pergunta por tela, 24
            perguntas no total, ~3–5 minutos.
          </p>
        </Card>
      </div>
    </main>
  );
}
