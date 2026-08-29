import { redirect } from "next/navigation";
import { Card } from "@/components/Card";
import { AnaliseRunner } from "@/components/AnaliseRunner";
import { createServiceClient } from "@/lib/supabase/server";

// Animação curta de conclusão que dispara o cálculo real (POST
// /api/calculate) e, ao terminar, redireciona para o pré-resultado.
export default async function AnalisePage({
  params,
}: PageProps<"/analise/[session]">) {
  const { session } = await params;

  const supabase = createServiceClient();
  const { data: quizSession } = await supabase
    .from("mda_quiz_sessions")
    .select("status")
    .eq("id", session)
    .maybeSingle();

  // Sessão já paga revisitando esta tela (ex.: botão voltar): pula direto
  // para o resultado em vez de recalcular à toa.
  if (quizSession?.status === "paid") redirect(`/resultado/${session}`);

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
