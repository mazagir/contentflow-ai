import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/deepseek";
import {
  buildSystemPrompt,
  SIN_CREDITOS,
  type ContentType,
  type GenerateRequest,
  type PaymentMethod,
  type Plan,
  type EngagementLever,
} from "@/lib/prompt";
import { createClient } from "@/lib/supabase/server";
import { canGenerate, hasActiveSubscription, type UserProfile } from "@/lib/users";

const VALID_CONTENT_TYPES: ContentType[] = [
  "caption",
  "email",
  "hilo",
  "articulo",
];

const VALID_ENGAGEMENT_LEVERS: EngagementLever[] = [
  "curiosidad",
  "controversia",
  "identificacion",
  "autoridad",
  "urgencia",
];

function isValidContentType(value: string): value is ContentType {
  return VALID_CONTENT_TYPES.includes(value as ContentType);
}

function isValidEngagementLever(value: string): value is EngagementLever {
  return VALID_ENGAGEMENT_LEVERS.includes(value as EngagementLever);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesión para generar contenido." },
        { status: 401 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, plan, credits, payment_method")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "No se encontró el perfil del usuario." },
        { status: 404 }
      );
    }

    const userProfile: UserProfile = {
      id: profile.id,
      plan: profile.plan as Plan,
      credits: profile.credits,
      payment_method: profile.payment_method as PaymentMethod,
    };

    const body = (await request.json()) as GenerateRequest;
    const { niche, contentType, context, tone, engagementLever } = body;

    if (!niche?.trim() || !context?.trim()) {
      return NextResponse.json(
        { error: "El nicho y la descripción del producto son obligatorios." },
        { status: 400 }
      );
    }

    if (!isValidContentType(contentType)) {
      return NextResponse.json(
        { error: "Tipo de contenido no válido." },
        { status: 400 }
      );
    }

    const validatedEngagementLever = engagementLever && isValidEngagementLever(engagementLever)
      ? engagementLever
      : "curiosidad";

    if (!canGenerate(userProfile)) {
      return NextResponse.json({
        code: SIN_CREDITOS,
        paymentMethod: userProfile.payment_method,
        plan: userProfile.plan,
        credits: userProfile.credits,
      });
    }

    const systemPrompt = buildSystemPrompt({
      niche: niche.trim(),
      contentType,
      context: context.trim(),
      tone: tone?.trim() || "profesional pero humano",
      plan: userProfile.plan,
      credits: userProfile.credits,
      paymentMethod: userProfile.payment_method,
      engagementLever: validatedEngagementLever,
    });

    const content = await generateContent(systemPrompt);

    if (!content || content === SIN_CREDITOS) {
      return NextResponse.json({
        code: SIN_CREDITOS,
        paymentMethod: userProfile.payment_method,
        plan: userProfile.plan,
        credits: userProfile.credits,
      });
    }

    if (userProfile.plan === "free" && !hasActiveSubscription(userProfile.plan)) {
      const { error: deductError } = await supabase
        .from("profiles")
        .update({ credits: userProfile.credits - 1 })
        .eq("id", user.id)
        .gt("credits", 0);

      if (deductError) {
        console.error("Error deducting credits:", deductError);
      }
    }

    await supabase.from("generations").insert({
      user_id: user.id,
      niche: niche.trim(),
      content_type: contentType,
      context: context.trim(),
      tone: tone?.trim() || null,
      engagement_lever: validatedEngagementLever,
    });

    return NextResponse.json({
      content,
      credits:
        userProfile.plan === "free"
          ? userProfile.credits - 1
          : userProfile.credits,
      plan: userProfile.plan,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      {
        error:
          "Error al generar el contenido. Revisa tu configuración e inténtalo de nuevo.",
      },
      { status: 500 }
    );
  }
}
