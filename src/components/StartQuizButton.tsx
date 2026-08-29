"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StartQuizButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      const res = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: document.referrer || null,
          utm_source: params.get("utm_source"),
          utm_medium: params.get("utm_medium"),
          utm_campaign: params.get("utm_campaign"),
          utm_content: params.get("utm_content"),
          utm_term: params.get("utm_term"),
        }),
      });

      if (!res.ok) throw new Error("Falha ao criar sessão");
      const { session_id } = await res.json();
      router.push(`/quiz/${session_id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full bg-primary px-6 py-4 text-base font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {loading ? "Preparando…" : "Começar meu diagnóstico"}
    </button>
  );
}
