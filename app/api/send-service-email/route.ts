import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { isDemoMode } from "@/lib/demo";
import { authErrorResponse, canEmitReports, requireAuthorizedSession } from "@/lib/server-auth";
import { uploadServiceReportToSharePoint } from "@/lib/sharepoint";
import { createSupabaseAdminClient } from "@/lib/server-supabase";
import { consume } from "@/lib/rate-limit";
import { EMAIL_LIMITS, clampText, decodePdfBase64, safeAttachmentName, sanitizeEmailHtml } from "@/lib/email-safety";

const EMAILS_PER_USER_PER_HOUR = { limit: 40, windowMs: 60 * 60 * 1000 };

type SendEmailPayload = {
  to?: string[];
  bcc?: string[];
  subject?: string;
  text?: string;
  html?: string;
  filename?: string;
  pdfBase64?: string;
  machineCode?: string;
};

type SharePointUploadResult = Awaited<ReturnType<typeof uploadServiceReportToSharePoint>> | {
  skipped: false;
  error: string;
};

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromEmail = process.env.SMTP_FROM ?? (smtpUser ? `Hub Tomasoni <${smtpUser}>` : undefined);

function cleanRecipients(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((email) => String(email).trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .filter((email) => {
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });
}

function smtpConfigurationError() {
  if (!smtpHost || !smtpUser || !smtpPass || !fromEmail) {
    return "Configuração SMTP incompleta na Vercel. Verifique SMTP_HOST, SMTP_USER, SMTP_PASS e SMTP_FROM.";
  }

  if (!Number.isFinite(smtpPort)) {
    return "SMTP_PORT inválida na Vercel.";
  }

  return "";
}

export async function POST(request: Request) {
  try {
    const session = await requireAuthorizedSession();
    if (!canEmitReports(session.user.role)) {
      return NextResponse.json({ error: "Usuário sem permissão para enviar relatórios." }, { status: 403 });
    }

    if (isDemoMode) {
      return NextResponse.json({ error: "Modo demonstração: e-mails não são enviados." }, { status: 403 });
    }

    const configError = smtpConfigurationError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    if (!consume(`email-user:${session.userId}`, EMAILS_PER_USER_PER_HOUR)) {
      return NextResponse.json({ error: "Limite de envios por hora atingido. Aguarde e tente novamente." }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as SendEmailPayload | null;
    if (!body) {
      return NextResponse.json({ error: "Dados do relatório incompletos." }, { status: 400 });
    }

    const to = cleanRecipients(body.to);
    const bcc = cleanRecipients(body.bcc);
    if (to.length > EMAIL_LIMITS.maxTo || bcc.length > EMAIL_LIMITS.maxBcc) {
      return NextResponse.json({ error: "Quantidade de destinatários acima do permitido." }, { status: 400 });
    }

    if (!to.length && !bcc.length) {
      return NextResponse.json({ error: "Nenhum e-mail válido informado para envio." }, { status: 400 });
    }

    if (!body.pdfBase64 || !body.filename || !body.subject) {
      return NextResponse.json({ error: "Dados do relatório incompletos." }, { status: 400 });
    }

    const pdfBuffer = decodePdfBase64(body.pdfBase64);
    if (!pdfBuffer) {
      return NextResponse.json({ error: "O anexo não é um PDF válido ou excede o tamanho permitido." }, { status: 400 });
    }

    const filename = safeAttachmentName(body.filename);
    const subject = clampText(body.subject, EMAIL_LIMITS.maxSubject).replace(/[\r\n]+/g, " ").trim();
    const textBody = clampText(body.text, EMAIL_LIMITS.maxText);
    const htmlBody = sanitizeEmailHtml(clampText(body.html, EMAIL_LIMITS.maxHtml));

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      requireTLS: !smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      tls: {
        minVersion: "TLSv1.2"
      }
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      bcc,
      subject,
      text: textBody || "Mensagem automática. Não responda este e-mail.\n\nO relatório de atendimento segue em anexo.",
      html: htmlBody || "<p>Mensagem automática. Não responda este e-mail.</p><p>O relatório de atendimento segue em anexo.</p>",
      attachments: [
        {
          filename,
          content: pdfBuffer,
          contentType: "application/pdf"
        }
      ]
    });

    let sharePoint: SharePointUploadResult | null = null;
    try {
      sharePoint = await uploadServiceReportToSharePoint({
        machineCode: body.machineCode,
        filename: body.filename,
        pdfBase64: body.pdfBase64
      });
    } catch (sharePointError) {
      sharePoint = {
        skipped: false,
        error: sharePointError instanceof Error ? sharePointError.message : "Falha ao salvar PDF no SharePoint."
      };
    }

    try {
      await createSupabaseAdminClient().from("app_audit_logs").insert({
        action: "email.report_sent",
        entity: "service_records",
        entity_label: filename,
        user_id: session.userId,
        user_email: session.email,
        user_name: session.user.name,
        user_role: session.user.role,
        details: { to, bcc, subject, machine_code: body.machineCode ?? null }
      });
    } catch {
      // A auditoria não deve impedir a resposta de um envio já concluído.
    }

    return NextResponse.json({ id: info.messageId ?? null, accepted: info.accepted ?? [], sharePoint });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Não foi possível enviar o e-mail via SMTP. Detalhe: ${error.message}` },
        { status: 502 }
      );
    }

    return authErrorResponse(error);
  }
}
