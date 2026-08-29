/**
 * Integração com o Mercado Pago via API de Pagamentos (`/v1/payments`,
 * `payment_method_id: "pix"`) — endpoint estável e documentado há anos.
 *
 * A especificação recomenda a Orders API mais recente, mas neste ambiente
 * o domínio mercadopago.com(.br) está bloqueado pelo proxy de rede e não
 * foi possível verificar o payload exato da Orders API na documentação
 * oficial antes de escrever este código. Implementar contra um contrato
 * não-verificado seria arriscado para um fluxo de pagamento real, então
 * optei pela Payments API v1, cujo formato eu conheço com confiança.
 * Revisar/migrar para a Orders API é uma pendência (ver README).
 *
 * Server-only: usa MERCADOPAGO_ACCESS_TOKEN, então só pode ser importado
 * por Route Handlers, nunca por código que roda no browser.
 */

const MP_API_BASE = "https://api.mercadopago.com";
const PIX_EXPIRATION_MINUTES = 30;

export type CreatePixPaymentInput = {
  sessionId: string;
  payerEmail: string;
};

export type PixPaymentResult = {
  payment_id: string;
  status: string;
  qr_code: string | null;
  qr_code_base64: string | null;
  ticket_url: string | null;
  expires_at: string | null;
};

function accessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return token;
}

export async function createPixPayment({
  sessionId,
  payerEmail,
}: CreatePixPaymentInput): Promise<PixPaymentResult> {
  const expiresAt = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const response = await fetch(`${MP_API_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken()}`,
      // Idempotência por sessão: retries do mesmo request não duplicam cobrança.
      "X-Idempotency-Key": `mda-${sessionId}`,
    },
    body: JSON.stringify({
      transaction_amount: 37.9,
      description: "Mapa do Amor — resultado completo",
      payment_method_id: "pix",
      external_reference: sessionId,
      date_of_expiration: expiresAt.toISOString(),
      payer: { email: payerEmail },
      ...(siteUrl ? { notification_url: `${siteUrl}/api/webhooks/mercadopago` } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Mercado Pago recusou a criação do pagamento: ${response.status} ${detail}`);
  }

  const data = await response.json();
  const transactionData = data?.point_of_interaction?.transaction_data ?? {};

  return {
    payment_id: String(data.id),
    status: data.status,
    qr_code: transactionData.qr_code ?? null,
    qr_code_base64: transactionData.qr_code_base64 ?? null,
    ticket_url: transactionData.ticket_url ?? null,
    expires_at: data.date_of_expiration ?? expiresAt.toISOString(),
  };
}

export type MercadoPagoPayment = {
  id: string;
  status: string;
  external_reference: string | null;
};

/**
 * Consulta o pagamento diretamente no Mercado Pago. Usado pelo webhook —
 * nunca confiamos apenas no corpo do evento recebido, sempre confirmamos
 * o status junto ao provedor antes de liberar o resultado.
 */
export async function getPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${accessToken()}` },
  });

  if (!response.ok) {
    throw new Error(`Não foi possível consultar o pagamento ${paymentId} no Mercado Pago.`);
  }

  const data = await response.json();
  return {
    id: String(data.id),
    status: data.status,
    external_reference: data.external_reference ?? null,
  };
}

/**
 * Valida a assinatura do webhook (header `x-signature`), conforme o
 * esquema documentado pelo Mercado Pago: HMAC-SHA256 sobre um manifest
 * `id:{dataId};request-id:{requestId};ts:{ts};` usando o webhook secret.
 */
export async function verifyWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string;
}): Promise<boolean> {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((pair) => {
      const [key, value] = pair.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId ?? ""};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const computed = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computed, v1);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
