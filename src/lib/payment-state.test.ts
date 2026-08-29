import { describe, expect, it } from "vitest";
import { effectiveStatus, isReusable } from "./payment-state";

const NOW = new Date("2026-08-29T12:00:00Z").getTime();
const PAST = new Date("2026-08-29T11:00:00Z").toISOString();
const FUTURE = new Date("2026-08-29T13:00:00Z").toISOString();

describe("effectiveStatus", () => {
  it("pending com expiração no futuro continua pending", () => {
    expect(effectiveStatus({ status: "pending", expires_at: FUTURE }, NOW)).toBe("pending");
  });

  it("pending com expiração no passado vira expired", () => {
    expect(effectiveStatus({ status: "pending", expires_at: PAST }, NOW)).toBe("expired");
  });

  it("paid nunca regride para expired, mesmo com expires_at no passado", () => {
    expect(effectiveStatus({ status: "paid", expires_at: PAST }, NOW)).toBe("paid");
  });

  it("cancelled permanece cancelled", () => {
    expect(effectiveStatus({ status: "cancelled", expires_at: PAST }, NOW)).toBe("cancelled");
  });

  it("pending sem expires_at nunca expira sozinho", () => {
    expect(effectiveStatus({ status: "pending", expires_at: null }, NOW)).toBe("pending");
  });
});

describe("isReusable", () => {
  it("nenhum pagamento existente não é reaproveitável", () => {
    expect(isReusable(null, NOW)).toBe(false);
  });

  it("pagamento pending e não expirado é reaproveitável", () => {
    expect(isReusable({ status: "pending", expires_at: FUTURE }, NOW)).toBe(true);
  });

  it("pagamento pending expirado não é reaproveitável (deve gerar um novo)", () => {
    expect(isReusable({ status: "pending", expires_at: PAST }, NOW)).toBe(false);
  });

  it("pagamento já pago não é 'reaproveitado' como pendente", () => {
    expect(isReusable({ status: "paid", expires_at: PAST }, NOW)).toBe(false);
  });
});
