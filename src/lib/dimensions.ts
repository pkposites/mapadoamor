// Dimensões avaliadas pelo quiz (0–100 cada, calculadas no backend).
// Chaves alinhadas com quiz_scores no schema do Supabase (ver README/migrations).
export const DIMENSIONS = [
  "reciprocity",
  "communication",
  "security",
  "connection",
  "intimacy",
  "future_alignment",
] as const;

export type DimensionKey = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  reciprocity: "Reciprocidade",
  communication: "Comunicação",
  security: "Segurança emocional",
  connection: "Conexão emocional",
  intimacy: "Intimidade",
  future_alignment: "Alinhamento de futuro",
};

// Perfis predominantes (regras conceituais — cálculo exato definido na Fase 0/6).
export const PROFILE_KEYS = [
  "amor_reciproco",
  "amor_intenso",
  "amor_em_desequilibrio",
  "amor_distante",
  "amor_preso_em_ciclo",
  "amor_em_construcao",
  "amor_que_pede_clareza",
] as const;

export type ProfileKey = (typeof PROFILE_KEYS)[number];

export const PROFILE_LABELS: Record<ProfileKey, string> = {
  amor_reciproco: "Amor Recíproco",
  amor_intenso: "Amor Intenso",
  amor_em_desequilibrio: "Amor em Desequilíbrio",
  amor_distante: "Amor Distante",
  amor_preso_em_ciclo: "Amor Preso em um Ciclo",
  amor_em_construcao: "Amor em Construção",
  amor_que_pede_clareza: "Amor que Pede Clareza",
};
