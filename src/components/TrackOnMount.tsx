"use client";

import { useEffect, useRef } from "react";
import { track, type TrackParams } from "@/lib/analytics";
import type { AnalyticsEvent } from "@/lib/analytics-events";

// Dispara um evento de analytics uma vez, quando o componente monta.
// Usado em páginas server component (landing, preview, resultado) para
// registrar visualização de tela sem precisar tornar a página inteira
// um client component.
export function TrackOnMount({ event, params }: { event: AnalyticsEvent; params?: TrackParams }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, params);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disparo único por montagem, ignora mudanças em params
  }, []);

  return null;
}
