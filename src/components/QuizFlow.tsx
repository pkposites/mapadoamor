"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import type { Question } from "@/lib/questions";
import { track } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics-events";

const MICROFEEDBACK: { at: number; text: string; event: AnalyticsEvent }[] = [
  { at: 0.25, text: "Já temos sinais suficientes para começar a mapear sua dinâmica.", event: "Quiz25" },
  { at: 0.5, text: "Um padrão de reciprocidade está começando a aparecer.", event: "Quiz50" },
  { at: 0.75, text: "Estamos cruzando conexão, segurança e comunicação.", event: "Quiz75" },
];

export function QuizFlow({
  sessionId,
  questions,
  initialAnswers,
}: {
  sessionId: string;
  questions: Question[];
  initialAnswers: Record<string, string>;
}) {
  const router = useRouter();
  const total = questions.length;

  // Retoma na primeira pergunta ainda não respondida.
  const firstUnanswered = questions.findIndex((q) => !initialAnswers[q.id]);
  const [index, setIndex] = useState(firstUnanswered === -1 ? total - 1 : firstUnanswered);
  const [selected, setSelected] = useState<Record<string, string>>(initialAnswers);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const question = questions[index];
  const answeredCount = Object.keys(selected).length;
  const progress = answeredCount / total;

  const nextMicrofeedback = useMemo(() => {
    return MICROFEEDBACK.find((m) => progress >= m.at && progress - 1 / total < m.at);
  }, [progress, total]);

  async function selectOption(optionKey: string) {
    if (saving) return;
    setSaving(true);
    setSelected((prev) => ({ ...prev, [question.id]: optionKey }));

    try {
      // O valor numérico da resposta é sempre derivado no servidor a partir
      // de question_id + answer_key — nunca enviado pelo client (ver
      // POST /api/answers), então não precisa ir no payload aqui.
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: question.id,
          answer_key: optionKey,
        }),
      });
      const data = await res.json().catch(() => null);

      track("AnswerQuestion", { session_id: sessionId, question_index: index + 1 });

      if (nextMicrofeedback) {
        setFeedback(nextMicrofeedback.text);
        track(nextMicrofeedback.event, { session_id: sessionId });
      }

      if (index + 1 >= total || data?.completed) {
        track("CompleteQuiz", { session_id: sessionId });
        router.push(`/analise/${sessionId}`);
        return;
      }

      setTimeout(() => {
        setFeedback(null);
        setIndex((i) => i + 1);
        setSaving(false);
      }, nextMicrofeedback ? 900 : 150);
    } catch {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${Math.min(100, progress * 100)}%` }}
        />
      </div>

      {feedback ? (
        <Card className="mb-4 border-primary/30 bg-primary-light text-center">
          <p className="text-sm font-medium text-primary">{feedback}</p>
        </Card>
      ) : (
        <Card>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            {index + 1} de {total}
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {question.text}
          </p>

          <div className="mt-6 flex flex-col gap-3">
            {question.options.map((option) => (
              <button
                key={option.key}
                type="button"
                disabled={saving}
                onClick={() => selectOption(option.key)}
                className="w-full rounded-2xl border border-border bg-white px-5 py-4 text-left text-base font-medium text-foreground transition hover:border-primary hover:bg-primary-light active:scale-[0.99] disabled:opacity-60"
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
