import { describe, expect, it } from "vitest";
import { decodePdfBase64, safeAttachmentName, sanitizeEmailHtml } from "@/lib/email-safety";

// HTML no formato real gerado pelo app para o e-mail do relatório
const TEMPLATE = `<p>Relatório de atendimento técnico.</p><p><strong>Equipamento:</strong> CLP<br/><strong>Tipo:</strong> Visita técnica</p><p style="margin-top: 28px;">Mensagem automática. Não responda este e-mail.</p><p>O relatório segue em anexo.</p>`;

describe("sanitizeEmailHtml", () => {
  it("mantém o e-mail normal do relatório sem alterações visíveis", () => {
    expect(sanitizeEmailHtml(TEMPLATE)).toBe(TEMPLATE);
  });

  it("remove links, imagens e scripts", () => {
    const dirty = `<p>Olá</p><a href="https://evil.com">clique</a><img src="https://evil.com/x.png"><script>alert(1)</script>`;
    const clean = sanitizeEmailHtml(dirty);
    expect(clean).not.toMatch(/<a|<img|<script|href|alert/i);
    expect(clean).toContain("<p>Olá</p>");
    expect(clean).toContain("clique");
  });

  it("remove atributos perigosos e estilos arbitrários", () => {
    const clean = sanitizeEmailHtml(`<p onclick="x()" style="background:url(http://evil)">oi</p><strong onmouseover="y()">b</strong>`);
    expect(clean).toBe("<p>oi</p><strong>b</strong>");
  });

  it("remove formulários e iframes inteiros", () => {
    expect(sanitizeEmailHtml(`<form action="x"><input name="senha"></form><iframe src="x"></iframe>ok`)).toBe("ok");
  });
});

describe("safeAttachmentName", () => {
  it("mantém o nome normal com acentos", () => {
    expect(safeAttachmentName("REL-0001-T-665 1001.pdf")).toBe("REL-0001-T-665 1001.pdf");
    expect(safeAttachmentName("Relatório de Atendimento.pdf")).toBe("Relatório de Atendimento.pdf");
  });

  it("neutraliza caminhos e caracteres especiais", () => {
    const name = safeAttachmentName("../../etc/passwd");
    expect(name).not.toMatch(/[\\/]/);
    expect(name.endsWith(".pdf")).toBe(true);
    expect(safeAttachmentName('a<b>c:"d"|e?.pdf')).not.toMatch(/[<>:"|?]/);
  });

  it("usa um nome padrão quando vem vazio", () => {
    expect(safeAttachmentName("")).toBe("relatorio.pdf");
  });
});

describe("decodePdfBase64", () => {
  const pdf = Buffer.from("%PDF-1.4\nconteudo", "latin1").toString("base64");

  it("aceita um PDF válido", () => {
    expect(decodePdfBase64(pdf)?.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("recusa conteúdo que não é PDF", () => {
    expect(decodePdfBase64(Buffer.from("MZ executavel").toString("base64"))).toBeNull();
    expect(decodePdfBase64("<html>")).toBeNull();
    expect(decodePdfBase64("")).toBeNull();
    expect(decodePdfBase64(undefined)).toBeNull();
  });

  it("recusa arquivos acima do limite", () => {
    const big = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(2000)]).toString("base64");
    expect(decodePdfBase64(big, 1000)).toBeNull();
    expect(decodePdfBase64(big, 5000)).not.toBeNull();
  });
});
