export const EMAIL_LIMITS = {
  maxTo: 25,
  maxBcc: 10,
  maxSubject: 200,
  maxText: 5_000,
  maxHtml: 20_000,
  maxPdfBytes: 6 * 1024 * 1024
};

const ALLOWED_TAGS = new Set(["p", "br", "strong", "b", "em", "i"]);
const SAFE_P_STYLE = /^margin-top:\s*\d{1,3}px;?$/i;

/**
 * Mantém só a formatação simples usada no e-mail do relatório (parágrafos,
 * quebras e negrito). Remove links, imagens, scripts, formulários e atributos.
 */
export function sanitizeEmailHtml(html: string) {
  const withoutBlocks = html.replace(/<(script|style|iframe|object|embed|form|svg)[\s\S]*?<\/\1\s*>/gi, "");

  return withoutBlocks.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (tag, rawName: string, rawAttributes: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    if (name === "br") return "<br/>";

    if (name === "p") {
      const style = /style\s*=\s*"([^"]*)"/i.exec(rawAttributes)?.[1]?.trim();
      if (style && SAFE_P_STYLE.test(style)) return `<p style="${style}">`;
    }
    return `<${name}>`;
  });
}

/** Nome de arquivo seguro para anexo: sem caminhos, sem caracteres especiais, sempre .pdf. */
export function safeAttachmentName(value: string, fallback = "relatorio.pdf") {
  const cleaned = String(value ?? "")
    .replace(/[\u0000-\u001f\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/-{2,}/g, "-")
    .replace(/^[.\s-]+/, "")
    .trim()
    .slice(0, 120);
  const base = cleaned || fallback;
  return base.toLowerCase().endsWith(".pdf") ? base : `${base}.pdf`;
}

/** Decodifica o base64 e confirma que é realmente um PDF dentro do limite de tamanho. */
export function decodePdfBase64(value: unknown, maxBytes = EMAIL_LIMITS.maxPdfBytes) {
  if (typeof value !== "string" || !value) return null;
  if (value.length > Math.ceil((maxBytes * 4) / 3) + 8) return null;
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return null;

  const buffer = Buffer.from(value, "base64");
  if (!buffer.length || buffer.length > maxBytes) return null;
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return null;
  return buffer;
}

export function clampText(value: unknown, max: number) {
  return String(value ?? "").slice(0, max);
}
