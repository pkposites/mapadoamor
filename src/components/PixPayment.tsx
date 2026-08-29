"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";

const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos de polling

type CreateResponse = {
  status: "pending" | "paid";
  qr_code: string | null;
  pix_copy_paste: string | null;
  expires_at: string | null;
};

type ErrorState = { message: string; retryable: boolean };

export function PixPayment({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [data, setData] = useState<CreateResponse | null>(null);
  const [error, setError] = useState<ErrorState | null>(null);
  const [copied, setCopied] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout>;
    startedAt.current = Date.now();

    async function createPayment() {
      try {
        const res = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sessionId }),
        });
        if (!res.ok) throw new Error("create failed");
        const json = (await res.json()) as CreateResponse;
        if (cancelled) return;

        if (json.status === "paid") {
          router.push(`/resultado/${sessionId}`);
          return;
        }
        setData(json);
        poll();
      } catch {
        if (!cancelled) {
          setError({
            message: "Não conseguimos gerar o PIX agora. Tente novamente em instantes.",
            retryable: true,
          });
        }
      }
    }

    async function poll() {
      if (cancelled) return;
      if (Date.now() - (startedAt.current ?? Date.now()) > POLL_TIMEOUT_MS) return;

      try {
        const res = await fetch(`/api/payment-status/${sessionId}`);
        const json = await res.json();
        if (cancelled) return;

        if (json.status === "paid") {
          router.push(`/resultado/${sessionId}`);
          return;
        }
        if (json.status === "expired") {
          setError({ message: "O PIX expirou.", retryable: true });
          return;
        }
        if (json.status === "cancelled") {
          setError({ message: "O pagamento não foi aprovado.", retryable: true });
          return;
        }
      } catch {
        // Falha pontual de rede: só tenta de novo no próximo ciclo.
      }

      pollTimer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    createPayment();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [router, sessionId, attempt]);

  async function copyToClipboard() {
    if (!data?.pix_copy_paste) return;
    try {
      await navigator.clipboard.writeText(data.pix_copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard indisponível (ex.: contexto não seguro) — usuária pode selecionar o texto manualmente.
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-md text-center">
        <p className="text-sm text-warm">{error.message}</p>
        {error.retryable && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setData(null);
              setAttempt((a) => a + 1);
            }}
            className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Gerar novo PIX
          </button>
        )}
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="w-full max-w-md text-center">
        <p className="text-sm text-muted">Gerando seu PIX…</p>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md text-center">
      <p className="font-semibold text-primary">Pagamento via PIX — R$ 37,90</p>

      {data.qr_code && (
        // eslint-disable-next-line @next/next/no-img-element -- imagem base64 dinâmica, sem otimização de asset estático
        <img
          src={`data:image/png;base64,${data.qr_code}`}
          alt="QR Code para pagamento PIX"
          className="mx-auto mt-4 h-56 w-56 rounded-xl border border-border"
        />
      )}

      <button
        type="button"
        onClick={copyToClipboard}
        className="mt-4 w-full rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light"
      >
        {copied ? "Código copiado!" : "Copiar código PIX (copia-e-cola)"}
      </button>

      <p className="mt-4 text-xs text-muted">
        Abra seu banco, pague e volte para esta tela. A liberação é automática após a confirmação.
      </p>
    </Card>
  );
}
