import { Card } from "@/components/Card";

// Motor de perguntas — implementado no Commit 3 (banco de perguntas +
// interface do quiz), consumindo POST /api/session e POST /api/answers.
export default async function QuizPage({
  params,
}: PageProps<"/quiz/[session]">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col bg-primary-light px-6 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-white">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
        <Card>
          <p className="text-sm text-muted">Sessão: {session}</p>
          <p className="mt-2 text-foreground">
            Motor de perguntas em construção — uma pergunta por tela, 24
            perguntas no total, ~3–5 minutos.
          </p>
        </Card>
      </div>
    </main>
  );
}
