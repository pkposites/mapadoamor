import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

// Pré-resultado / paywall — GET /api/preview/:session.
// Implementado no Commit 5 (preview e resultado mockado).
export default async function PreviewPage({
  params,
}: PageProps<"/resultado/[session]/preview">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col bg-primary-light px-6 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <Card>
          <p className="text-sm text-muted">Sessão: {session}</p>
          <p className="mt-2 text-foreground">
            Analisamos suas respostas. Seu perfil completo está pronto.
          </p>
        </Card>
        <Button href={`/resultado/${session}/pagamento`} className="w-full">
          Desbloquear meu Mapa do Amor — R$ 37,90
        </Button>
      </div>
    </main>
  );
}
