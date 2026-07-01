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

const CONTENT_TYPES = Object.entries(CONTENT_TYPE_LABELS) as [
  ContentType,
  string,
][];

const ENGAGEMENT_LEVERS = Object.entries(ENGAGEMENT_LEVER_LABELS) as [
  EngagementLever,
  string,
][];

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

export default function ContentForm({ onCreditsUpdate }: ContentFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [niche, setNiche] = useState(INITIAL_STATE.niche);
  const [contentType, setContentType] = useState<ContentType>(
    INITIAL_STATE.contentType
  );
  const [context, setContext] = useState(INITIAL_STATE.context);
  const [tone, setTone] = useState(INITIAL_STATE.tone);
  const [engagementLever, setEngagementLever] = useState<EngagementLever>(
    INITIAL_STATE.engagementLever
  );
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
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="niche"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Nicho
            </label>
            <input
              id="niche"
              type="text"
              required
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="Ej: coaching fitness, e-commerce moda, agencia SEO"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Tipo de contenido
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CONTENT_TYPES.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setContentType(value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition ${
                    contentType === value
                      ? "border-brand-500 bg-brand-500/10 text-brand-400"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Palanca de engagement
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ENGAGEMENT_LEVERS.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setEngagementLever(value)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                    engagementLever === value
                      ? "border-brand-500 bg-brand-500/10 text-brand-400"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="context"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Producto o servicio
            </label>
            <textarea
              id="context"
              required
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe qué vendes, a quién va dirigido y qué problema resuelve..."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label
              htmlFor="tone"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Tono de marca{" "}
              <span className="text-zinc-600">(opcional)</span>
            </label>
            <input
              id="tone"
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Ej: cercano y directo, autoridad sin arrogancia"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Generando..." : "Generar contenido"}
          </button>

          {result && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-white"
            >
              Nueva generación
            </button>
          )}
        </form>

        <div className="flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-300">Resultado</h2>
            {result && (
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-brand-500 hover:text-brand-400"
              >
                {copied ? "Copiado!" : "Copiar"}
              </button>
            )}
          </div>

          <div className="gradient-border min-h-[420px] flex-1 rounded-2xl p-5">
            {loading ? (
              <div className="flex h-full min-h-[380px] items-center justify-center">
                <div className="space-y-3 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                  <p className="text-sm text-zinc-500">
                    Creando tu contenido...
                  </p>
                </div>
              </div>
            ) : result ? (
              <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-strong:text-brand-300 prose-a:text-brand-400 prose-code:text-brand-300 prose-li:text-zinc-200">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex h-full min-h-[380px] items-center justify-center text-center">
                <p className="max-w-xs text-sm text-zinc-600">
                  Completa el formulario y pulsa generar. El contenido aparecerá
                  aquí listo para copiar.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <button
          type="button"
          onClick={toggleHistory}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-3 text-left transition hover:border-zinc-700"
        >
          <span className="text-sm font-medium text-zinc-300">
            Historial de generaciones
          </span>
          <span className="text-xs text-zinc-500">
            {showHistory ? "Ocultar" : "Mostrar"}
          </span>
        </button>

        {showHistory && (
          <div className="mt-4 space-y-3">
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : generations.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-600">
                Aún no tienes generaciones.
              </p>
            ) : (
              generations.map((gen) => (
                <details
                  key={gen.id}
                  className="group rounded-xl border border-zinc-800 bg-zinc-900/30"
                >
                  <summary className="cursor-pointer px-5 py-3 text-sm text-zinc-300 transition hover:text-zinc-100">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {gen.niche}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {new Date(gen.created_at).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-2 text-xs text-zinc-600">
                      <span>
                        {
                          CONTENT_TYPE_LABELS[
                            gen.content_type as ContentType
                          ]
                        }
                      </span>
                      {gen.engagement_lever && (
                        <>
                          <span>·</span>
                          <span className="capitalize">
                            {
                              ENGAGEMENT_LEVER_LABELS[
                                gen.engagement_lever as EngagementLever
                              ]
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </summary>
                  <div className="border-t border-zinc-800 px-5 py-4">
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
