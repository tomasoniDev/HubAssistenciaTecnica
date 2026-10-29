import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { createSupabaseAuthClient, isSupabaseServerConfigured } from "@/lib/server-supabase";
import { getAuthorizedUserByEmail, isCorporateEmail } from "@/lib/server-auth";
import { clientIp, consume } from "@/lib/rate-limit";

const CODE_REQUEST_LIMIT_BY_EMAIL = { limit: 6, windowMs: 10 * 60 * 1000 };
const CODE_REQUEST_LIMIT_BY_IP = { limit: 20, windowMs: 10 * 60 * 1000 };

type RequestCodePayload = {
  email?: string;
};

type OtpRequestError = {
  code?: string;
  message?: string;
  status?: number;
};

function otpErrorResponse(error: OtpRequestError) {
  const detail = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();

  console.error("Supabase OTP request failed", {
    code: error.code,
    message: error.message,
    status: error.status
  });

  if (error.status === 429 || detail.includes("rate limit") || detail.includes("too many requests")) {
    return NextResponse.json(
      { error: "Limite temporário de envio atingido. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  if (detail.includes("smtp") || detail.includes("email provider") || detail.includes("send email")) {
    return NextResponse.json(
      { error: "O provedor de e-mail não conseguiu enviar o código de acesso. Tente novamente mais tarde." },
      { status: 502 }
    );
  }

  return NextResponse.json({ error: "Não foi possível enviar o código de acesso." }, { status: 400 });
}

export async function POST(request: Request) {
  if (isDemoMode) return NextResponse.json({ ok: true });

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: "Configuração server-side do Supabase ausente." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as RequestCodePayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";

  if (!isCorporateEmail(email)) {
    return NextResponse.json({ error: "Use um e-mail corporativo da Tomasoni." }, { status: 403 });
  }

  const authorizedUser = await getAuthorizedUserByEmail(email);
  if (!authorizedUser) {
    return NextResponse.json({ error: "E-mail não cadastrado para acesso ao sistema." }, { status: 403 });
  }

  const allowed = consume(`request-email:${email}`, CODE_REQUEST_LIMIT_BY_EMAIL)
    && consume(`request-ip:${clientIp(request)}`, CODE_REQUEST_LIMIT_BY_IP);
  if (!allowed) {
    return NextResponse.json(
      { error: "Limite temporário de envio atingido. Aguarde alguns minutos e tente novamente." },
      { status: 429 }
    );
  }

  const supabase = createSupabaseAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Only emails already approved above can create their Auth record.
      shouldCreateUser: true
    }
  });

  if (error) {
    return otpErrorResponse(error);
  }

  return NextResponse.json({ ok: true });
}
