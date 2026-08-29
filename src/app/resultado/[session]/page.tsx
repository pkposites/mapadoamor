import { redirect } from "next/navigation";
import { Card } from "@/components/Card";
import { DIMENSION_LABELS, DIMENSIONS } from "@/lib/dimensions";
import { createServiceClient } from "@/lib/supabase/server";
import type { FullResult } from "@/lib/result-content";

// Resultado completo — só renderiza quando o pagamento está confirmado
// server-side. Sem pagamento, manda de volta para o paywall (nunca libera
// por estado do frontend).
export default async function ResultadoPage({
  params,
}: PageProps<"/resultado/[session]">) {
  const { session: sessionId } = await params;
  const supabase = createServiceClient();

  const { data: payment } = await supabase
    .from("mda_payments")
    .select("status")
    .eq("session_id", sessionId)
    .eq("status", "paid")
    .maybeSingle();

  if (!payment) redirect(`/resultado/${sessionId}/preview`);

  const { data: resultRow } = await supabase
    .from("mda_results")
    .select("narrative")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!resultRow?.narrative) {
    // Pagamento confirmado, mas o resultado ainda não foi calculado (não
    // deveria acontecer no funil normal — calculate roda antes do
    // pagamento). Não redireciona para o preview: como o preview também
    // manda para cá quando paid=true, isso criaria um loop infinito.
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
        <Card className="w-full max-w-md">
          <p className="font-semibold text-primary">Seu pagamento foi confirmado.</p>
          <p className="mt-2 text-sm text-muted">
            Ainda estamos finalizando o cálculo do seu resultado. Atualize esta página em
            alguns instantes.
          </p>
        </Card>
      </main>
    );
  }

  const result = JSON.parse(resultRow.narrative) as FullResult;

  return (
    <main className="flex flex-1 flex-col gap-6 bg-primary-light px-6 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {result.profile_label}
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">{result.headline}</p>
        </Card>

        <Card>
          <p className="mb-3 font-semibold text-primary">Seu mapa</p>
          <ul className="space-y-3">
            {DIMENSIONS.map((key) => (
              <li key={key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{DIMENSION_LABELS[key]}</span>
                  <span className="font-semibold text-primary">{result.scores[key]}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-primary-light">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${result.scores[key]}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 text-sm text-muted">
            {result.dimension_explanations.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="font-semibold text-primary">O que suas respostas revelam sobre você</p>
          <p className="mt-2 text-sm text-muted">{result.self_insight}</p>
        </Card>

        <Card>
          <p className="font-semibold text-primary">Como você percebe seu parceiro</p>
          <p className="mt-2 text-sm text-muted">{result.partner_perception}</p>
        </Card>

        <Card>
          <p className="font-semibold text-primary">Padrão predominante do casal</p>
          <p className="mt-2 text-sm text-muted">{result.pattern}</p>
          {result.combination_insights.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-border pt-3 text-sm text-muted">
              {result.combination_insights.map((text) => (
                <li key={text}>{text}</li>
              ))}
            </ul>
          )}
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <p className="text-sm font-semibold text-primary">Pontos fortes</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {result.strengths.map((d) => (
                <li key={d}>{DIMENSION_LABELS[d]}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-warm">Pontos de atenção</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {result.attention.map((d) => (
                <li key={d}>{DIMENSION_LABELS[d]}</li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="bg-primary text-white">
          <p className="text-sm font-medium uppercase tracking-wide text-white/80">
            Pergunta central
          </p>
          <p className="mt-2 text-base font-semibold">{result.central_question}</p>
        </Card>

        <Card>
          <p className="font-semibold text-primary">3 próximos movimentos</p>
          <ul className="mt-3 space-y-3">
            {result.next_moves.map((move) => (
              <li key={move.text} className="text-sm">
                <span className="mb-1 inline-block rounded-full bg-primary-light px-2 py-0.5 text-xs font-semibold uppercase text-primary">
                  {move.type === "observacao"
                    ? "Observação"
                    : move.type === "conversa"
                      ? "Conversa"
                      : "Comportamento"}
                </span>
                <p className="text-muted">{move.text}</p>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-center text-xs text-muted">{result.disclaimer}</p>
      </div>
    </main>
  );
}
