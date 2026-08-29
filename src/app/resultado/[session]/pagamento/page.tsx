import { PixPayment } from "@/components/PixPayment";
import { TrackOnMount } from "@/components/TrackOnMount";

export default async function PagamentoPage({
  params,
}: PageProps<"/resultado/[session]/pagamento">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col items-center bg-primary-light px-6 py-10">
      <TrackOnMount
        event="InitiateCheckout"
        params={{ session_id: session, value: 37.9, currency: "BRL" }}
      />
      <PixPayment sessionId={session} />
    </main>
  );
}
