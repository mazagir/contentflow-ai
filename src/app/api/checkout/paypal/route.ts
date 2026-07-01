import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PAYPAL_API = "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { plan = "starter" } = await request.json();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessToken = await getPayPalAccessToken();

    const amount = plan === "pro" ? "29.00" : "9.00";

    const response = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value: amount },
            description: `ContentFlow AI — Plan ${plan}`,
            custom_id: `${user.id}:${plan}`,
          },
        ],
        application_context: {
          return_url: `${appUrl}/?checkout=paypal_success`,
          cancel_url: `${appUrl}/?checkout=cancel`,
        },
      }),
    });

    const order = await response.json();
    const approveLink = order.links?.find(
      (link: { rel: string }) => link.rel === "approve"
    );

    await supabase
      .from("profiles")
      .update({ payment_method: "paypal" })
      .eq("id", user.id);

    return NextResponse.json({ url: approveLink?.href, orderId: order.id });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    return NextResponse.json(
      { error: "Error al crear orden de PayPal." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_API}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const capture = await response.json();
    const status = capture.status;

    if (status === "COMPLETED") {
      const customId =
        capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id ||
        capture.purchase_units?.[0]?.custom_id;

      if (customId) {
        const [userId, plan] = customId.split(":");
        if (userId && plan) {
          const { createClient } = await import("@/lib/supabase/server");
          const supabase = await createClient();
          await supabase
            .from("profiles")
            .update({
              plan,
              payment_method: "paypal",
              credits: plan === "free" ? 5 : 9999,
            })
            .eq("id", userId);
        }
      }
    }

    return NextResponse.json(capture);
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: "Error al capturar pago de PayPal." },
      { status: 500 }
    );
  }
}
