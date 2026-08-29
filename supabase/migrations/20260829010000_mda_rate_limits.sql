-- Rate limiting para os endpoints de pagamento e geração de resultado
-- (seção 13 da especificação: "Aplicar rate limiting nos endpoints de
-- pagamento e geração de resultado"). Janela deslizante simples por
-- bucket (chave + janela de tempo truncada), incrementada atomicamente.

create table if not exists public.mda_rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  count int not null default 1,
  primary key (bucket_key, window_start)
);

-- Buckets antigos não são apagados automaticamente aqui (sem pg_cron
-- disponível neste projeto compartilhado); a tabela é pequena e cada
-- linha expira logicamente quando a janela passa, então uma limpeza
-- periódica manual/ocasional é suficiente para o MVP.

alter table public.mda_rate_limits enable row level security;
-- Sem policies para anon/authenticated: acesso exclusivo via service role.
