import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { DIMENSION_LABELS, type DimensionKey } from "@/lib/dimensions";
import { buildPreviewTeaser, previewCategory } from "@/lib/result-content";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import type { DimensionScores } from "@/lib/scoring";

// Retorna somente o pré-resultado (seção 8): prova de que houve análise,
// sem entregar o valor inteiro. Nunca inclui interpretação completa,
// todos os índices ou os próximos movimentos — isso fica no /api/result.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ session: string }> },
) {
  const { session: sessionId } = await params;
  const supabase = createServiceClient();

  const { data: scoreRow } = await supabase
    .from("mda_quiz_scores")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!scoreRow) {
    return NextResponse.json(
      { error: "Resultado ainda não calculado para esta sessão." },
      { status: 404 },
    );
  }

  const { data: resultRow } = await supabase
    .from("mda_results")
    .select("strengths, attention")
    .eq("session_id", sessionId)
    .maybeSingle();

  const scores: DimensionScores = {
    reciprocity: scoreRow.reciprocity,
    communication: scoreRow.communication,
    security: scoreRow.security,
    connection: scoreRow.connection,
    intimacy: scoreRow.intimacy,
    future_alignment: scoreRow.future_alignment,
  };

  const strengths = (resultRow?.strengths ?? []) as DimensionKey[];
  const attention = (resultRow?.attention ?? []) as DimensionKey[];
  const strongDimension = strengths[0];
  const attentionDimension = attention[0];

  return NextResponse.json({
    questions_analyzed: TOTAL_QUESTIONS,
    category: previewCategory(scoreRow.profile_key),
    curiosity: buildPreviewTeaser(scores, strengths, attention),
    strong_signal: strongDimension
      ? { dimension: strongDimension, label: DIMENSION_LABELS[strongDimension], score: scores[strongDimension] }
      : null,
    attention_signal: attentionDimension
      ? { dimension: attentionDimension, label: DIMENSION_LABELS[attentionDimension] }
      : null,
  });
}
