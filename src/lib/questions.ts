import type { DimensionKey } from "./dimensions";

export type QuestionDimension = DimensionKey | "context";

export type QuestionOption = {
  key: string;
  label: string;
  // Contribuição já normalizada de 0 a 100 na dimensão da pergunta.
  // Perguntas de "context" não pontuam (value sempre 0, ignorado no cálculo).
  value: number;
};

export type Question = {
  id: string;
  dimension: QuestionDimension;
  text: string;
  options: QuestionOption[];
};

// MVP: 24 perguntas — 4 de contexto (não pontuam) + 20 distribuídas nas 6
// dimensões de scoring. Pontuação de cada alternativa é provisória (decisão
// em aberto na seção 24 da especificação) e deve ser revisada na Fase 0
// antes do lançamento; o motor de cálculo (Commit 4) consome numeric_value
// diretamente, então "value" já representa o score 0–100 na dimensão,
// com inversões (ex.: medo/insegurança) resolvidas aqui na alternativa.
export const QUESTIONS: Question[] = [
  // Contexto — não pontuado, usado apenas para personalizar linguagem.
  {
    id: "ctx-status",
    dimension: "context",
    text: "Hoje você está:",
    options: [
      { key: "conhecendo", label: "Conhecendo alguém", value: 0 },
      { key: "namorando", label: "Namorando", value: 0 },
      { key: "casada", label: "Casada", value: 0 },
      { key: "complicada", label: "Numa relação complicada", value: 0 },
      { key: "separada_contato", label: "Separada, com contato ainda ativo", value: 0 },
    ],
  },
  {
    id: "ctx-tempo",
    dimension: "context",
    text: "Há quanto tempo vocês estão juntos?",
    options: [
      { key: "menos_6m", label: "Menos de 6 meses", value: 0 },
      { key: "6m_2a", label: "Entre 6 meses e 2 anos", value: 0 },
      { key: "2a_5a", label: "Entre 2 e 5 anos", value: 0 },
      { key: "mais_5a", label: "Mais de 5 anos", value: 0 },
    ],
  },
  {
    id: "ctx-convivencia",
    dimension: "context",
    text: "Como é a convivência no dia a dia?",
    options: [
      { key: "moram_juntos", label: "Moramos juntos", value: 0 },
      { key: "frequente", label: "Nos vemos com frequência", value: 0 },
      { key: "esporadica", label: "Nos vemos esporadicamente", value: 0 },
      { key: "distancia", label: "Relação à distância", value: 0 },
    ],
  },
  {
    id: "ctx-motivo",
    dimension: "context",
    text: "O que mais te trouxe até aqui hoje?",
    options: [
      { key: "duvida_reciprocidade", label: "Dúvida se recebo o mesmo tanto que dou", value: 0 },
      { key: "mudanca_percebida", label: "Uma mudança que percebi na relação", value: 0 },
      { key: "conflitos", label: "Conflitos que se repetem", value: 0 },
      { key: "futuro", label: "Incerteza sobre o futuro da relação", value: 0 },
    ],
  },

  // Reciprocidade
  {
    id: "recip-nivel-interesse",
    dimension: "reciprocity",
    text: "Você sente que recebe o mesmo nível de interesse que entrega?",
    options: [
      { key: "sempre", label: "Sim, quase sempre", value: 100 },
      { key: "maioria", label: "Na maior parte do tempo", value: 70 },
      { key: "as_vezes", label: "Às vezes sim, às vezes não", value: 40 },
      { key: "raramente", label: "Raramente", value: 10 },
    ],
  },
  {
    id: "recip-iniciativa",
    dimension: "reciprocity",
    text: "Quem costuma iniciar conversas, encontros ou demonstrações de carinho?",
    options: [
      { key: "os_dois", label: "Os dois, de forma equilibrada", value: 100 },
      { key: "mais_eu_um_pouco", label: "Mais eu, mas ele também puxa às vezes", value: 55 },
      { key: "quase_so_eu", label: "Quase sempre eu", value: 20 },
      { key: "quase_so_ele", label: "Quase sempre ele", value: 60 },
    ],
  },
  {
    id: "recip-esforco",
    dimension: "reciprocity",
    text: "Comparando com o começo da relação, o esforço dele hoje é:",
    options: [
      { key: "maior", label: "Maior do que antes", value: 100 },
      { key: "igual", label: "Igual a antes", value: 80 },
      { key: "um_pouco_menor", label: "Um pouco menor", value: 45 },
      { key: "bem_menor", label: "Bem menor", value: 15 },
    ],
  },
  {
    id: "recip-curiosidade",
    dimension: "reciprocity",
    text: "Vocês ainda demonstram curiosidade um pelo outro (perguntar do dia, se interessar por detalhes)?",
    options: [
      { key: "sim_bastante", label: "Sim, bastante", value: 100 },
      { key: "as_vezes", label: "Às vezes", value: 60 },
      { key: "pouco", label: "Pouco", value: 30 },
      { key: "quase_nunca", label: "Quase nunca", value: 5 },
    ],
  },

  // Comunicação
  {
    id: "com-problema",
    dimension: "communication",
    text: "Quando existe um problema entre vocês, o que normalmente acontece?",
    options: [
      { key: "conversam_resolvem", label: "Conversamos e chegamos a uma solução", value: 100 },
      { key: "conversam_meio_termo", label: "Conversamos, mas nem sempre resolve de fato", value: 60 },
      { key: "esfria_sem_falar", label: "Esfria e seguimos sem falar sobre isso", value: 25 },
      { key: "vira_briga", label: "Quase sempre vira briga", value: 10 },
    ],
  },
  {
    id: "com-conflitos-fim",
    dimension: "communication",
    text: "Os conflitos costumam terminar com solução ou apenas esfriar?",
    options: [
      { key: "solucao_clara", label: "Com uma solução clara", value: 100 },
      { key: "acordo_parcial", label: "Com um acordo parcial", value: 65 },
      { key: "so_esfria", label: "Só esfria, sem resolver de verdade", value: 30 },
      { key: "fica_pendente", label: "Fica pendente e volta depois", value: 15 },
    ],
  },
  {
    id: "com-escuta",
    dimension: "communication",
    text: "Você se sente ouvida quando fala sobre algo que te machuca?",
    options: [
      { key: "sempre", label: "Sim, sempre", value: 100 },
      { key: "geralmente", label: "Geralmente sim", value: 70 },
      { key: "as_vezes", label: "Às vezes ele minimiza", value: 35 },
      { key: "raramente", label: "Raramente me sinto ouvida", value: 10 },
    ],
  },
  {
    id: "com-defensividade",
    dimension: "communication",
    text: "Quando você aponta algo que te incomoda, a reação dele costuma ser:",
    options: [
      { key: "acolhe", label: "Ele escuta e tenta entender", value: 100 },
      { key: "explica", label: "Ele se explica, mas escuta", value: 65 },
      { key: "defensivo", label: "Ele fica na defensiva", value: 30 },
      { key: "inverte", label: "Ele vira o jogo pra cima de mim", value: 5 },
    ],
  },

  // Segurança emocional
  {
    id: "seg-confianca",
    dimension: "security",
    text: "Você confia no que ele diz e faz?",
    options: [
      { key: "totalmente", label: "Totalmente", value: 100 },
      { key: "na_maioria", label: "Na maioria das vezes", value: 70 },
      { key: "com_ressalvas", label: "Confio, mas com ressalvas", value: 40 },
      { key: "pouco", label: "Confio pouco", value: 10 },
    ],
  },
  {
    id: "seg-lugar",
    dimension: "security",
    text: "Você sente segurança sobre o lugar que ocupa na vida dele?",
    options: [
      { key: "sim_clara", label: "Sim, é claro pra mim", value: 100 },
      { key: "na_maior_parte", label: "Na maior parte do tempo", value: 65 },
      { key: "duvido_as_vezes", label: "Às vezes duvido", value: 35 },
      { key: "nao_sei", label: "Não sei dizer qual é meu lugar", value: 10 },
    ],
  },
  {
    id: "seg-medo-perda",
    dimension: "security",
    text: "Com que frequência você sente medo de ser deixada ou substituída?",
    options: [
      { key: "nunca", label: "Quase nunca penso nisso", value: 100 },
      { key: "raramente", label: "Raramente", value: 70 },
      { key: "frequente", label: "Com certa frequência", value: 35 },
      { key: "constante", label: "É um medo quase constante", value: 5 },
    ],
  },
  {
    id: "seg-previsibilidade",
    dimension: "security",
    text: "O comportamento dele com você é:",
    options: [
      { key: "previsivel", label: "Previsível e consistente", value: 100 },
      { key: "geralmente_estavel", label: "Geralmente estável, com raras oscilações", value: 65 },
      { key: "oscila_bastante", label: "Oscila bastante", value: 30 },
      { key: "imprevisivel", label: "É imprevisível", value: 10 },
    ],
  },

  // Conexão emocional (2) + Intimidade (2)
  {
    id: "con-ser-voce",
    dimension: "connection",
    text: "Você sente que pode ser completamente você mesma nessa relação?",
    options: [
      { key: "sim_totalmente", label: "Sim, totalmente", value: 100 },
      { key: "na_maior_parte", label: "Na maior parte do tempo", value: 65 },
      { key: "me_policio", label: "Às vezes me policio", value: 30 },
      { key: "raramente", label: "Raramente me sinto assim", value: 5 },
    ],
  },
  {
    id: "con-distancia-reacao",
    dimension: "connection",
    text: "Quando ele fica distante, qual tende a ser sua reação?",
    options: [
      { key: "conversa_tranquila", label: "Pergunto com tranquilidade e sigo minha vida", value: 100 },
      { key: "ansiedade_leve", label: "Fico um pouco ansiosa, mas espero", value: 55 },
      { key: "cobro", label: "Cobro ou insisto até ele responder", value: 25 },
      { key: "desespero", label: "Entro em desespero", value: 5 },
    ],
  },
  {
    id: "int-frequencia",
    dimension: "intimacy",
    text: "Existe carinho e intimidade na frequência que você gostaria?",
    options: [
      { key: "sim", label: "Sim, na medida certa", value: 100 },
      { key: "quase", label: "Quase, poderia ser um pouco mais", value: 65 },
      { key: "pouco", label: "Sinto falta com frequência", value: 30 },
      { key: "quase_nada", label: "Quase não existe hoje", value: 5 },
    ],
  },
  {
    id: "int-abertura",
    dimension: "intimacy",
    text: "Como está a proximidade emocional entre vocês (conversas íntimas, vulnerabilidade)?",
    options: [
      { key: "muito_proxima", label: "Muito próxima", value: 100 },
      { key: "razoavel", label: "Razoável", value: 60 },
      { key: "distante", label: "Meio distante", value: 30 },
      { key: "muito_distante", label: "Muito distante", value: 5 },
    ],
  },

  // Alinhamento de futuro
  {
    id: "fut-planos",
    dimension: "future_alignment",
    text: "Vocês fazem planos de médio/longo prazo juntos?",
    options: [
      { key: "sim_claros", label: "Sim, planos claros", value: 100 },
      { key: "conversamos_vagamente", label: "Conversamos, mas de forma vaga", value: 55 },
      { key: "evitamos", label: "Evitamos falar sobre isso", value: 25 },
      { key: "nunca", label: "Nunca conversamos sobre isso", value: 5 },
    ],
  },
  {
    id: "fut-mesma-relacao",
    dimension: "future_alignment",
    text: "Você sente que deseja a mesma relação que ele parece desejar?",
    options: [
      { key: "sim_alinhados", label: "Sim, estamos alinhados", value: 100 },
      { key: "proximo", label: "Bem próximo disso", value: 65 },
      { key: "duvida", label: "Tenho dúvidas", value: 30 },
      { key: "nao", label: "Sinto que queremos coisas diferentes", value: 5 },
    ],
  },
  {
    id: "fut-12-meses",
    dimension: "future_alignment",
    text: "Se nada mudasse nos próximos 12 meses, você ficaria feliz permanecendo nessa relação?",
    options: [
      { key: "sim_feliz", label: "Sim, ficaria feliz", value: 100 },
      { key: "aceitaria", label: "Aceitaria, mas queria mudanças", value: 55 },
      { key: "dificil", label: "Seria difícil aceitar", value: 20 },
      { key: "nao", label: "Não, isso me preocupa", value: 5 },
    ],
  },
  {
    id: "fut-continuidade",
    dimension: "future_alignment",
    text: "Pensando no que vocês constroem juntos, você sente:",
    options: [
      { key: "crescendo", label: "Que estamos crescendo juntos", value: 100 },
      { key: "estavel", label: "Que estamos estáveis, sem grandes mudanças", value: 65 },
      { key: "estagnado", label: "Que estamos meio estagnados", value: 30 },
      { key: "andando_para_tras", label: "Que estamos andando para trás", value: 5 },
    ],
  },
];

export const TOTAL_QUESTIONS = QUESTIONS.length;
