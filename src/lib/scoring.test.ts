import { describe, expect, it } from "vitest";
import {
  calculateDimensionScores,
  computeResult,
  detectCombinations,
  determineProfile,
  attentionAreas,
  topStrengths,
  type Answer,
  type DimensionScores,
} from "./scoring";
import { QUESTIONS } from "./questions";
import { DIMENSIONS } from "./dimensions";

function scores(overrides: Partial<DimensionScores>): DimensionScores {
  const base = Object.fromEntries(DIMENSIONS.map((d) => [d, 60])) as DimensionScores;
  return { ...base, ...overrides };
}

// Gera respostas reais (usando os IDs de src/lib/questions.ts) que produzem,
// para cada dimensão, exatamente o valor pedido — pegando a opção mais
// próxima daquele score em todas as perguntas da dimensão.
function answersForScores(target: DimensionScores): Answer[] {
  return QUESTIONS.filter(
    (q): q is typeof q & { dimension: keyof DimensionScores } => q.dimension !== "context",
  ).map((q) => {
    const wanted = target[q.dimension];
    const closest = q.options.reduce((best, opt) =>
      Math.abs(opt.value - wanted) < Math.abs(best.value - wanted) ? opt : best,
    );
    return { question_id: q.id, numeric_value: closest.value };
  });
}

describe("calculateDimensionScores", () => {
  it("calcula a média por dimensão e ignora perguntas de contexto", () => {
    const answers: Answer[] = [
      { question_id: "ctx-status", numeric_value: 999 }, // não deve influenciar nada
      { question_id: "recip-nivel-interesse", numeric_value: 100 },
      { question_id: "recip-iniciativa", numeric_value: 60 },
    ];

    const result = calculateDimensionScores(answers);
    expect(result.reciprocity).toBe(80);
  });

  it("retorna 0 para dimensões sem nenhuma resposta", () => {
    const result = calculateDimensionScores([]);
    for (const dimension of DIMENSIONS) {
      expect(result[dimension]).toBe(0);
    }
  });

  it("é determinística: mesma entrada produz sempre a mesma saída", () => {
    const answers: Answer[] = [{ question_id: "recip-nivel-interesse", numeric_value: 70 }];
    expect(calculateDimensionScores(answers)).toEqual(calculateDimensionScores(answers));
  });
});

describe("determineProfile", () => {
  it("amor_reciproco: todas as dimensões altas e equilibradas", () => {
    expect(determineProfile(scores({
      reciprocity: 80, communication: 75, security: 75,
      connection: 75, intimacy: 75, future_alignment: 75,
    }))).toBe("amor_reciproco");
  });

  it("amor_intenso: conexão e intimidade altas, mas segurança baixa", () => {
    expect(determineProfile(scores({
      connection: 85, intimacy: 80, security: 35, reciprocity: 60,
      communication: 60, future_alignment: 60,
    }))).toBe("amor_intenso");
  });

  it("amor_em_desequilibrio: reciprocidade baixa com comunicação presente", () => {
    expect(determineProfile(scores({
      reciprocity: 20, communication: 60, connection: 55,
      security: 55, intimacy: 55, future_alignment: 55,
    }))).toBe("amor_em_desequilibrio");
  });

  it("amor_distante: conexão, intimidade e reciprocidade baixas", () => {
    expect(determineProfile(scores({
      connection: 25, intimacy: 20, reciprocity: 30,
      communication: 55, security: 55, future_alignment: 55,
    }))).toBe("amor_distante");
  });

  it("amor_preso_em_ciclo: comunicação e segurança baixas", () => {
    expect(determineProfile(scores({
      communication: 25, security: 30, reciprocity: 60,
      connection: 60, intimacy: 60, future_alignment: 60,
    }))).toBe("amor_preso_em_ciclo");
  });

  it("amor_que_pede_clareza: futuro muito baixo em meio a outras dimensões médias", () => {
    expect(determineProfile(scores({
      future_alignment: 20, reciprocity: 60, communication: 60,
      security: 60, connection: 60, intimacy: 60,
    }))).toBe("amor_que_pede_clareza");
  });

  it("amor_em_construcao: dimensões medianas, sem sinal forte de nenhum outro perfil", () => {
    expect(determineProfile(scores({
      reciprocity: 58, communication: 55, security: 57,
      connection: 56, intimacy: 54, future_alignment: 60,
    }))).toBe("amor_em_construcao");
  });
});

describe("topStrengths / attentionAreas", () => {
  it("identifica as 2 maiores forças e os 2 menores índices", () => {
    const s = scores({
      reciprocity: 90, communication: 85, security: 40,
      connection: 30, intimacy: 60, future_alignment: 60,
    });

    expect(topStrengths(s)).toEqual(["reciprocity", "communication"]);
    expect(attentionAreas(s)).toEqual(["connection", "security"]);
  });

  it("nunca repete uma dimensão como força e como atenção ao mesmo tempo", () => {
    const allHigh = scores({}); // todas em 60, acima do limiar de atenção
    const strengths = topStrengths(allHigh);
    const attention = attentionAreas(allHigh);

    expect(attention.some((d) => strengths.includes(d))).toBe(false);
  });
});

describe("detectCombinations", () => {
  it("detecta conexão alta + segurança baixa", () => {
    const combos = detectCombinations(scores({ connection: 80, security: 30 }));
    expect(combos).toContain("conexao_alta_seguranca_baixa");
  });

  it("detecta reciprocidade baixa + comunicação alta", () => {
    const combos = detectCombinations(scores({ reciprocity: 30, communication: 80 }));
    expect(combos).toContain("reciprocidade_baixa_comunicacao_alta");
  });

  it("não detecta combinação quando os dois lados estão medianos", () => {
    const combos = detectCombinations(scores({}));
    expect(combos).toEqual([]);
  });
});

describe("computeResult (integração)", () => {
  it("respostas majoritariamente positivas geram perfil recíproco, sem pontos de atenção contraditórios", () => {
    const answers = answersForScores(scores({
      reciprocity: 90, communication: 85, security: 85,
      connection: 85, intimacy: 85, future_alignment: 85,
    }));

    const result = computeResult(answers);
    expect(result.profile_key).toBe("amor_reciproco");
    expect(result.strengths).toHaveLength(2);
    // Todas as dimensões estão altas: não faz sentido apontar "atenção"
    // em algo que também é força (evita a contradição citada na spec).
    expect(result.attention).toHaveLength(0);
    for (const dimension of result.strengths) {
      expect(result.attention).not.toContain(dimension);
    }
  });

  it("resultado com dimensões realmente fracas ainda aponta pontos de atenção distintos das forças", () => {
    const answers = answersForScores(scores({
      reciprocity: 90, communication: 85, security: 30,
      connection: 35, intimacy: 60, future_alignment: 60,
    }));

    const result = computeResult(answers);
    expect(result.strengths).toEqual(["reciprocity", "communication"]);
    expect(result.attention).toEqual(["connection", "security"]);
    for (const dimension of result.strengths) {
      expect(result.attention).not.toContain(dimension);
    }
  });

  it("usa todas as 20 perguntas de scoring do banco de perguntas real", () => {
    const scored = QUESTIONS.filter((q) => q.dimension !== "context");
    expect(scored).toHaveLength(20);

    const answers: Answer[] = scored.map((q) => ({
      question_id: q.id,
      numeric_value: q.options[0].value,
    }));

    const result = computeResult(answers);
    for (const dimension of DIMENSIONS) {
      expect(result.scores[dimension]).toBeGreaterThanOrEqual(0);
      expect(result.scores[dimension]).toBeLessThanOrEqual(100);
    }
  });
});
