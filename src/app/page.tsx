import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <header className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-medium text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            DeepSeek · Supabase · Stripe · PayPal
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            ContentFlow{" "}
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              AI
            </span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-zinc-400">
            Captions, emails, hilos y artículos adaptados a tu nicho.
            Listos para publicar sin editar.
          </p>
        </header>

        <AppShell />

        <footer className="mt-16 border-t border-zinc-800/60 pt-8 text-center text-xs text-zinc-600">
          ContentFlow AI — Contenido de marketing en segundos
        </footer>
      </div>
    </main>
  );
}
