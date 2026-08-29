import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { createServiceClient } from "@/lib/supabase/server";
import { DIMENSION_LABELS, type DimensionKey } from "@/lib/dimensions";
import { buildPreviewTeaser, previewCategory } from "@/lib/result-content";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import type { DimensionScores } from "@/lib/scoring";

export default async function PreviewPage({
  params,
}: PageProps<"/resultado/[session]/preview">) {
  const { session: sessionId } = await params;
  const supabase = createServiceClient();

  const { data: scoreRow } = await supabase
    .from("mda_quiz_scores")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!scoreRow) redirect(`/quiz/${sessionId}`);

  const { data: payment } = await supabase
    .from("mda_payments")
    .select("status")
    .eq("session_id", sessionId)
    .eq("status", "paid")
    .maybeSingle();

  if (payment) redirect(`/resultado/${sessionId}`);

  const { data: resultRow } = await supabase
    .from("mda_results")
    .select("strengths, attention")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!resultRow) notFound();

  const scores: DimensionScores = {
    reciprocity: scoreRow.reciprocity,
    communication: scoreRow.communication,
    security: scoreRow.security,
    connection: scoreRow.connection,
    intimacy: scoreRow.intimacy,
    future_alignment: scoreRow.future_alignment,
  };
  const strengths = resultRow.strengths as DimensionKey[];
  const attention = resultRow.attention as DimensionKey[];
  const strong = strengths[0];
  const weak = attention[0];

  return (
    <main className="flex flex-1 flex-col bg-primary-light px-6 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Analisamos suas {TOTAL_QUESTIONS} respostas
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {buildPreviewTeaser(scores, strengths, attention)}
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {strong && (
            <Card className="text-center">
              <p className="text-xs text-muted">Ponto forte identificado</p>
              <p className="mt-1 font-semibold text-primary">{DIMENSION_LABELS[strong]}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{scores[strong]}</p>
            </Card>
          )}
          {weak && (
            <Card className="text-center">
              <p className="text-xs text-muted">Ponto de atenção identificado</p>
              <p className="mt-1 font-semibold text-warm">{DIMENSION_LABELS[weak]}</p>
              <p className="mt-1 text-xs text-muted">motivo no resultado completo</p>
            </Card>
          )}
        </div>

        <Card className="bg-white/50 text-center">
          <p className="text-sm text-muted">
            Seu perfil se encaixa em {previewCategory(scoreRow.profile_key)}. O nome completo do
            perfil, os 6 índices, os padrões combinados e os 3 próximos movimentos estão no seu
            Mapa do Amor completo.
          </p>
        </Card>

        <Button href={`/resultado/${sessionId}/pagamento`} className="w-full">
          Desbloquear meu Mapa do Amor — R$ 37,90
        </Button>
      </div>
    </main>
  );
}
