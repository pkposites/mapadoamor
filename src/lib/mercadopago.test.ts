import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./mercadopago";

const SECRET = "test-webhook-secret";

async function sign(manifest: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("verifyWebhookSignature", () => {
  const originalSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = originalSecret;
  });

  it("aceita uma assinatura calculada corretamente", async () => {
    const dataId = "123456789";
    const xRequestId = "req-abc";
    const ts = "1735689600";
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    const v1 = await sign(manifest, SECRET);

    const valid = await verifyWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId,
    });

    expect(valid).toBe(true);
  });

  it("rejeita quando o hash não bate (evento forjado)", async () => {
    const valid = await verifyWebhookSignature({
      xSignature: "ts=1735689600,v1=deadbeef",
      xRequestId: "req-abc",
      dataId: "123456789",
    });
    expect(valid).toBe(false);
  });

  it("rejeita quando falta o header de assinatura", async () => {
    const valid = await verifyWebhookSignature({
      xSignature: null,
      xRequestId: "req-abc",
      dataId: "123456789",
    });
    expect(valid).toBe(false);
  });

  it("rejeita quando o secret não está configurado", async () => {
    delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const dataId = "123456789";
    const manifest = `id:${dataId};request-id:req-abc;ts:1735689600;`;
    const v1 = await sign(manifest, SECRET);

    const valid = await verifyWebhookSignature({
      xSignature: `ts=1735689600,v1=${v1}`,
      xRequestId: "req-abc",
      dataId,
    });
    expect(valid).toBe(false);
  });

  it("é sensível ao dataId (não valida assinatura de outro evento)", async () => {
    const manifest = "id:123456789;request-id:req-abc;ts:1735689600;";
    const v1 = await sign(manifest, SECRET);

    const valid = await verifyWebhookSignature({
      xSignature: `ts=1735689600,v1=${v1}`,
      xRequestId: "req-abc",
      dataId: "999999999",
    });
    expect(valid).toBe(false);
  });
});
