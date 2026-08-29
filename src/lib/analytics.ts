"use client";

import { ANALYTICS_EVENTS, META_STANDARD_EVENTS, type AnalyticsEvent } from "./analytics-events";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

export type TrackParams = {
  session_id?: string;
  value?: number;
  currency?: string;
  [key: string]: string | number | boolean | undefined;
};

// Nunca passar respostas do quiz, scores emocionais, ou qualquer dado
// pessoal sensível aqui — seção 15 da especificação é explícita: só
// nomes de evento + metadados leves (session_id, valor, moeda, índice).
export function track(event: AnalyticsEvent, params: TrackParams = {}) {
  if (typeof window === "undefined") return;

  try {
    const metaEventName = META_STANDARD_EVENTS[event];
    if (window.fbq) {
      if (metaEventName) {
        window.fbq("track", metaEventName, params);
      } else {
        window.fbq("trackCustom", event, params);
      }
    }
    if (window.gtag) {
      window.gtag("event", event, params);
    }
  } catch {
    // Bloqueador de anúncios/erro de script de terceiro nunca deve quebrar a experiência.
  }

  // Log interno (mda_events) para o painel de funil — best-effort, não
  // bloqueia a navegação nem propaga erro para quem chamou track().
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_name: event, session_id: params.session_id ?? null, metadata: params }),
    keepalive: true,
  }).catch(() => {});
}

export { ANALYTICS_EVENTS };
