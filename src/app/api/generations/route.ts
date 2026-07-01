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

  const { data: generations, error } = await supabase
    .from("generations")
    .select("id, niche, content_type, tone, engagement_lever, created_at, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching generations:", error);
    return NextResponse.json({ error: "Error al obtener historial" }, { status: 500 });
  }

  return NextResponse.json(generations);
}
