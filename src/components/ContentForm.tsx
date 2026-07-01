"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  CONTENT_TYPE_LABELS,
  ENGAGEMENT_LEVER_LABELS,
  type ContentType,
  type EngagementLever,
  type PaymentMethod,
} from "@/lib/prompt";
import UpgradeModal from "@/components/UpgradeModal";

const CONTENT_TYPES = Object.entries(CONTENT_TYPE_LABELS) as [ContentType, string][];
const ENGAGEMENT_LEVERS = Object.entries(ENGAGEMENT_LEVER_LABELS) as [EngagementLever, string][];

const INITIAL_STATE = {
  niche: "",
  contentType: "caption" as ContentType,
  context: "",
  tone: "",
  engagementLever: "curiosidad" as EngagementLever,
  result: "",
  error: "",
};

interface Generation {
  id: string;
  niche: string;
  content_type: string;
  tone: string | null;
  engagement_lever: string | null;
  created_at: string;
  content: string | null;
}

interface ContentFormProps {
  onCreditsUpdate?: () => void;
}

const CONTENT_ICONS: Record<string, string> = {
  caption: "✍️",
  thread: "🧵",
  email: "📧",
  article: "📄",
  script: "🎬",
  story: "📖",
};

const LEVER_ICONS: Record<string, string> = {
  curiosidad: "🔍",
  controversia: "⚡",
  identificacion: "🪞",
  autoridad: "👑",
  urgencia: "🔥",
};

export default function ContentForm({ onCreditsUpdate }: ContentFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [niche, setNiche] = useState(INITIAL_STATE.niche);
  const [contentType, setContentType] = useState<ContentType>(INITIAL_STATE.contentType);
  const [context, setContext] = useState(INITIAL_STATE.context);
  const [tone, setTone] = useState(INITIAL_STATE.tone);
  const [engagementLever, setEngagementLever] = useState<EngagementLever>(INITIAL_STATE.engagementLever);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("none");
  const [showHistory, setShowHistory] = useState(false);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthChecked(true);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    setCopied(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          contentType,
          context,
          tone: tone || undefined,
          engagementLever,
        }),
      });

      const data = await response.json();

      if (data.code === "SIN_CREDITOS") {
        setPaymentMethod(data.paymentMethod ?? "none");
        setShowUpgrade(true);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Error al generar contenido");
      }

      setResult(data.content);
      onCreditsUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setNiche(INITIAL_STATE.niche);
    setContentType(INITIAL_STATE.contentType);
    setContext(INITIAL_STATE.context);
    setTone(INITIAL_STATE.tone);
    setEngagementLever(INITIAL_STATE.engagementLever);
    setResult(INITIAL_STATE.result);
    setError(INITIAL_STATE.error);
    setCopied(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleHistory() {
    if (generations.length > 0) {
      setShowHistory(!showHistory);
      return;
    }

    setShowHistory(true);
    setHistoryLoading(true);

    try {
      const res = await fetch("/api/generations");
      const data = await res.json();
      if (Array.isArray(data)) setGenerations(data);
    } catch {
      /* ignore */
    } finally {
      setHistoryLoading(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      {showUpgrade && (
        <UpgradeModal
          paymentMethod={paymentMethod}
          onClose={() => setShowUpgrade(false)}
        />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
          <div className="glass-card p-5">
            <div className="space-y-5">
              <div>
                <label htmlFor="niche" className="mb-1.5 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Nicho
                </label>
                <input
                  id="niche"
                  type="text"
                  required
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Ej: coaching fitness, e-commerce moda, agencia SEO"
                  className="input-field"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tipo de contenido
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                  {CONTENT_TYPES.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setContentType(value)}
                      className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition-all duration-200 ${
                        contentType === value
                          ? "border-brand-500/50 bg-brand-500/10 text-brand-400 shadow-sm shadow-brand-500/20"
                          : "border-white/5 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                      }`}
                    >
                      <span className="text-base">{CONTENT_ICONS[value]}</span>
                      <span className="leading-tight text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Palanca de engagement
                </label>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-5">
                  {ENGAGEMENT_LEVERS.map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEngagementLever(value)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs transition-all duration-200 ${
                        engagementLever === value
                          ? "border-brand-500/50 bg-brand-500/10 text-brand-400 shadow-sm shadow-brand-500/20"
                          : "border-white/5 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                      }`}
                    >
                      <span>{LEVER_ICONS[value]}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="space-y-5">
              <div>
                <label htmlFor="context" className="mb-1.5 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Producto o servicio
                </label>
                <textarea
                  id="context"
                  required
                  rows={4}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Describe qué vendes, a quién va dirigido y qué problema resuelve..."
                  className="input-field resize-none"
                />
              </div>

              <div>
                <label htmlFor="tone" className="mb-1.5 block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Tono de marca{" "}
                  <span className="font-normal text-zinc-600">(opcional)</span>
                </label>
                <input
                  id="tone"
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Ej: cercano y directo, autoridad sin arrogancia"
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="animate-slide-up rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Generar contenido
              </span>
            )}
          </button>

          {result && (
            <button
              type="button"
              onClick={handleClear}
              className="btn-secondary animate-fade-in"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
                Nueva generación
              </span>
            </button>
          )}
        </form>

        <div className="flex flex-col animate-fade-in animate-delay-100">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Resultado
            </h2>
            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="animate-fade-in inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 transition-all hover:border-brand-500/30 hover:bg-brand-500/10 hover:text-brand-400"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Copiado
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                    Copiar
                  </>
                )}
              </button>
            )}
          </div>

          <div className="glass-card min-h-[420px] flex-1">
            {loading ? (
              <div className="flex h-full min-h-[380px] items-center justify-center p-5">
                <div className="space-y-4 text-center">
                  <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                    <div className="absolute inset-0 animate-spin rounded-full border-2 border-brand-500/30 border-t-brand-400" />
                    <div className="absolute inset-1 animate-spin rounded-full border-2 border-brand-400/20 border-t-brand-300" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
                    <span className="text-lg">✨</span>
                  </div>
                  <p className="text-sm text-zinc-500">Creando tu contenido...</p>
                </div>
              </div>
            ) : result ? (
              <div className="animate-fade-in-up p-5">
                <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-strong:text-brand-300 prose-a:text-brand-400 prose-code:text-brand-300 prose-li:text-zinc-200 prose-p:leading-relaxed prose-p:text-zinc-200">
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[380px] items-center justify-center p-5 text-center">
                <div className="max-w-xs">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/5">
                    <svg className="h-7 w-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                  </div>
                  <p className="text-sm text-zinc-600">
                    Completa el formulario y pulsa generar. El contenido aparecerá
                    aquí listo para copiar.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 animate-fade-in">
        <button
          type="button"
          onClick={toggleHistory}
          className="glass-card-hover flex w-full items-center justify-between gap-4 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] ring-1 ring-white/5">
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-zinc-300">
              Historial de generaciones
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs text-zinc-500 transition-transform duration-200 ${showHistory ? "rotate-180" : ""}`}>
            {showHistory ? "Ocultar" : "Mostrar"}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </button>

        {showHistory && (
          <div className="mt-4 animate-fade-in space-y-2">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : generations.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-600">
                Aún no tienes generaciones.
              </p>
            ) : (
              generations.map((gen) => (
                <details
                  key={gen.id}
                  className="group glass-card overflow-hidden transition-all duration-200 open:ring-1 open:ring-brand-500/10"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-300 capitalize truncate">
                          {gen.niche}
                        </span>
                        <span className="shrink-0 rounded-full border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium text-zinc-500">
                          {CONTENT_TYPE_LABELS[gen.content_type as ContentType]}
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600">
                        <span>
                          {new Date(gen.created_at).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {gen.engagement_lever && (
                          <>
                            <span>·</span>
                            <span className="capitalize">
                              {ENGAGEMENT_LEVER_LABELS[gen.engagement_lever as EngagementLever]}
                            </span>
                          </>
                        )}
                        {gen.tone && (
                          <>
                            <span>·</span>
                            <span className="text-zinc-600">{gen.tone}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-zinc-600 transition-transform duration-200 group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </summary>
                  <div className="border-t border-white/5 px-5 py-4">
                    {gen.content ? (
                      <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-strong:text-brand-300 prose-a:text-brand-400 prose-code:text-brand-300 text-sm leading-relaxed">
                        <ReactMarkdown>{gen.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600">
                        Contenido no disponible
                      </p>
                    )}
                  </div>
                </details>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );
}
