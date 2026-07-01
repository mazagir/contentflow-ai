import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function planFromPriceId(priceId: string): "starter" | "pro" {
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "starter";
  return "starter";
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || "starter";
        const customerId = session.customer as string | undefined;

        if (userId) {
          await supabase
            .from("profiles")
            .update({
              plan,
              payment_method: "stripe",
              credits: plan === "free" ? 5 : 9999,
              ...(customerId && { stripe_customer_id: customerId }),
            })
            .eq("id", userId);
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (profile) {
          await supabase
            .from("profiles")
            .update({
              plan: "free",
              credits: 5,
              payment_method: "none",
            })
            .eq("id", profile.id);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const priceId = subscription.items.data[0]?.price?.id;

        if (priceId && (status === "active" || status === "trialing")) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          if (profile) {
            const plan = planFromPriceId(priceId);
            await supabase
              .from("profiles")
              .update({ plan, credits: 9999 })
              .eq("id", profile.id);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.error(
          `[Stripe] Pago fallido — customer: ${customerId}, monto: ${invoice.amount_due}`
        );
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        console.log(
          `[Stripe] Pago exitoso — customer: ${customerId}, monto: ${invoice.amount_paid}`
        );
        break;
      }
    }
  } catch (err) {
    console.error("[Stripe Webhook] Error:", err);
  }

  return NextResponse.json({ received: true });
}
