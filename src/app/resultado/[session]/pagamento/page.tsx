import { Card } from "@/components/Card";

// PIX (QR Code + copia-e-cola) via Mercado Pago Orders API — POST
// /api/payments/create e GET /api/payment-status/:session (polling ou
// Supabase Realtime). Implementado no Commit 6.
export default async function PagamentoPage({
  params,
}: PageProps<"/resultado/[session]/pagamento">) {
  const { session } = await params;

  return (
    <main className="flex flex-1 flex-col items-center bg-primary-light px-6 py-10">
      <Card className="w-full max-w-md text-center">
        <p className="text-sm text-muted">Sessão: {session}</p>
        <p className="mt-2 font-semibold text-primary">
          Pagamento via PIX — R$ 37,90
        </p>
        <p className="mt-2 text-sm text-muted">
          Abra seu banco, pague e volte para esta tela. A liberação é
          automática após a confirmação.
        </p>
      </Card>
    </main>
  );
}
