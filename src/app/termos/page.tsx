export default function TermosPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <h1 className="text-2xl font-bold text-primary">Termos de Uso</h1>
      <p className="mt-2 text-sm text-muted">Última atualização: 29 de agosto de 2026.</p>

      <div className="mt-8 space-y-6 text-sm text-foreground">
        <section>
          <h2 className="font-semibold text-primary">1. O que você está contratando</h2>
          <p className="mt-2 text-muted">
            O Mapa do Amor é um produto digital de autoconhecimento: um questionário
            estruturado seguido de uma análise personalizada, calculada a partir
            exclusivamente das suas respostas, por R$ 37,90 pagos via PIX. O acesso ao
            resultado completo é liberado automaticamente após a confirmação do pagamento.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">2. O que o Mapa do Amor não é</h2>
          <p className="mt-2 text-muted">O resultado é conteúdo de autoconhecimento e não constitui:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            <li>Diagnóstico psicológico, psiquiátrico ou clínico de qualquer tipo.</li>
            <li>Aconselhamento jurídico, terapêutico ou profissional.</li>
            <li>
              Avaliação sobre o parceiro — o resultado descreve apenas a sua percepção,
              baseada nas suas respostas, nunca um diagnóstico dele.
            </li>
            <li>Previsão do futuro da relação ou garantia de qualquer desfecho.</li>
          </ul>
          <p className="mt-2 text-muted">
            Se você está passando por uma situação de risco, abuso ou crise, o resultado não
            substitui apoio profissional ou os serviços de emergência da sua região.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">3. Pagamento e acesso</h2>
          <p className="mt-2 text-muted">
            O pagamento é processado via PIX pelo Mercado Pago. O acesso ao resultado
            completo é liberado automaticamente assim que o pagamento é confirmado pelo
            provedor — normalmente em segundos. O link do seu resultado fica associado à
            sessão do seu quiz; guarde-o para acessar novamente.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">4. Reembolso</h2>
          <p className="mt-2 text-muted">
            Por se tratar de conteúdo digital gerado e liberado imediatamente após a
            confirmação do pagamento, o reembolso pode ser solicitado em até 7 dias corridos
            após a compra, conforme o direito de arrependimento previsto no Código de Defesa
            do Consumidor para compras não presenciais, desde que o resultado completo ainda
            não tenha sido acessado. Para solicitar, escreva para{" "}
            <a href="mailto:suporte@mapadoamor.app" className="underline">
              suporte@mapadoamor.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">5. Uso aceitável</h2>
          <p className="mt-2 text-muted">
            O acesso ao resultado é pessoal. Você pode compartilhar seu próprio resultado se
            desejar, mas não deve usar o produto para gerar diagnósticos sobre terceiros sem
            o consentimento deles, nem tentar automatizar ou explorar o serviço fora do uso
            normal como usuária final.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">6. Alterações</h2>
          <p className="mt-2 text-muted">
            Podemos atualizar estes termos e a política de privacidade conforme o produto
            evolui. A data no topo desta página indica a versão vigente.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-primary">7. Contato</h2>
          <p className="mt-2 text-muted">
            Dúvidas, suporte ou solicitações sobre seus dados:{" "}
            <a href="mailto:suporte@mapadoamor.app" className="underline">
              suporte@mapadoamor.app
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
