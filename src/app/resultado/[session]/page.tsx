import { Card } from "@/components/Card";
import { DIMENSION_LABELS, DIMENSIONS } from "@/lib/dimensions";

// Resultado completo — GET /api/result/:session, liberado apenas quando
// paid=true (confirmado via webhook/consulta ao provedor). Commit 7.
export default async function ResultadoPage({
  params,
}: PageProps<"/resultado/[session]">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col gap-6 bg-primary-light px-6 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Card>
          <p className="text-sm text-muted">Sessão: {session}</p>
          <p className="mt-2 text-foreground">
            Resultado completo liberado após confirmação do pagamento.
          </p>
        </Card>

        <Card>
          <p className="mb-3 font-semibold text-primary">Seu mapa</p>
          <ul className="space-y-2 text-sm text-muted">
            {DIMENSIONS.map((key) => (
              <li key={key} className="flex items-center justify-between">
                <span>{DIMENSION_LABELS[key]}</span>
                <span>—</span>
              </li>
            ))}
          </ul>
        </Card>

        <p className="text-xs text-muted">
          Conteúdo de autoconhecimento; não substitui terapia, aconselhamento
          profissional ou avaliação de segurança.
        </p>
      </div>
    </main>
  );
}
