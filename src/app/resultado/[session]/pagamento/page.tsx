import { PixPayment } from "@/components/PixPayment";

export default async function PagamentoPage({
  params,
}: PageProps<"/resultado/[session]/pagamento">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col items-center bg-primary-light px-6 py-10">
      <PixPayment sessionId={session} />
    </main>
  );
}
