"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  "Cruzando reciprocidade e comunicação…",
  "Avaliando segurança e conexão emocional…",
  "Mapeando intimidade e alinhamento de futuro…",
];

export function AnaliseRunner({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 700);

    fetch("/api/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("calculate failed");
        return res.json();
      })
      .then(() => {
        setTimeout(() => {
          router.push(`/resultado/${sessionId}/preview`);
        }, 1200);
      })
      .catch(() => setErrorMsg("Não conseguimos concluir a análise. Tente novamente."));

    return () => clearInterval(interval);
  }, [router, sessionId]);

  if (errorMsg) {
    return <p className="text-sm text-warm">{errorMsg}</p>;
  }

  return (
    <p className="mt-2 text-sm text-muted">{STEPS[step]}</p>
  );
}
