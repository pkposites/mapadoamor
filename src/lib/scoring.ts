import { DIMENSIONS, PROFILE_KEYS, type DimensionKey, type ProfileKey } from "./dimensions";
import { QUESTIONS } from "./questions";

export type Answer = {
  question_id: string;
  numeric_value: number;
};

export type DimensionScores = Record<DimensionKey, number>;

const QUESTION_DIMENSION = new Map(QUESTIONS.map((q) => [q.id, q.dimension]));

/**
 * Camada 2 — calcula os 6 índices (0–100) como a média das respostas de
 * cada dimensão. Perguntas de "context" não entram no cálculo. Puro e
 * determinístico: mesma entrada sempre produz a mesma saída.
 */
export function calculateDimensionScores(answers: Answer[]): DimensionScores {
  const sums: Record<DimensionKey, number> = Object.fromEntries(
    DIMENSIONS.map((d) => [d, 0]),
  ) as DimensionScores;
  const counts: Record<DimensionKey, number> = Object.fromEntries(
    DIMENSIONS.map((d) => [d, 0]),
  ) as Record<DimensionKey, number>;

  for (const answer of answers) {
    const dimension = QUESTION_DIMENSION.get(answer.question_id);
    if (!dimension || dimension === "context") continue;

    sums[dimension] += answer.numeric_value;
    counts[dimension] += 1;
  }

  const scores = {} as DimensionScores;
  for (const dimension of DIMENSIONS) {
    scores[dimension] =
      counts[dimension] > 0 ? Math.round(sums[dimension] / counts[dimension]) : 0;
  }
  return scores;
}

function average(scores: DimensionScores): number {
  const values = DIMENSIONS.map((d) => scores[d]);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function range(scores: DimensionScores): number {
  const values = DIMENSIONS.map((d) => scores[d]);
  return Math.max(...values) - Math.min(...values);
}

/**
 * Camada 1 — perfil predominante. Regras determinísticas avaliadas em
 * ordem de prioridade (primeira que casar vence). Thresholds são
 * provisórios (decisão em aberto na seção 24 da especificação) e devem
 * ser calibrados com dados reais antes do lançamento.
 */
export function determineProfile(scores: DimensionScores): ProfileKey {
  const { reciprocity, communication, security, connection, intimacy, future_alignment } =
    scores;

  if (connection <= 40 && intimacy <= 40 && reciprocity <= 50) {
    return "amor_distante";
  }

  if (communication <= 40 && security <= 45) {
    return "amor_preso_em_ciclo";
  }

  if (reciprocity <= 45 && (communication >= 50 || connection >= 50)) {
    return "amor_em_desequilibrio";
  }

  if (connection >= 70 && intimacy >= 65 && (security <= 55 || communication <= 55)) {
    return "amor_intenso";
  }

  if (average(scores) >= 68 && Math.min(reciprocity, communication, security, connection, intimacy, future_alignment) >= 55) {
    return "amor_reciproco";
  }

  if (future_alignment <= 45 || range(scores) >= 40) {
    return "amor_que_pede_clareza";
  }

  return "amor_em_construcao";
}

/** Camada 3 — 2 maiores forças e 2 menores índices. */
export function topStrengths(scores: DimensionScores, count = 2): DimensionKey[] {
  return [...DIMENSIONS].sort((a, b) => scores[b] - scores[a]).slice(0, count);
}

export function attentionAreas(scores: DimensionScores, count = 2): DimensionKey[] {
  return [...DIMENSIONS].sort((a, b) => scores[a] - scores[b]).slice(0, count);
}

export type CombinationKey =
  | "conexao_alta_seguranca_baixa"
  | "reciprocidade_baixa_comunicacao_alta"
  | "futuro_desalinhado_intimidade_alta"
  | "comunicacao_baixa_seguranca_baixa";

const HIGH = 65;
const LOW = 45;

/**
 * Camada 4 — combinações relevantes entre dimensões. Cada combinação
 * detectada aponta para um texto condicional específico (Camada 5, a
 * implementar junto do resultado pago).
 */
export function detectCombinations(scores: DimensionScores): CombinationKey[] {
  const combos: CombinationKey[] = [];

  if (scores.connection >= HIGH && scores.security <= LOW) {
    combos.push("conexao_alta_seguranca_baixa");
  }
  if (scores.reciprocity <= LOW && scores.communication >= HIGH) {
    combos.push("reciprocidade_baixa_comunicacao_alta");
  }
  if (scores.future_alignment <= LOW && scores.intimacy >= HIGH) {
    combos.push("futuro_desalinhado_intimidade_alta");
  }
  if (scores.communication <= LOW && scores.security <= LOW) {
    combos.push("comunicacao_baixa_seguranca_baixa");
  }

  return combos;
}

export type ScoringResult = {
  scores: DimensionScores;
  profile_key: ProfileKey;
  strengths: DimensionKey[];
  attention: DimensionKey[];
  combinations: CombinationKey[];
};

/** Executa as camadas 1–4 do motor de personalização a partir das respostas cruas. */
export function computeResult(answers: Answer[]): ScoringResult {
  const scores = calculateDimensionScores(answers);
  return {
    scores,
    profile_key: determineProfile(scores),
    strengths: topStrengths(scores),
    attention: attentionAreas(scores),
    combinations: detectCombinations(scores),
  };
}

export { PROFILE_KEYS };
