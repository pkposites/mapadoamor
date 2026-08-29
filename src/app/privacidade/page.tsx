export default function PrivacidadePage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold text-primary">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: 29 de agosto de 2026.</p>

      <div className="mt-8 space-y-6 text-sm text-foreground">
        <section>
          <h2 className="font-semibold text-primary">1. O que é o Mapa do Amor</h2>
          <p className="mt-2 text-muted">
            O Mapa do Amor é um produto digital de autoconhecimento. Você responde a um
            questionário sobre a sua relação e recebe uma análise personalizada, calculada
            exclusivamente a partir das suas próprias respostas. Não é um serviço de
            diagnóstico clínico, psicológico ou jurídico.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">2. Quais dados coletamos</h2>
          <p className="mt-2 text-muted">Para funcionar, o produto coleta:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>
              <strong>Respostas do questionário</strong> — usadas para calcular seu resultado.
              São o dado mais sensível que tratamos: tratam de percepções sobre sua relação.
            </li>
            <li>
              <strong>Identificador de sessão</strong> — um código aleatório, gerado sem
              cadastro ou login, usado só para conectar suas respostas ao seu resultado e ao
              seu pagamento.
            </li>
            <li>
              <strong>Dados de origem do tráfego</strong> (UTMs, referência) — usados para
              entender qual anúncio ou conteúdo trouxe a visita, sem identificar você
              pessoalmente.
            </li>
            <li>
              <strong>Dados de pagamento</strong> — o PIX é processado pelo Mercado Pago. Não
              armazenamos dados de cartão. Podemos processar um e-mail associado ao
              pagamento, exigido pelo provedor de pagamento para emitir o PIX.
            </li>
            <li>
              <strong>Eventos de uso</strong> (ex.: início do quiz, conclusão, compra) — sem
              conteúdo das suas respostas, usados para melhorar o produto e medir a
              performance de anúncios.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-primary">3. O que NÃO fazemos com seus dados</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Não enviamos suas respostas, resultado ou índices para Meta, Google ou
              qualquer plataforma de anúncio — só o fato de eventos como &ldquo;iniciou o
              quiz&rdquo; ou &ldquo;comprou&rdquo; acontecerem, sem o conteúdo.</li>
            <li>Não vendemos seus dados a terceiros.</li>
            <li>Não pedimos nome completo, CPF ou telefone para acessar o produto.</li>
            <li>Não usamos suas respostas para treinar modelos de terceiros.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-semibold text-primary">4. Minimização e retenção</h2>
          <p className="mt-2 text-muted">
            Seguimos o princípio de minimização de dados: coletamos só o necessário para
            entregar o resultado e processar o pagamento. Seu resultado fica acessível pelo
            link da sua sessão. Você pode pedir a exclusão dos seus dados a qualquer momento
            pelo e-mail de suporte abaixo.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">5. Seus direitos (LGPD)</h2>
          <p className="mt-2 text-muted">
            Como titular dos dados, você pode solicitar a qualquer momento: confirmação de
            tratamento, acesso, correção, anonimização, exclusão, portabilidade e informação
            sobre com quem compartilhamos seus dados (provedor de pagamento e, de forma
            agregada e sem conteúdo, plataformas de analytics/anúncio). Para exercer esses
            direitos, escreva para{" "}
            <a href="mailto:suporte@mapadoamor.app" className="underline">
              suporte@mapadoamor.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">6. Conteúdo sensível e segurança</h2>
          <p className="mt-2 text-muted">
            Se suas respostas indicarem sinais de abuso, violência ou controle na relação, o
            Mapa do Amor não transforma isso em pontuação ou incentivo a confronto — o
            resultado inclui orientação para buscar apoio apropriado. Em caso de risco
            imediato, procure a Central de Atendimento à Mulher (180) ou os serviços de
            emergência da sua região.
          </p>
        </section>
      </div>
    </main>
  );
}
