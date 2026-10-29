import { NextResponse } from "next/server";
import { DEMO_USER_ID, demoUser, isDemoMode } from "@/lib/demo";
import { createSupabaseAuthClient, isSupabaseServerConfigured } from "@/lib/server-supabase";
import { getAuthorizedUserByEmail, isCorporateEmail, setAppSession } from "@/lib/server-auth";
import { clientIp, isRateLimited, recordHit, resetRateLimit } from "@/lib/rate-limit";

const FAILED_CODE_LIMIT_BY_EMAIL = { limit: 5, windowMs: 15 * 60 * 1000 };
const FAILED_CODE_LIMIT_BY_IP = { limit: 20, windowMs: 15 * 60 * 1000 };

type VerifyCodePayload = {
  email?: string;
  code?: string;
};

export async function POST(request: Request) {
  if (isDemoMode) {
    await setAppSession({ userId: DEMO_USER_ID, email: demoUser.email });
    return NextResponse.json({
      session: { userId: DEMO_USER_ID, email: demoUser.email },
      user: demoUser
    });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: "Configuração server-side do Supabase ausente." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as VerifyCodePayload | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const code = body?.code?.trim() ?? "";

  if (!isCorporateEmail(email)) {
    return NextResponse.json({ error: "Use um e-mail corporativo da Tomasoni." }, { status: 403 });
  }

  if (!code) {
    return NextResponse.json({ error: "Informe o código recebido por e-mail." }, { status: 400 });
  }

  const authorizedUser = await getAuthorizedUserByEmail(email);
  if (!authorizedUser) {
    return NextResponse.json({ error: "E-mail não cadastrado para acesso ao sistema." }, { status: 403 });
  }

  const emailKey = `verify-email:${email}`;
  const ipKey = `verify-ip:${clientIp(request)}`;
  if (isRateLimited(emailKey, FAILED_CODE_LIMIT_BY_EMAIL) || isRateLimited(ipKey, FAILED_CODE_LIMIT_BY_IP)) {
    return NextResponse.json(
      { error: "Muitas tentativas incorretas. Aguarde alguns minutos e solicite um novo código." },
      { status: 429 }
    );
  }

  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email"
  });

  if (error || !data.user?.id || !data.user.email) {
    recordHit(emailKey, FAILED_CODE_LIMIT_BY_EMAIL);
    recordHit(ipKey, FAILED_CODE_LIMIT_BY_IP);
    return NextResponse.json({ error: "Código inválido ou expirado." }, { status: 401 });
  }

  resetRateLimit(emailKey);

  await setAppSession({
    userId: data.user.id,
    email: data.user.email
  });

  return NextResponse.json({
    session: {
      userId: data.user.id,
      email: data.user.email.toLowerCase()
    },
    user: authorizedUser
  });
}
