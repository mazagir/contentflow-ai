"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { PaymentMethod } from "@/lib/prompt";

interface UpgradeModalProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
}

const PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    price: "$9",
    period: "/mes",
    description: "Contenido ilimitado sin marca de agua",
    features: [
      "Créditos ilimitados",
      "Todos los tipos de contenido",
      "Todas las palancas de engagement",
      "Sin marca de agua",
    ],
    popular: false,
    color: "brand",
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: "$29",
    period: "/mes",
    description: "Todo lo de Starter + prioridad",
    features: [
      "Todo lo de Starter",
      "Prioridad en generación",
      "Soporte prioritario",
      "Acceso anticipado a funciones",
    ],
    popular: true,
    color: "brand",
  },
];

export default function UpgradeModal({ paymentMethod, onClose }: UpgradeModalProps) {
  const [method, setMethod] = useState<"stripe" | "paypal">(
    paymentMethod === "paypal" ? "paypal" : "stripe"
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(null);

  async function checkoutStripe(plan: "starter" | "pro") {
    setLoading(plan);
    setError("");

    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error con Stripe");
      setLoading(null);
    }
  }

  function handlePlanClick(plan: "starter" | "pro") {
    setError("");
    if (method === "stripe") {
      checkoutStripe(plan);
    } else {
      setSelectedPlan(plan);
    }
  }

  const paypalClientId =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
      : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl animate-scale-in">
        <div className="glass-card overflow-hidden p-6 sm:p-8">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.03] text-zinc-500 transition-all hover:border-white/10 hover:text-zinc-300"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 ring-1 ring-amber-500/20">
              <svg className="h-7 w-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              Sin créditos disponibles
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
              Has agotado tus créditos del plan gratuito. Elige un plan para seguir
              generando contenido ilimitado.
            </p>
          </div>

          {paymentMethod === "none" && (
            <div className="mb-6">
              <label className="mb-3 block text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                Método de pago
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setMethod("stripe"); setSelectedPlan(null); }}
                  className={`flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    method === "stripe"
                      ? "border-brand-500/50 bg-brand-500/10 text-brand-400 shadow-sm shadow-brand-500/20"
                      : "border-white/5 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.786-1.458 2.099-1.458 2.144 0 4.035.727 5.564 1.795l.827-3.041C17.146 3.141 14.987 2.4 12.719 2.4c-4.251 0-7.249 2.441-7.249 5.994 0 3.521 3.537 5.252 6.647 6.273 2.537.835 3.512 1.449 3.512 2.527 0 1.012-.916 1.729-2.364 1.729-2.278 0-4.634-.988-6.211-2.141l-.853 3.135c1.637 1.035 4.075 1.868 6.512 1.868 4.476 0 7.666-2.478 7.666-6.272-.001-3.671-3.416-5.333-6.959-6.414zM3.406 1.998L2.022 8.193c.324.114.775.222 1.266.222.646 0 1.058-.253 1.237-.833l.003-.013.652-2.57c.143-.566.066-.958-.539-.958H3.406z"/>
                  </svg>
                  Tarjeta (Stripe)
                </button>
                <button
                  type="button"
                  onClick={() => { setMethod("paypal"); setSelectedPlan(null); }}
                  className={`flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    method === "paypal"
                      ? "border-brand-500/50 bg-brand-500/10 text-brand-400 shadow-sm shadow-brand-500/20"
                      : "border-white/5 bg-white/[0.03] text-zinc-500 hover:border-white/10 hover:text-zinc-300"
                  }`}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                  </svg>
                  PayPal
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                type="button"
                disabled={!!loading}
                onClick={() => handlePlanClick(plan.id)}
                className={`group relative rounded-xl border p-5 text-left transition-all duration-200 ${
                  loading === plan.id ? "opacity-60" : ""
                } ${
                  method === "paypal" && selectedPlan === plan.id
                    ? "border-brand-500/50 bg-brand-500/10 shadow-sm shadow-brand-500/20"
                    : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -right-px -top-px rounded-bl-xl rounded-tr-xl bg-gradient-to-r from-brand-500 to-brand-400 px-3 py-1 text-[10px] font-semibold text-white shadow-sm">
                    Popular
                  </span>
                )}

                <div className="mb-3">
                  <span className={`text-sm font-semibold ${plan.popular ? "gradient-text" : "text-white"}`}>
                    {plan.name}
                  </span>
                  <div className="mt-1.5">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-zinc-400">
                      <svg className="h-3.5 w-3.5 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {loading === plan.id && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Redirigiendo a {method === "stripe" ? "Stripe" : "PayPal"}...
                  </div>
                )}
              </button>
            ))}
          </div>

          {method === "paypal" && selectedPlan && paypalClientId && (
            <div className="mt-6 animate-fade-in">
              <div className="glass-card p-4">
                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                  <PayPalButtons
                    style={{ layout: "vertical", color: "gold" }}
                    createOrder={async () => {
                      const res = await fetch("/api/checkout/paypal", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ plan: selectedPlan }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error);
                      return data.orderId;
                    }}
                    onApprove={async (data) => {
                      setError("");
                      const res = await fetch("/api/checkout/paypal", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderId: data.orderID }),
                      });
                      const capture = await res.json();
                      if (!res.ok) throw new Error(capture.error);
                      if (capture.status === "COMPLETED") {
                        window.location.href = "/?checkout=paypal_success";
                      } else {
                        throw new Error("El pago no se completó");
                      }
                    }}
                    onError={() => {
                      setError("Error al procesar el pago con PayPal");
                      setSelectedPlan(null);
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          )}

          {method === "paypal" && !paypalClientId && (
            <p className="mt-4 text-center text-xs text-zinc-600">
              PayPal no está configurado. Usa Stripe como método de pago.
            </p>
          )}

          {error && (
            <div className="mt-4 animate-slide-up rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
