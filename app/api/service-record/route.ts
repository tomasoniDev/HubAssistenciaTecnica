import { NextResponse } from "next/server";
import { authErrorResponse, requireAuthorizedSession } from "@/lib/server-auth";
import { createSupabaseAdminClient } from "@/lib/server-supabase";
import { demoServiceHeavy, isDemoMode } from "@/lib/demo";

// Anexos e assinatura de um atendimento (carregados sob demanda).
export async function GET(request: Request) {
  try {
    await requireAuthorizedSession();

    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) return NextResponse.json({ error: "Atendimento não informado." }, { status: 400 });

    if (isDemoMode) return NextResponse.json(demoServiceHeavy(id));

    const { data, error } = await createSupabaseAdminClient()
      .from("service_records")
      .select("id, attachments, customer_signature")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Falha ao carregar anexos do atendimento", { id, message: error.message });
      return NextResponse.json({ error: "Não foi possível carregar os anexos do atendimento." }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "Atendimento não encontrado." }, { status: 404 });

    return NextResponse.json(
      { attachments: data.attachments ?? null, customer_signature: data.customer_signature ?? null },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    return authErrorResponse(error);
  }
}
