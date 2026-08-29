// Tipos mínimos das tabelas mda_* (ver supabase/migrations). Serão
// substituídos por tipos gerados (`supabase gen types`) quando o schema
// estabilizar nos próximos commits.

export type QuizSessionStatus = "started" | "completed" | "paid" | "expired";

export type QuizSession = {
  id: string;
  created_at: string;
  status: QuizSessionStatus;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  current_step: number;
  consent_version: string | null;
};
