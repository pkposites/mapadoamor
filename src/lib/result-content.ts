import { DIMENSION_LABELS, DIMENSIONS, PROFILE_LABELS, type DimensionKey, type ProfileKey } from "./dimensions";
import type { CombinationKey, DimensionScores, ScoringResult } from "./scoring";

// Camada 5 — textos condicionais selecionados a partir dos dados
// calculados (perfil, scores, combinações). Nada de IA aqui: todo o texto
// é montado por template + regra determinística, como recomendado na
// seção 6.3. Conteúdo é rascunho provisório (decisão em aberto — seção 24).

export type NextMove = {
  type: "observacao" | "conversa" | "comportamento";
  text: string;
};

type ProfileContent = {
  headline: string;
  pattern: string;
  partnerPerception: string;
  selfInsight: string;
  centralQuestion: string;
  baseMoves: NextMove[];
};

export const PROFILE_CONTENT: Record<ProfileKey, ProfileContent> = {
  amor_reciproco: {
    headline: "Você vive um momento de boa troca e estabilidade relativa.",
    pattern: "Aproximação → resposta → segurança → continuidade.",
    partnerPerception:
      "Pelas suas respostas, você percebe um parceiro presente, que retribui o esforço que você entrega na maior parte do tempo.",
    selfInsight:
      "Você tende a se sentir segura para ser você mesma e confia no que constrói com ele — mas ainda vale observar pontos específicos antes de dar tudo como resolvido.",
    centralQuestion:
      "O que precisaria continuar acontecendo para essa reciprocidade se manter mesmo nos momentos difíceis?",
    baseMoves: [
      { type: "observacao", text: "Observe se a reciprocidade se mantém também nos momentos de estresse, não só na rotina tranquila." },
      { type: "conversa", text: "Converse sobre o que vocês dois consideram 'estar bem' daqui a um ano, para manter o alinhamento." },
      { type: "comportamento", text: "Evite deixar de nomear o que funciona só porque está bom — reconhecimento também fortalece." },
    ],
  },
  amor_intenso: {
    headline: "Existe uma conexão intensa, mas com oscilações que pedem atenção.",
    pattern: "Intensidade → aproximação forte → oscilação → dúvida → reaproximação.",
    partnerPerception:
      "Pelas suas respostas, você percebe alguém com quem a conexão é forte, mas cuja previsibilidade ou consistência nem sempre acompanha essa intensidade.",
    selfInsight:
      "Você parece viver essa relação com bastante intensidade emocional, o que traz proximidade real, mas também pode custar segurança no dia a dia.",
    centralQuestion:
      "A intensidade que vocês vivem hoje está sendo sustentada por estabilidade, ou por ciclos de aproximação e afastamento?",
    baseMoves: [
      { type: "observacao", text: "Observe se os momentos de distância têm um padrão (situação, tema, horário) em vez de parecerem aleatórios." },
      { type: "conversa", text: "Converse sobre o que cada um entende por 'segurança' na relação — pode haver definições diferentes." },
      { type: "comportamento", text: "Evite usar a intensidade da conexão como prova de que não há nada a ajustar." },
    ],
  },
  amor_em_desequilibrio: {
    headline: "Suas respostas mostram uma diferença relevante entre o que você entrega e o que sente que recebe.",
    pattern: "Entrega → pouca resposta → esforço extra → cansaço.",
    partnerPerception:
      "Pelas suas respostas, você percebe um parceiro presente em alguns aspectos, mas cuja iniciativa e retorno parecem menores do que o seu esforço.",
    selfInsight:
      "Você tende a ser quem mais investe na relação — em iniciativa, atenção ou disposição para resolver — o que pode gerar cansaço com o tempo.",
    centralQuestion:
      "O que aconteceria com essa relação se, por uma semana, você entregasse exatamente o que recebe — nem mais, nem menos?",
    baseMoves: [
      { type: "observacao", text: "Observe, sem cobrar, quantas vezes por semana a iniciativa parte dele." },
      { type: "conversa", text: "Converse abertamente sobre reciprocidade, usando exemplos concretos em vez de acusações." },
      { type: "comportamento", text: "Evite compensar automaticamente a falta de iniciativa dele fazendo ainda mais por dois." },
    ],
  },
  amor_distante: {
    headline: "Seus dados mostram redução de conexão e intimidade, com pouca aproximação recente.",
    pattern: "Distanciamento → normalização → menos tentativas → afastamento.",
    partnerPerception:
      "Pelas suas respostas, você percebe um parceiro presente fisicamente, mas com quem a proximidade emocional diminuiu.",
    selfInsight:
      "Você parece sentir falta de uma proximidade que já existiu ou que ainda não se estabeleceu como gostaria.",
    centralQuestion:
      "Quando foi a última vez que vocês dois, juntos, tentaram ativamente se aproximar — e o que impediu que isso virasse hábito?",
    baseMoves: [
      { type: "observacao", text: "Observe se o distanciamento é mais forte em algum contexto específico (rotina, trabalho, conflito não resolvido)." },
      { type: "conversa", text: "Converse sobre reaproximação de forma leve, sem transformar a conversa em cobrança." },
      { type: "comportamento", text: "Evite deixar a distância virar rotina silenciosa — pequenos gestos importam mais do que grandes conversas nesse momento." },
    ],
  },
  amor_preso_em_ciclo: {
    headline: "Há conflitos recorrentes que costumam se repetir sem resolução consistente.",
    pattern: "Conflito → desgaste → trégua → mesmo gatilho → conflito de novo.",
    partnerPerception:
      "Pelas suas respostas, você percebe um parceiro com quem os desentendimentos se repetem, mais do que se resolvem de fato.",
    selfInsight:
      "Você parece estar presa em um ciclo de conflito e trégua, sem que a causa raiz seja realmente resolvida entre vocês.",
    centralQuestion:
      "Se vocês pudessem nomear o conflito que mais se repete, qual seria — e o que vocês já tentaram (e não funcionou) para resolvê-lo?",
    baseMoves: [
      { type: "observacao", text: "Observe se o mesmo tema volta em formatos diferentes — pode ser um sintoma de uma causa mais profunda." },
      { type: "conversa", text: "Converse fora do calor do momento, com o objetivo de entender a causa, não de vencer a discussão." },
      { type: "comportamento", text: "Evite retomar o conflito no mesmo horário/contexto em que ele sempre piora." },
    ],
  },
  amor_em_construcao: {
    headline: "A relação ainda está se formando, com sinais positivos e algumas incertezas naturais dessa fase.",
    pattern: "Aproximação → descoberta → ajuste → nova aproximação.",
    partnerPerception:
      "Pelas suas respostas, você percebe um parceiro com quem ainda estão se conhecendo e ajustando expectativas — o que é esperado nessa fase.",
    selfInsight:
      "Você parece estar em um momento de construção real, com abertura para o que pode vir a ser, mas ainda sem certezas fechadas.",
    centralQuestion:
      "O que você mais precisa entender sobre ele (ou sobre vocês dois) antes de sentir mais clareza sobre para onde isso vai?",
    baseMoves: [
      { type: "observacao", text: "Observe como ele reage nos momentos em que vocês discordam — isso revela mais do que a fase de lua de mel." },
      { type: "conversa", text: "Converse sobre expectativas de forma leve, sem pressa de definir rótulos antes da hora." },
      { type: "comportamento", text: "Evite antecipar conclusões definitivas sobre a relação enquanto ela ainda está se formando." },
    ],
  },
  amor_que_pede_clareza: {
    headline: "Suas respostas mostram sinais contraditórios ou pouca definição sobre onde vocês estão.",
    pattern: "Sinal positivo → dúvida → nova esperança → nova dúvida.",
    partnerPerception:
      "Pelas suas respostas, sua percepção sobre ele oscila — em alguns momentos parece presente, em outros, distante ou imprevisível.",
    selfInsight:
      "Você parece estar tentando decifrar sinais que, por ora, não formam um padrão claro — o que naturalmente gera desgaste mental.",
    centralQuestion:
      "Se você tivesse que descrever essa relação hoje em uma frase, sem meio-termo, o que diria — e o que te impede de dizer isso a ele?",
    baseMoves: [
      { type: "observacao", text: "Observe se a falta de clareza vem dele (sinais mistos) ou de expectativas que vocês nunca alinharam." },
      { type: "conversa", text: "Converse pedindo clareza direta sobre o que ele quer, em vez de interpretar sinais indiretos." },
      { type: "comportamento", text: "Evite tomar decisões grandes sobre a relação enquanto o quadro ainda estiver tão pouco definido." },
    ],
  },
};

const COMBINATION_TEXTS: Record<CombinationKey, string> = {
  conexao_alta_seguranca_baixa:
    "Existe um vínculo presente, mas vivido com incerteza: a conexão é real, porém a segurança emocional não acompanha na mesma intensidade.",
  reciprocidade_baixa_comunicacao_alta:
    "Vocês conseguem conversar, mas isso não tem se traduzido em mais equilíbrio no que cada um entrega para a relação.",
  futuro_desalinhado_intimidade_alta:
    "A proximidade física e emocional é real hoje, mas o desalinhamento sobre o futuro é um ponto que merece conversa antes de avançar mais.",
  comunicacao_baixa_seguranca_baixa:
    "A dificuldade de conversar sobre o que incomoda parece alimentar a insegurança — e vice-versa.",
};

function scoreBand(score: number): "baixo" | "medio" | "alto" {
  if (score >= 70) return "alto";
  if (score >= 45) return "medio";
  return "baixo";
}

const DIMENSION_EXPLANATION: Record<DimensionKey, Record<"baixo" | "medio" | "alto", string>> = {
  reciprocity: {
    alto: "há sinais consistentes de que o esforço é bem dividido entre vocês.",
    medio: "a troca existe, mas nem sempre parece equilibrada.",
    baixo: "há sinais de que você entrega mais do que sente que recebe.",
  },
  communication: {
    alto: "conversas difíceis tendem a terminar em entendimento, não em desgaste.",
    medio: "vocês conversam, mas nem sempre chegam a uma resolução real.",
    baixo: "há sinais de dificuldade em resolver o que incomoda através da conversa.",
  },
  security: {
    alto: "você parece confiar no lugar que ocupa nessa relação.",
    medio: "existe confiança, mas com espaço para dúvida em alguns momentos.",
    baixo: "há sinais de insegurança recorrente sobre o que essa relação é hoje.",
  },
  connection: {
    alto: "você sente que pode ser você mesma e que existe proximidade real.",
    medio: "a conexão existe, mas com oscilações perceptíveis.",
    baixo: "há sinais de distanciamento emocional no dia a dia.",
  },
  intimacy: {
    alto: "o carinho e a proximidade aparecem na frequência que você gostaria.",
    medio: "existe intimidade, mas aquém do que você gostaria.",
    baixo: "há sinais de que a intimidade diminuiu ou nunca se estabeleceu como você esperava.",
  },
  future_alignment: {
    alto: "vocês parecem caminhar na mesma direção quanto ao futuro.",
    medio: "há alinhamento parcial sobre o que vocês constroem daqui pra frente.",
    baixo: "há sinais de desalinhamento sobre para onde essa relação está indo.",
  },
};

export function explainDimension(dimension: DimensionKey, score: number): string {
  return `${DIMENSION_LABELS[dimension]}: ${DIMENSION_EXPLANATION[dimension][scoreBand(score)]}`;
}

export function selectNextMoves(profileKey: ProfileKey, attention: DimensionKey[]): NextMove[] {
  const base = PROFILE_CONTENT[profileKey].baseMoves;
  if (attention.length === 0) return base;

  // Personaliza a observação com a dimensão de maior atenção detectada.
  const [firstAttention] = attention;
  const personalizedObservation: NextMove = {
    type: "observacao",
    text: `Observe especificamente os momentos ligados a ${DIMENSION_LABELS[firstAttention].toLowerCase()} — é onde seus dados mostram o sinal mais forte de atenção.`,
  };

  return [personalizedObservation, base[1], base[2]];
}

export function buildCombinationInsights(combinations: CombinationKey[]): string[] {
  return combinations.map((key) => COMBINATION_TEXTS[key]);
}

export function buildPreviewTeaser(
  scores: DimensionScores,
  strengths: DimensionKey[],
  attention: DimensionKey[],
): string {
  const strong = strengths[0];
  const weak = attention[0];
  if (!strong || !weak) {
    return "Analisamos suas respostas e encontramos um padrão real na sua relação. Seu perfil completo está pronto.";
  }
  return `Seu nível de ${DIMENSION_LABELS[strong].toLowerCase()} aparece acima do seu nível de ${DIMENSION_LABELS[weak].toLowerCase()} — e encontramos um padrão que merece atenção. Seu perfil completo está pronto.`;
}

/** Categoria ampla usada apenas no preview gratuito — nunca o perfil completo. */
const PREVIEW_CATEGORY: Record<ProfileKey, string> = {
  amor_reciproco: "um padrão com boa base de troca",
  amor_intenso: "um padrão de conexão intensa, com oscilações",
  amor_em_desequilibrio: "um padrão com sinais de desequilíbrio na troca",
  amor_distante: "um padrão com sinais de distanciamento",
  amor_preso_em_ciclo: "um padrão de conflito que se repete",
  amor_em_construcao: "um padrão ainda em formação",
  amor_que_pede_clareza: "um padrão com sinais pouco definidos",
};

export function previewCategory(profileKey: ProfileKey): string {
  return PREVIEW_CATEGORY[profileKey];
}

export type FullResult = {
  profile_key: ProfileKey;
  profile_label: string;
  headline: string;
  scores: DimensionScores;
  dimension_explanations: string[];
  self_insight: string;
  partner_perception: string;
  pattern: string;
  strengths: DimensionKey[];
  attention: DimensionKey[];
  combination_insights: string[];
  central_question: string;
  next_moves: NextMove[];
  disclaimer: string;
};

const DISCLAIMER =
  "Conteúdo de autoconhecimento; não substitui terapia, aconselhamento profissional ou avaliação de segurança.";

/**
 * Camada 5 — monta o conteúdo completo do resultado pago (seção 7 da
 * especificação) a partir do que a camada de scoring calculou. Determinístico
 * e sem IA, por design (Recomendação técnica, seção 6.3).
 */
export function buildFullResult(result: ScoringResult): FullResult {
  const content = PROFILE_CONTENT[result.profile_key];

  return {
    profile_key: result.profile_key,
    profile_label: PROFILE_LABELS[result.profile_key],
    headline: content.headline,
    scores: result.scores,
    dimension_explanations: DIMENSIONS.map((d) => explainDimension(d, result.scores[d])),
    self_insight: content.selfInsight,
    partner_perception: content.partnerPerception,
    pattern: content.pattern,
    strengths: result.strengths,
    attention: result.attention,
    combination_insights: buildCombinationInsights(result.combinations),
    central_question: content.centralQuestion,
    next_moves: selectNextMoves(result.profile_key, result.attention),
    disclaimer: DISCLAIMER,
  };
}

export { PROFILE_LABELS };
