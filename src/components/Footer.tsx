import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-white/60 px-6 py-4 text-center text-xs text-muted">
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/privacidade" className="underline hover:text-primary">
          Política de Privacidade
        </Link>
        <Link href="/termos" className="underline hover:text-primary">
          Termos de Uso
        </Link>
        <a href="mailto:suporte@mapadoamor.app" className="underline hover:text-primary">
          Suporte
        </a>
      </nav>
    </footer>
  );
}
