import { Card } from "@/components/Card";
import { AnaliseRunner } from "@/components/AnaliseRunner";

// Animação curta de conclusão que dispara o cálculo real (POST
// /api/calculate) e, ao terminar, redireciona para o pré-resultado.
export default async function AnalisePage({
  params,
}: PageProps<"/analise/[session]">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Card className="w-full max-w-md">
        <p className="text-lg font-semibold text-primary">
          Analisando suas respostas…
        </p>
        <AnaliseRunner sessionId={session} />
      </Card>
    </main>
  );
}
