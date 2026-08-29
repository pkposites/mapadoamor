import { describe, expect, it } from "vitest";
import { sanitizeEventMetadata } from "./analytics-events";

describe("sanitizeEventMetadata", () => {
  it("mantém números, booleanos e strings curtas", () => {
    expect(sanitizeEventMetadata({ question_index: 5, value: 37.9, ok: true, tag: "abc" })).toEqual({
      question_index: 5,
      value: 37.9,
      ok: true,
      tag: "abc",
    });
  });

  it("trunca strings longas para evitar payloads grandes", () => {
    const long = "a".repeat(500);
    const result = sanitizeEventMetadata({ note: long });
    expect(result.note).toHaveLength(200);
  });

  it("descarta objetos, arrays e null (só primitivos simples)", () => {
    const result = sanitizeEventMetadata({
      nested: { a: 1 },
      list: [1, 2, 3],
      empty: null,
      keep: "yes",
    });
    expect(result).toEqual({ keep: "yes" });
  });

  it("remove session_id do metadata (já vai em coluna própria)", () => {
    const result = sanitizeEventMetadata({ session_id: "abc-123", other: 1 });
    expect(result).toEqual({ other: 1 });
  });

  it("limita a 10 chaves para não virar payload arbitrariamente grande", () => {
    const input = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`k${i}`, i]));
    const result = sanitizeEventMetadata(input);
    expect(Object.keys(result)).toHaveLength(10);
  });

  it("input inválido (não-objeto) retorna metadata vazio", () => {
    expect(sanitizeEventMetadata("not an object")).toEqual({});
    expect(sanitizeEventMetadata(null)).toEqual({});
    expect(sanitizeEventMetadata(undefined)).toEqual({});
  });
});
