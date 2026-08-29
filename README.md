# Mapa do Amor

Quiz interativo de clareza amorosa com resultado personalizado. Produto
digital *low ticket* (R$ 37,90), web app mobile-first, PIX na própria
experiência.

> Norte do produto: não vender "um teste". Vender uma resposta rápida para
> uma dúvida amorosa que a usuária já está ruminando. A pequena vitória é
> sair da confusão para a clareza sobre o padrão atual da relação.

## Resumo

A usuária responde 24 perguntas (uma por tela, ~3–5 min) cruzando seis
dimensões — reciprocidade, comunicação, segurança emocional, conexão,
intimidade e alinhamento de futuro — e recebe um mapa personalizado: perfil
predominante, pontuações, interpretação, pontos fortes, pontos de atenção e
três próximos movimentos práticos.

Funil: anúncio/conteúdo → landing curta → quiz gratuito → pré-resultado com
curiosidade real → PIX de R$ 37,90 → confirmação automática → resultado
completo.

## Stack

| Camada | Escolha |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 |
| Backend | Next.js Route Handlers |
| Banco | Supabase Postgres (a configurar) |
| Realtime | Supabase Realtime (opcional, liberação pós-pagamento) |
| Pagamento | Mercado Pago Orders API (PIX transparente) |
| Deploy | GitHub + Vercel |
| Analytics | Meta Pixel + CAPI, GA4 (opcional) |

Scores são **sempre** calculados por regras determinísticas no backend — IA
(quando usada) só transforma dados já calculados em narrativa, nunca decide
pontuação.

## Estrutura de rotas

```
/                                  landing curta + CTA
/quiz/[session]                    motor de perguntas (24 perguntas)
/analise/[session]                 animação de conclusão + cálculo real
/resultado/[session]/preview       pré-resultado + paywall
/resultado/[session]/pagamento     PIX (QR Code, copia-e-cola, status)
/resultado/[session]                resultado completo (após pagamento)
/privacidade, /termos              páginas legais
```

## API (a implementar)

| Endpoint | Responsabilidade |
| --- | --- |
| `POST /api/session` | cria `session_id` anônimo |
| `POST /api/answers` | salva resposta e atualiza progresso |
| `POST /api/calculate` | valida conclusão e calcula scores deterministicamente |
| `GET /api/preview/:session` | retorna somente pré-resultado |
| `POST /api/payments/create` | cria PIX vinculado à sessão |
| `POST /api/webhooks/mercadopago` | recebe/valida evento; consulta status no provedor |
| `GET /api/payment-status/:session` | retorna `pending` / `paid` / `expired` |
| `GET /api/result/:session` | retorna conteúdo completo somente quando `paid=true` |
| `POST /api/result/generate` | (opcional) gera narrativa após pagamento |

## Modelo de dados (mínimo)

`mda_quiz_sessions`, `mda_quiz_answers`, `mda_quiz_scores`, `mda_payments`,
`mda_results`, `mda_events` — schema em `supabase/migrations/`. Prefixo
`mda_` porque o schema `public` é compartilhado com outros produtos no
mesmo projeto Supabase. Minimizar dados pessoais: usar identificador
interno de sessão, evitar persistir nome/CPF/e-mail além do estritamente
necessário ao PSP.

RLS habilitado em todas as tabelas, sem nenhuma policy para `anon`/
`authenticated`: todo acesso passa pelo backend usando a service role key
(`src/lib/supabase/server.ts`). O resultado pago é acessado por
`access_token` (UUID aleatório em `mda_results`), nunca pelo `session_id`
sequencial-friendly.

### Setup local

1. Copie `.env.example` para `.env.local`.
2. Preencha `SUPABASE_SERVICE_ROLE_KEY` com a service role key do projeto
   (Dashboard Supabase → Project Settings → API). Nunca commitar esse valor.
3. `npm install && npm run dev`.

Migrations ficam versionadas em `supabase/migrations/` e também são
aplicadas via MCP Supabase durante o desenvolvimento assistido.

## Regras de segurança (não negociáveis)

- Nunca colocar Access Token do Mercado Pago no frontend.
- Toda criação/consulta sensível de pagamento ocorre no servidor.
- Idempotency key na criação de pagamentos.
- Resultado nunca é liberado por resposta do frontend — sempre confirmado
  via webhook/consulta ao provedor.
- Rate limiting nos endpoints de pagamento e geração de resultado.
- Row Level Security no Supabase; sem acesso público direto a
  respostas/pagamentos.
- Resultados pagos acessados por token seguro, não por ID sequencial.
- Não enviar CPF, respostas íntimas ou conteúdo sensível para Meta Pixel/CAPI.
- Se houver sinais de abuso/violência/ameaça nas respostas, não gamificar:
  apresentar orientação de segurança e incentivar apoio apropriado.

## Checklist de implementação

- [x] Commit 1 — scaffold do app, design tokens, rotas e README
- [x] Commit 2 — schema Supabase + migrations + sessão anônima
- [x] Commit 3 — banco de perguntas + interface do quiz
- [x] Commit 4 — scoring engine + testes unitários
- [x] Commit 5 — preview e resultado mockado
- [ ] Commit 6 — Mercado Pago sandbox + webhook
- [ ] Commit 7 — bloqueio/liberação do resultado e estados de erro
- [ ] Commit 8 — analytics + UTMs
- [ ] Commit 9 — páginas legais + revisão de segurança
- [ ] Commit 10 — produção, QA e tag v1.0.0

## Decisões em aberto (antes de codar as próximas fases)

- Nome final e identidade visual definitivos.
- Questionário final com pontuação de cada alternativa (rascunho provisório
  em `src/lib/questions.ts` — 24 perguntas, 6 dimensões, precisa de revisão
  de conteúdo/psicometria antes do lançamento).
- Regras exatas de classificação dos 7 perfis.
- Textos finais do preview/paywall e do resultado por combinação de scores.
- Se haverá IA na narrativa já no MVP.
- Se o resultado exigirá e-mail para recuperação ou será acessado só por
  link seguro.
- Política de reembolso e suporte.

## Desenvolvimento

```bash
npm install
npm run dev
npm run test   # testes unitários (vitest) do motor de pontuação
```

## Motor de pontuação

`src/lib/scoring.ts` implementa as camadas 1–4 da personalização (seção
6.4), puras e determinísticas — sem IA decidindo score, conforme
recomendação técnica da seção 6.3:

- **Camada 1** `determineProfile` — perfil predominante entre os 7,
  avaliado por regras de prioridade sobre os 6 índices.
- **Camada 2** `calculateDimensionScores` — média 0–100 por dimensão a
  partir das respostas cruas.
- **Camada 3** `topStrengths` / `attentionAreas` — 2 maiores forças e 2
  menores índices.
- **Camada 4** `detectCombinations` — combinações relevantes entre
  dimensões (ex.: conexão alta + segurança baixa).

`POST /api/calculate` valida que a sessão respondeu as 24 perguntas,
executa o motor e persiste o resultado em `mda_quiz_scores`. Thresholds
das regras são provisórios — mesma decisão em aberto do questionário.

## Preview e resultado (Camada 5)

`src/lib/result-content.ts` monta o conteúdo condicional (textos por
perfil, explicação por dimensão, insights de combinação, 3 próximos
movimentos) a partir do que a Camada 1–4 calculou — sem IA, por template
+ regra. `POST /api/calculate` já gera e persiste esse conteúdo completo
em `mda_results`.

- `GET /api/preview/:session` — só o pré-resultado: quantidade de
  perguntas, 1 força e 1 atenção sem interpretação completa, frase de
  curiosidade e categoria ampla do perfil (nunca o nome/perfil completo).
- `GET /api/result/:session` — retorna o conteúdo completo **apenas**
  quando existe um registro `mda_payments` com `status = 'paid'` para a
  sessão. Sem isso, responde `402`. As páginas `/resultado/[session]` e
  `/resultado/[session]/preview` fazem essa checagem direto no servidor
  (nunca confiam em estado do frontend) — como ainda não existe pagamento
  real (Commit 6), a página de resultado completo só é alcançável hoje
  inserindo manualmente uma linha `mda_payments` com `status='paid'`.
