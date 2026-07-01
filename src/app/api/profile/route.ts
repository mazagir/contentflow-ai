import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, credits, payment_method, stripe_customer_id")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    email: user.email,
    plan: profile?.plan ?? "free",
    credits: profile?.credits ?? 0,
    paymentMethod: profile?.payment_method ?? "none",
    stripeCustomerId: profile?.stripe_customer_id ?? null,
  });
}
