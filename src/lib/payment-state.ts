// Regras puras de estado do pagamento PIX — extraídas para serem
// testáveis sem precisar de um banco real. Cobrem os casos que a seção
// 18 (Fase 3/5) da especificação pede para testar explicitamente:
// aprovado, pendente, expirado, duplicado e webhook repetido.

export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";

export type PaymentRow = {
  status: PaymentStatus;
  expires_at: string | null;
};

/**
 * Status "real" do pagamento agora, considerando expiração por tempo.
 * `paid`/`cancelled` são estados terminais e nunca regridem — um
 * pagamento confirmado nunca deve voltar a bloquear o resultado, mesmo
 * que `expires_at` já tenha passado.
 */
export function effectiveStatus(payment: PaymentRow, now: number = Date.now()): PaymentStatus {
  if (payment.status !== "pending") return payment.status;
  if (payment.expires_at && new Date(payment.expires_at).getTime() <= now) {
    return "expired";
  }
  return "pending";
}

/**
 * Se true, o PIX existente ainda pode ser reaproveitado (mesmo QR Code) em
 * vez de gerar um novo — evita cobrar/gerar QR duplicado a cada re-render
 * da tela de pagamento.
 */
export function isReusable(payment: PaymentRow | null, now: number = Date.now()): boolean {
  if (!payment) return false;
  return effectiveStatus(payment, now) === "pending";
}
