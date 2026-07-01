"use client";

import { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import type { PaymentMethod } from "@/lib/prompt";

interface UpgradeModalProps {
  paymentMethod: PaymentMethod;
  onClose: () => void;
}

export default function UpgradeModal({
  paymentMethod,
  onClose,
}: UpgradeModalProps) {
  const [method, setMethod] = useState<"stripe" | "paypal">(
    paymentMethod === "paypal" ? "paypal" : "stripe"
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"starter" | "pro" | null>(
    null
  );

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">
          Sin créditos disponibles
        </h3>
        <p className="mb-6 text-sm text-zinc-400">
          Has agotado tus créditos del plan gratuito. Elige un plan para seguir
          generando contenido ilimitado.
        </p>

        {paymentMethod === "none" && (
          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500">
              Método de pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMethod("stripe");
                  setSelectedPlan(null);
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  method === "stripe"
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                Tarjeta (Stripe)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMethod("paypal");
                  setSelectedPlan(null);
                }}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  method === "paypal"
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600"
                }`}
              >
                PayPal
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            disabled={!!loading}
            onClick={() => handlePlanClick("starter")}
            className={`w-full rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
              method === "paypal" && selectedPlan === "starter"
                ? "border-brand-500 bg-brand-500/15"
                : "border-brand-500/50 bg-brand-500/10 hover:bg-brand-500/20"
            }`}
          >
            <span className="block text-sm font-semibold text-brand-400">
              Starter — $9/mes
            </span>
            <span className="text-xs text-zinc-500">
              Contenido ilimitado sin marca de agua
            </span>
            {loading === "starter" && (
              <span className="mt-1 block text-xs text-zinc-400">
                Redirigiendo a Stripe...
              </span>
            )}
          </button>

          <button
            type="button"
            disabled={!!loading}
            onClick={() => handlePlanClick("pro")}
            className={`w-full rounded-xl border px-4 py-3 text-left transition disabled:opacity-50 ${
              method === "paypal" && selectedPlan === "pro"
                ? "border-brand-500 bg-brand-500/15"
                : "border-zinc-700 bg-zinc-800/50 hover:border-brand-500/50"
            }`}
          >
            <span className="block text-sm font-semibold text-white">
              Pro — $29/mes
            </span>
            <span className="text-xs text-zinc-500">
              Todo lo de Starter + prioridad
            </span>
            {loading === "pro" && (
              <span className="mt-1 block text-xs text-zinc-400">
                Redirigiendo a Stripe...
              </span>
            )}
          </button>
        </div>

        {method === "paypal" && selectedPlan && paypalClientId && (
          <div className="mt-6">
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
        )}

        {method === "paypal" && !paypalClientId && (
          <p className="mt-4 text-xs text-zinc-600">
            PayPal no está configurado. Usa Stripe como método de pago.
          </p>
        )}

        {method === "paypal" && selectedPlan && !paypalClientId && (
          <p className="mt-2 text-xs text-zinc-600">
            Configura NEXT_PUBLIC_PAYPAL_CLIENT_ID en tu .env para activar
            PayPal.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full text-sm text-zinc-500 hover:text-zinc-300"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
