-- Mapa do Amor — schema mínimo (seção 11 da especificação)
-- Tabelas prefixadas com mda_ porque este projeto Supabase é compartilhado
-- com outros produtos (public schema multi-tenant).
--
-- Nenhuma policy pública é criada: todo acesso (leitura e escrita) passa
-- pelo backend (service role), nunca pelo client direto. RLS habilitado em
-- todas as tabelas como camada extra de proteção.

create extension if not exists "pgcrypto";

-- Sessão anônima do quiz.
create table if not exists public.mda_quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'started'
    check (status in ('started', 'completed', 'paid', 'expired')),
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  current_step int not null default 0,
  consent_version text
);

-- Respostas individuais do quiz.
create table if not exists public.mda_quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mda_quiz_sessions(id) on delete cascade,
  question_id text not null,
  answer_key text not null,
  numeric_value smallint not null,
  created_at timestamptz not null default now(),
  unique (session_id, question_id)
);

-- Scores calculados deterministicamente (uma linha por sessão).
create table if not exists public.mda_quiz_scores (
  session_id uuid primary key references public.mda_quiz_sessions(id) on delete cascade,
  reciprocity smallint not null check (reciprocity between 0 and 100),
  communication smallint not null check (communication between 0 and 100),
  security smallint not null check (security between 0 and 100),
  connection smallint not null check (connection between 0 and 100),
  intimacy smallint not null check (intimacy between 0 and 100),
  future_alignment smallint not null check (future_alignment between 0 and 100),
  profile_key text not null,
  calculated_at timestamptz not null default now()
);

-- Pagamentos PIX (Mercado Pago Orders API e futuras alternativas).
create table if not exists public.mda_payments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mda_quiz_sessions(id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text,
  amount numeric(10, 2) not null default 37.90,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled')),
  qr_code text,
  pix_copy_paste text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  -- idempotência na criação de pagamento por sessão
  unique (session_id, provider)
);

create unique index if not exists mda_payments_provider_payment_id_idx
  on public.mda_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

-- Resultado completo, liberado apenas após pagamento confirmado.
create table if not exists public.mda_results (
  session_id uuid primary key references public.mda_quiz_sessions(id) on delete cascade,
  result_version int not null default 1,
  access_token uuid not null default gen_random_uuid(),
  strengths jsonb not null default '[]'::jsonb,
  attention jsonb not null default '[]'::jsonb,
  pattern_key text,
  actions jsonb not null default '[]'::jsonb,
  narrative text,
  generated_at timestamptz not null default now()
);

create unique index if not exists mda_results_access_token_idx
  on public.mda_results (access_token);

-- Eventos de analytics/funil (server-side, sem dados sensíveis).
create table if not exists public.mda_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.mda_quiz_sessions(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists mda_quiz_answers_session_idx on public.mda_quiz_answers (session_id);
create index if not exists mda_payments_session_idx on public.mda_payments (session_id);
create index if not exists mda_events_session_idx on public.mda_events (session_id);

alter table public.mda_quiz_sessions enable row level security;
alter table public.mda_quiz_answers enable row level security;
alter table public.mda_quiz_scores enable row level security;
alter table public.mda_payments enable row level security;
alter table public.mda_results enable row level security;
alter table public.mda_events enable row level security;

-- Sem policies para anon/authenticated: acesso exclusivo via service role
-- no backend (Route Handlers), conforme seção 13 da especificação.
