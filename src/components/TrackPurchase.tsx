"use client";

import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";

// Dispara Purchase pro Meta Pixel/GA4 uma única vez por sessão neste
// navegador. O evento "oficial" de compra já é registrado no servidor
// pelo webhook (mda_events), fora do contexto do browser — este disparo
// client-side é o que alimenta a otimização de campanha do Meta/GA4, que
// só enxerga eventos vindos do navegador (ou de CAPI, fora do escopo do
// MVP). localStorage evita duplicar Purchase a cada refresh da página.
export function TrackPurchase({ sessionId }: { sessionId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const key = `mda_purchase_tracked_${sessionId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // localStorage indisponível: melhor arriscar um disparo duplicado
      // ocasional do que nunca reportar a compra pro Pixel/GA4.
    }

    track("Purchase", { session_id: sessionId, value: 37.9, currency: "BRL" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- disparo único por montagem
  }, []);

  return null;
}
