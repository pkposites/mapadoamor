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
- [x] Commit 6 — Mercado Pago sandbox + webhook
- [x] Commit 7 — bloqueio/liberação do resultado e estados de erro
- [x] Commit 8 — analytics + UTMs
- [x] Commit 9 — páginas legais + revisão de segurança
- [x] Commit 10 — produção, QA e tag v1.0.0 (código pronto; validação com
  credenciais reais ainda pendente — ver abaixo)

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
npm run build  # build de produção + type check
npm run lint
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

## Pagamento PIX

`src/lib/mercadopago.ts` integra com a **Payments API v1** do Mercado
Pago (`POST /v1/payments`, `payment_method_id: "pix"`) — não a Orders API
mais recente sugerida na especificação. O domínio `mercadopago.com(.br)`
está bloqueado pelo proxy de rede deste ambiente, então não deu para
confirmar o payload exato da Orders API na documentação oficial antes de
escrever o código; implementar um fluxo de pagamento real contra um
contrato não verificado é arriscado demais, então usei a Payments API v1,
estável e bem documentada há anos. **Migrar para a Orders API é uma
pendência.**

- `POST /api/payments/create` — cria (ou reaproveita, se ainda válido) o
  PIX vinculado à sessão, com idempotency key por sessão.
- `POST /api/webhooks/mercadopago` — valida a assinatura (`x-signature`,
  HMAC-SHA256), consulta o pagamento direto na API do Mercado Pago (nunca
  confia só no corpo do evento) e libera o resultado.
- `GET /api/payment-status/:session` — `pending` / `paid` / `expired`,
  usado pelo polling da tela de pagamento.
- A tela `/resultado/[session]/pagamento` mostra QR Code + copia-e-cola e
  faz polling a cada 4s até detectar a aprovação.

Testes unitários (`src/lib/mercadopago.test.ts`) cobrem a validação de
assinatura do webhook — a parte mais sensível a acertar sem poder testar
contra o provedor real.

### Pendências antes de testar de verdade

- Preencher `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` no
  `.env.local` com credenciais de sandbox (Dashboard Mercado Pago →
  Suas integrações → credenciais de teste).
- Confirmar o payload da Payments API `pix` num teste real de sandbox — em
  especial os campos de QR Code (`point_of_interaction.transaction_data`)
  e o formato de `x-signature` do webhook, que aqui foram implementados
  a partir de conhecimento prévio, sem checar a documentação ao vivo.
- Decidir se `payer.email` será coletado de verdade na tela de pagamento
  ou se o placeholder sintético por sessão (`sessao-<id>@mapadoamor.app`)
  é aceitável para produção — o Mercado Pago pode ter regras próprias
  sobre e-mails de pagador não verificáveis.
- Configurar `NEXT_PUBLIC_SITE_URL` com a URL pública em produção (usada
  para montar a `notification_url` do webhook).

## Estados de erro do pagamento (Commit 7)

`src/lib/payment-state.ts` centraliza (e testa) as regras de transição de
estado do PIX — `paid`/`cancelled` são terminais e nunca regridem, mesmo
que `expires_at` já tenha passado, para garantir que **um pagamento
confirmado nunca volte a bloquear o resultado**.

- `POST /api/payments/create` recusa criar PIX antes do quiz concluído
  (409), reaproveita um PIX ainda válido, e gera um novo automaticamente
  quando o anterior expirou.
- `GET /api/payment-status/:session` persiste a transição `pending` →
  `expired` no banco (não fica só no cálculo em memória).
- `POST /api/webhooks/mercadopago` é idempotente contra reentrega: só
  registra `paid_at` e dispara o evento `Purchase` na primeira transição
  para pago — reentregas do mesmo evento (comportamento normal do MP até
  receber 200) não duplicam o evento de compra no analytics.
- A tela de pagamento mostra "Gerar novo PIX" quando o código expira ou o
  pagamento é recusado, em vez de deixar a usuária travada.
- `/resultado/[session]` nunca entra em loop de redirect com o preview:
  se o pagamento está confirmado mas o resultado ainda não foi calculado
  (não deveria acontecer no funil normal), mostra uma tela de
  "finalizando" em vez de mandar de volta pro preview.
- Sessões `paid`/`completed` que revisitam `/quiz` ou `/analise` pulam
  direto para o resultado/preview certo, sem recalcular à toa.

## Analytics e UTMs (Commit 8)

Os 13 eventos da seção 15 estão instrumentados fim a fim: `ViewLanding`,
`StartQuiz`, `AnswerQuestion`, `Quiz25/50/75`, `CompleteQuiz`,
`ViewPreview`, `InitiateCheckout`, `PixGenerated`, `Purchase`,
`ViewFullResult`, `ShareResult`.

- `src/lib/analytics.ts` (`track()`) dispara pro Meta Pixel (`fbq`) — como
  evento padrão (`InitiateCheckout`/`Purchase`) ou customizado — pro GA4
  (`gtag`) e faz um log best-effort em `mda_events` via `POST /api/events`,
  que alimenta o futuro painel de funil (seção 19). **Nunca** manda
  resposta de quiz, score ou qualquer dado sensível — só nome do evento,
  `session_id`, valor e moeda quando aplicável (seção 15, última linha).
- `POST /api/events` é público (sem auth, chamado do browser) — por isso
  valida o `event_name` contra uma whitelist fechada e sanitiza o
  metadata (`sanitizeEventMetadata`, testado) para não virar vetor de
  abuso nem guardar dado sensível por engano.
- `AnalyticsScripts` só carrega os scripts do Pixel/GA4 se
  `NEXT_PUBLIC_META_PIXEL_ID` / `NEXT_PUBLIC_GA_MEASUREMENT_ID`
  estiverem configurados — em dev, sem essas variáveis, o app roda sem
  nenhum script de terceiro.
- `Purchase` é registrado duas vezes por design: no servidor, pelo
  webhook (fonte de verdade em `mda_events`, sem acesso ao browser) e no
  client, uma única vez por sessão via `localStorage`
  (`TrackPurchase`) — é o disparo que alimenta a otimização de campanha
  do Meta/GA4, que só recebe eventos vindos do navegador (CAPI server-side
  fica fora do escopo do MVP).
- UTMs (`utm_source/medium/campaign/content/term`) já são capturadas na
  criação da sessão (Commit 2) e persistidas em `mda_quiz_sessions`.

## Páginas legais e revisão de segurança (Commit 9)

`/privacidade` e `/termos` têm conteúdo real (LGPD, o que o produto não
é/não promete, retenção de dados, reembolso, orientação de segurança para
respostas sensíveis) em vez do placeholder dos commits anteriores. Um
`Footer` com os links de privacidade/termos/suporte
(`suporte@mapadoamor.app`, endereço provisório) aparece em todas as
páginas — inclusive antes do pagamento, como a seção 13 exige.

Checklist da seção 13, item a item:

- ✅ Access Token do Mercado Pago nunca chega ao frontend (`mercadopago.ts`
  é server-only).
- ✅ Toda criação/consulta sensível de pagamento roda no servidor.
- ✅ Idempotency key na criação de pagamento (Commit 6).
- ✅ Resultado nunca libera por resposta do frontend — só por
  `mda_payments.status='paid'` confirmado via webhook (Commit 6/7).
- ✅ **Rate limiting** adicionado nos endpoints de pagamento e geração de
  resultado: `mda_rate_limits` (nova migration) guarda uma janela por IP;
  `POST /api/payments/create` (10/min), `POST /api/calculate` (20/min),
  `GET /api/result/:session` (30/min) e `POST /api/answers` (60/min,
  janela maior por gerar muito mais tráfego legítimo) recusam com 429
  acima do limite.
- ✅ RLS habilitado em todas as tabelas `mda_*`, sem policies públicas.
- ⏳ Resultado acessado por `session_id`, não por `access_token` seguro —
  gap conhecido, registrado abaixo, decisão explícita de adiar.
- ✅ UTMs e campos livres sanitizados (truncados, tipo validado) desde o
  Commit 2.
- ✅ Nenhum dado sensível (CPF, resposta, score) vai para Meta Pixel/CAPI.
- ✅ Política de privacidade, termos e contato de suporte agora visíveis
  em todas as telas, inclusive antes do pagamento.

**Bug de integridade corrigido neste commit**: `POST /api/answers`
confiava no `numeric_value` enviado pelo client para gravar a pontuação
da resposta — nada impedia forjar uma pontuação alta enviando qualquer
número junto com um `answer_key` legítimo, mesmo sem realmente escolher
aquela alternativa. Corrigido: o servidor agora sempre deriva o valor a
partir de `question_id` + `answer_key` consultando o banco de perguntas
(`QUESTIONS`), rejeitando qualquer combinação que não exista. O client
não envia mais `numeric_value`.

### Nota de segurança pendente

`/resultado/[session]` usa o `session_id` (UUID aleatório) como a própria
chave de acesso ao resultado pago. `ShareResultButton` compartilha essa
URL diretamente. O schema já tem um `access_token` dedicado em
`mda_results` (pensado como link seguro de compartilhamento, seção 13),
mas ele ainda não é usado — trocar a rota de resultado para usar
`access_token` em vez do `session_id` bruto é um endurecimento de
segurança recomendado antes do lançamento, não feito neste commit para
não expandir escopo além de analytics.

## Produção, QA e v1.0.0 (Commit 10)

Este commit fecha os 10 commits da especificação (seção 23). O código
está completo para o MVP descrito, `npm run build`/`lint`/`test` passam
limpos, e um round-trip real contra o schema Supabase (sessão → scores →
resultado → pagamento pago, via SQL direto) confirmou que os tipos e
constraints batem com o que a aplicação lê/escreve. **Isso não substitui
QA end-to-end pela UI com credenciais de sandbox reais** — sem
`SUPABASE_SERVICE_ROLE_KEY` e `MERCADOPAGO_ACCESS_TOKEN`/
`MERCADOPAGO_WEBHOOK_SECRET` preenchidos, o app não roda de fato.

### Checklist de QA da seção 18/Fase 5 — o que dá para garantir por código vs. o que precisa de teste manual

Garantido por código/testes automatizados:
- ✅ Pagamento confirmado nunca volta a bloquear o resultado (testado em
  `payment-state.test.ts`).
- ✅ Idempotência de webhook repetido (não duplica `Purchase`/`paid_at`).
- ✅ Nenhuma combinação de scores gera "força" e "atenção" na mesma
  dimensão (testado em `scoring.test.ts`).
- ✅ Resultado só libera com pagamento confirmado no servidor.

Precisa de teste manual com credenciais reais (pendência sua):
- [ ] Pagamento aprovado, pendente, expirado e duplicado num sandbox real
  do Mercado Pago — o código trata os 4 casos, mas nunca foi exercitado
  contra a API de verdade (ver ressalva na seção "Pagamento PIX").
- [ ] iPhone/Android e navegadores principais.
- [ ] Conexão lenta e refresh durante o PIX.
- [ ] Expiração real do PIX (hoje configurada para 30 min).
- [ ] Revisar as 7×6 combinações de perfil/dimensão em busca de
  contradições de texto (o motor evita a contradição estrutural
  força-vs-atenção, mas não foi lido perfil por perfil por um humano).
- [ ] Compra real de baixo risco em produção antes de abrir tráfego.

### Deploy (Vercel)

1. Conectar o repositório no Vercel (o projeto já é um Next.js padrão,
   zero-config).
2. Configurar as variáveis de ambiente de produção (mesmas chaves do
   `.env.example`), com `NEXT_PUBLIC_SITE_URL` apontando para o domínio
   real e credenciais de **produção** do Mercado Pago (não as de sandbox).
3. Registrar a URL do webhook (`https://<domínio>/api/webhooks/mercadopago`)
   no painel do Mercado Pago.
4. Rodar as migrations pendentes (`supabase/migrations/`) contra o
   projeto Supabase de produção, se for um projeto diferente do usado em
   desenvolvimento.
5. Confirmar HTTPS (obrigatório para o Meta Pixel e para o Mercado Pago
   validar o webhook).

### Tag

`v1.0.0` marca o MVP funcionalmente completo conforme a especificação —
scaffold do produto pronto para QA manual e configuração de credenciais
de produção, não uma validação de que já rodou de ponta a ponta com
dinheiro real.
