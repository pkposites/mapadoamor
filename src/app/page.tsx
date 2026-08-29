import { Card } from "@/components/Card";
import { StartQuizButton } from "@/components/StartQuizButton";
import { TrackOnMount } from "@/components/TrackOnMount";

export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col items-center bg-primary-light">
      <TrackOnMount event="ViewLanding" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-8 px-6 py-16 text-center">
        <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          Mapa do Amor
        </span>

        <h1 className="text-3xl font-bold leading-tight text-foreground">
          Descubra o que suas respostas revelam sobre o momento atual da sua
          relação
        </h1>

        <p className="text-muted">
          Um quiz de 3 a 5 minutos que cruza reciprocidade, comunicação,
          segurança, conexão, intimidade e futuro — e entrega um mapa
          personalizado com pontos fortes, pontos de atenção e próximos
          movimentos práticos.
        </p>

        <Card className="w-full text-left">
          <p className="text-sm font-semibold text-primary">
            Baseado exclusivamente nas suas respostas
          </p>
          <p className="mt-1 text-sm text-muted">
            Nada de diagnóstico do parceiro. Clareza sobre o padrão atual da
            relação e o que fazer a seguir.
          </p>
        </Card>

        <StartQuizButton className="w-full" />

        <p className="text-xs text-muted">
          Resultado completo por R$ 37,90 via PIX. Sem cadastro, sem
          assinatura.
        </p>
      </div>
    </main>
  );
}
