import AppShell from "@/components/AppShell";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="fixed inset-0 overflow-hidden bg-grid opacity-40" />
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-0 h-96 w-96 animate-pulse-slow rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 animate-pulse-slow rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-64 w-64 animate-pulse-slow rounded-full bg-brand-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <header className="mb-10 text-center animate-fade-in">

          <h1 className="mb-4 animate-fade-in-up animate-delay-100 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            ContentFlow{" "}
            <span className="gradient-text">AI</span>
          </h1>
          <p className="mx-auto animate-fade-in-up animate-delay-200 max-w-xl text-lg leading-relaxed text-zinc-400">
            Captions, emails, hilos y artículos adaptados a tu nicho.
            <br />
            <span className="text-zinc-500">Listos para publicar sin editar.</span>
          </p>
        </header>

        <div className="animate-fade-in-up animate-delay-300">
          <AppShell />
        </div>

        <footer className="mt-16 border-t border-white/5 pt-8 text-center text-xs text-zinc-600">
          <span className="gradient-text font-medium">ContentFlow AI</span>
          {" — "}Contenido de marketing en segundos
        </footer>
      </div>
    </main>
  );
}
