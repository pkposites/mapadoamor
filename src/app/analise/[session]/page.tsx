import { Card } from "@/components/Card";

// Animação curta de conclusão + disparo do cálculo real (POST /api/calculate).
// Implementado junto com o scoring engine (Commit 4).
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
        <p className="mt-2 text-sm text-muted">Sessão: {session}</p>
      </Card>
    </main>
  );
}
