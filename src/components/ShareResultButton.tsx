"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function ShareResultButton({ sessionId }: { sessionId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    track("ShareResult", { session_id: sessionId });
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: "Meu Mapa do Amor", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Usuária cancelou o share nativo ou clipboard indisponível — sem problema.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary-light"
    >
      {copied ? "Link copiado!" : "Compartilhar meu resultado"}
    </button>
  );
}
