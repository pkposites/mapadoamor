// Eventos do funil (seção 15 da especificação). Lista fechada: tanto o
// client (fbq/gtag) quanto POST /api/events só aceitam esses nomes — evita
// que o endpoint de analytics vire uma caixa de entrada de texto livre.
export const ANALYTICS_EVENTS = [
  "ViewLanding",
  "StartQuiz",
  "AnswerQuestion",
  "Quiz25",
  "Quiz50",
  "Quiz75",
  "CompleteQuiz",
  "ViewPreview",
  "InitiateCheckout",
  "PixGenerated",
  "Purchase",
  "ViewFullResult",
  "ShareResult",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

// Eventos com equivalente padrão no Meta Pixel (fbq('track', ...), melhor
// para otimização de campanha do que trackCustom). Os demais vão como
// evento customizado — servem de sinal interno de funil, não de
// otimização de anúncio.
export const META_STANDARD_EVENTS: Partial<Record<AnalyticsEvent, string>> = {
  InitiateCheckout: "InitiateCheckout",
  Purchase: "Purchase",
};

const MAX_METADATA_KEYS = 10;
const MAX_STRING_LENGTH = 200;

/**
 * Sanitiza o metadata recebido por POST /api/events (endpoint público, sem
 * autenticação): só primitivos simples, chaves limitadas e strings
 * truncadas — nunca objetos aninhados, arrays ou payloads grandes, que
 * poderiam carregar dado sensível por engano ou virar vetor de abuso.
 */
export function sanitizeEventMetadata(input: unknown): Record<string, string | number | boolean> {
  if (typeof input !== "object" || input === null) return {};

  const result: Record<string, string | number | boolean> = {};
  let count = 0;

  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (count >= MAX_METADATA_KEYS) break;
    if (key === "session_id") continue; // já vai em coluna própria

    if (typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
      count++;
    } else if (typeof value === "string") {
      result[key] = value.slice(0, MAX_STRING_LENGTH);
      count++;
    }
  }

  return result;
}
