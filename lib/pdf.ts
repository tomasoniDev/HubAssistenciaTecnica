import { jsPDF } from "jspdf";
import type { Machine, ServiceAttachment, ServiceRecord } from "./types";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 62;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BLUE = "#1268D8";
const DARK = "#111111";
const MUTED = "#566170";
const LINE = "#CAD6E6";
const SOFT_LINE = "#E6ECF5";
const CONTENT_BOTTOM = PAGE_HEIGHT - 78;
const TOMASONI_CONTACT_PHONE = "(41) 3667-2063";

function isAssemblyRole(role?: string | null) {
  return String(role ?? "").trim().toLowerCase().startsWith("montagem");
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonthYear(value?: string | null) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${month}/${year}`;
}

function reportCode(machine: Machine, record: ServiceRecord) {
  const [year, month, day] = record.service_date.split("-");
  const prefix = `RAT-${year.slice(2)}${month}${day}`;
  const sameDayRecords = [
    ...(machine.service_records?.filter((item) => item.service_date === record.service_date) ?? []),
    record
  ];
  const uniqueRecords = Array.from(new Map(sameDayRecords.map((item) => [item.id, item])).values());
  const sortedRecords = uniqueRecords.sort((a, b) => {
    const created = a.created_at.localeCompare(b.created_at);
    return created || a.id.localeCompare(b.id);
  });
  const index = Math.max(sortedRecords.findIndex((item) => item.id === record.id), 0) + 1;
  return `${prefix}-${String(index).padStart(2, "0")}`;
}

function valueOrDash(value?: string | null) {
  const normalized = String(value ?? "").trim();
  return normalized || "-";
}

function serviceDateTimeOrFallback(value: string | null | undefined, fallbackDate?: string | null) {
  const normalized = String(value ?? "").trim();
  if (normalized) return normalized;
  return formatDate(fallbackDate);
}

function displayMachineCode(machine: Machine) {
  return machine.code?.trim() || machine.model?.trim() || machine.client?.trim() || "maquina-sem-codigo";
}

function setText(doc: jsPDF, color = DARK, size = 9, weight: "normal" | "bold" = "normal") {
  doc.setTextColor(color);
  doc.setFont("helvetica", weight);
  doc.setFontSize(size);
}

function line(doc: jsPDF, x1: number, y1: number, x2: number, y2: number, color = LINE, width = 0.7) {
  doc.setDrawColor(color);
  doc.setLineWidth(width);
  doc.line(x1, y1, x2, y2);
}

function sectionTitle(doc: jsPDF, title: string, y: number) {
  setText(doc, BLUE, 10, "bold");
  doc.text(title.toUpperCase(), MARGIN, y);
  line(doc, MARGIN, y + 9, PAGE_WIDTH - MARGIN, y + 9, BLUE, 1.2);
}

function wrappedFieldRow(doc: jsPDF, fields: { label: string; value: string | null | undefined; x: number; width: number }[], y: number, gap = 31) {
  const lineHeight = 11.25;
  setText(doc, DARK, 9);
  const values = fields.map((field) => doc.splitTextToSize(valueOrDash(field.value), field.width) as string[]);
  const totalLines = Math.max(...values.map((value) => value.length));
  let offset = 0;

  while (offset < totalLines) {
    y = ensurePageSpace(doc, y, 34);
    const availableLines = Math.max(1, Math.floor((CONTENT_BOTTOM - y - 22) / lineHeight) + 1);
    const count = Math.min(totalLines - offset, availableLines);
    const bottom = y + 22 + (count - 1) * lineHeight;

    fields.forEach((field, index) => {
      setText(doc, MUTED, 7, "bold");
      doc.text(field.label.toUpperCase(), field.x, y);
      setText(doc, DARK, 9);
      const text = values[index].slice(offset, offset + count);
      if (text.length) doc.text(text, field.x, y + 16, { lineHeightFactor: 1.25 });
      line(doc, field.x, bottom, field.x + field.width, bottom, LINE, 0.55);
    });

    offset += count;
    y = bottom + gap;
  }

  return y;
}

function continuationHeader(doc: jsPDF) {
  setText(doc, BLUE, 10, "bold");
  doc.text("Relatório de Atendimento Técnico", MARGIN, 48);
  line(doc, MARGIN, 60, PAGE_WIDTH - MARGIN, 60, BLUE, 1);
}

function addContentPage(doc: jsPDF) {
  doc.addPage("a4", "portrait");
  continuationHeader(doc);
  return 88;
}

function ensurePageSpace(doc: jsPDF, y: number, height: number) {
  if (y + height <= CONTENT_BOTTOM) return y;
  return addContentPage(doc);
}

function flowTextSection(doc: jsPDF, title: string, value: string | null, y: number) {
  const lineHeight = 13.2;
  const paragraphGap = 7;
  const textX = MARGIN + 8;
  const textWidth = CONTENT_WIDTH - 18;
  y = ensurePageSpace(doc, y, 42);
  setText(doc, MUTED, 7, "bold");
  doc.text(title.toUpperCase(), MARGIN, y);
  line(doc, MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, SOFT_LINE, 0.5);
  y += 24;
  setText(doc, DARK, 8.8);
  const rawValue = valueOrDash(value);
  const paragraphs = rawValue === "-"
    ? ["-"]
    : rawValue
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map((paragraph) => paragraph.trimEnd())
        .filter((paragraph) => paragraph.trim());

  for (const [paragraphIndex, paragraph] of paragraphs.entries()) {
    const lines = doc.splitTextToSize(paragraph, textWidth);
    for (const [lineIndex, textLine] of lines.entries()) {
      y = ensurePageSpace(doc, y, lineHeight + 8);
      setText(doc, DARK, 8.8);
      drawJustifiedTextLine(doc, textLine, textX, y, textWidth, lineIndex < lines.length - 1);
      y += lineHeight;
    }

    if (paragraphIndex < paragraphs.length - 1) {
      y = ensurePageSpace(doc, y, paragraphGap + 8);
      y += paragraphGap;
    }
  }

  return y + 20;
}

function drawJustifiedTextLine(doc: jsPDF, text: string, x: number, y: number, width: number, justify: boolean) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!justify || words.length < 2) {
    doc.text(text, x, y);
    return;
  }

  const wordsWidth = words.reduce((total, word) => total + doc.getTextWidth(word), 0);
  const gap = (width - wordsWidth) / (words.length - 1);
  if (!Number.isFinite(gap) || gap < 1.8 || gap > 8) {
    doc.text(text, x, y);
    return;
  }

  let cursorX = x;
  for (const word of words) {
    doc.text(word, cursorX, y);
    cursorX += doc.getTextWidth(word) + gap;
  }
}

function imageToDataUrl(path: string) {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) {
        resolve(null);
        return;
      }
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => resolve(null);
    image.src = path;
  });
}

async function drawLogo(doc: jsPDF) {
  const logo = await imageToDataUrl("/tomasoni-logo-clean.png?v=20260827-transparent");
  if (logo) {
    const maxWidth = 170;
    const maxHeight = 52;
    const properties = doc.getImageProperties(logo);
    const ratio = Math.min(maxWidth / properties.width, maxHeight / properties.height);
    const logoWidth = properties.width * ratio;
    const logoHeight = properties.height * ratio;
    doc.addImage(logo, "PNG", MARGIN, 72 + (maxHeight - logoHeight) / 2, logoWidth, logoHeight);
    return;
  }

  setText(doc, BLUE, 28, "bold");
  doc.text("TOMASONI", MARGIN, 104);
}

async function drawHeader(doc: jsPDF, machine: Machine, record: ServiceRecord) {
  await drawLogo(doc);
  setText(doc, BLUE, 17, "bold");
  doc.text("Relatório de Atendimento Técnico", 258, 92);
  setText(doc, MUTED, 8);
  doc.text(`Nº: ${reportCode(machine, record)}`, 376, 114);
  doc.text(`Data: ${formatDate(record.service_date)}`, 459, 114);
  line(doc, MARGIN, 142, PAGE_WIDTH - MARGIN, 142, BLUE, 2);
  setText(doc, MUTED, 8);
  doc.text("Documento técnico gerado pelo sistema de relatórios Tomasoni", MARGIN, 162);
}

function drawMachineData(doc: jsPDF, machine: Machine) {
  sectionTitle(doc, "Dados da máquina", 203);
  const col = (CONTENT_WIDTH - 24) / 3;
  const y = wrappedFieldRow(doc, [
    { label: "Cliente", value: machine.client, x: MARGIN, width: col },
    { label: "Unidade / Cidade", value: machine.unit_city, x: MARGIN + col + 12, width: col },
    { label: "Modelo", value: machine.model, x: MARGIN + (col + 12) * 2, width: col }
  ], 234, 17);
  return wrappedFieldRow(doc, [
    { label: "Código", value: machine.code, x: MARGIN, width: col },
    { label: "Número de série", value: machine.serial, x: MARGIN + col + 12, width: col },
    { label: "Fabricação", value: formatMonthYear(machine.manufacture_month), x: MARGIN + (col + 12) * 2, width: col }
  ], y, 35);
}

function drawServiceData(doc: jsPDF, record: ServiceRecord, y: number) {
  y = ensurePageSpace(doc, y, 65);
  sectionTitle(doc, "Dados do atendimento", y);
  const col = (CONTENT_WIDTH - 24) / 3;
  y = wrappedFieldRow(doc, [
    { label: "Início", value: serviceDateTimeOrFallback(record.service_start, record.service_date), x: MARGIN, width: col },
    { label: "Fim", value: record.service_end, x: MARGIN + col + 12, width: col },
    { label: "Tipo de atendimento", value: record.service_type ?? "Acesso remoto", x: MARGIN + (col + 12) * 2, width: col }
  ], y + 31, 17);
  y = wrappedFieldRow(doc, [
    { label: "Equipamento", value: record.equipment, x: MARGIN, width: col },
    { label: "Motivo breve", value: record.issue_summary, x: MARGIN + col + 12, width: CONTENT_WIDTH - col - 12 }
  ], y);
  y = flowTextSection(doc, "Solicitação do cliente / problema relatado", record.request, y);
  y = flowTextSection(doc, "Diagnóstico", record.diagnosis, y);
  y = flowTextSection(doc, "Serviço realizado", record.service_done, y);
  y = flowTextSection(doc, "Observações", record.observations, y);
  return y;
}

function drawTechnicianData(doc: jsPDF, record: ServiceRecord, y: number) {
  const supportTechnicians = (record.support_technicians ?? []).filter((technician) => technician?.name?.trim());
  y = ensurePageSpace(doc, y, supportTechnicians.length ? 118 : 70);
  sectionTitle(doc, "Técnico responsável", y);
  const col = (CONTENT_WIDTH - 24) / 3;
  const responsibleEmail = isAssemblyRole(record.technician_role) ? "" : record.technician_email;
  y = wrappedFieldRow(doc, [
    { label: "Nome", value: record.technician_name, x: MARGIN, width: col },
    { label: "E-mail", value: responsibleEmail, x: MARGIN + col + 12, width: col },
    { label: "Contato Tomasoni", value: TOMASONI_CONTACT_PHONE, x: MARGIN + (col + 12) * 2, width: col }
  ], y + 31, 15);

  if (!supportTechnicians.length) return y;

  y += 10;
  y = ensurePageSpace(doc, y, 45);
  setText(doc, MUTED, 7, "bold");
  doc.text("DEMAIS TÉCNICOS PARTICIPANTES", MARGIN, y);
  line(doc, MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, SOFT_LINE, 0.5);
  y += 25;
  setText(doc, DARK, 8.8);
  supportTechnicians.forEach((technician) => {
    y = ensurePageSpace(doc, y, 20);
    const role = String(technician.role ?? "").trim();
    const email = isAssemblyRole(role) ? "" : String(technician.email ?? "").trim();
    const lineText = email ? `${technician.name} (${email})` : technician.name;
    setText(doc, DARK, 8.8);
    const lines = doc.splitTextToSize(lineText, CONTENT_WIDTH - 8) as string[];
    for (const textLine of lines) {
      y = ensurePageSpace(doc, y, 18);
      setText(doc, DARK, 8.8);
      doc.text(textLine, MARGIN + 8, y);
      y += 13.2;
    }
    y += 4.8;
  });
  return y + 8;
}

function imageFormat(dataUrl: string) {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

function attachmentCaption(attachment: ServiceAttachment, index: number) {
  const caption = String(attachment.caption ?? "").trim();
  return caption || `Imagem ${index + 1} - ${attachment.name}`;
}

function drawAttachmentImage(doc: jsPDF, attachment: ServiceAttachment, index: number, y: number, compact = false) {
  const maxImageWidth = CONTENT_WIDTH;
  const maxImageHeight = compact ? 245 : 330;
  let originalWidth = Number(attachment.width ?? 0);
  let originalHeight = Number(attachment.height ?? 0);
  if (!originalWidth || !originalHeight) {
    try {
      const properties = doc.getImageProperties(attachment.dataUrl) as { width?: number; height?: number };
      originalWidth = Number(properties.width ?? 0);
      originalHeight = Number(properties.height ?? 0);
    } catch {}
  }
  if (!originalWidth || !originalHeight) {
    originalWidth = maxImageWidth;
    originalHeight = 250;
  }
  const scale = Math.min(maxImageWidth / originalWidth, maxImageHeight / originalHeight);
  const imageWidth = originalWidth * scale;
  const imageHeight = originalHeight * scale;
  const imageX = MARGIN + (CONTENT_WIDTH - imageWidth) / 2;
  setText(doc, MUTED, 7, "bold");
  const captionLines = doc.splitTextToSize(attachmentCaption(attachment, index).toUpperCase(), CONTENT_WIDTH) as string[];
  const captionHeight = (captionLines.length - 1) * 9;
  const blockHeight = imageHeight + 42 + captionHeight;
  y = ensurePageSpace(doc, y, blockHeight);

  setText(doc, MUTED, 7, "bold");
  for (const captionLine of captionLines) {
    y = ensurePageSpace(doc, y, 18);
    setText(doc, MUTED, 7, "bold");
    doc.text(captionLine, MARGIN, y);
    y += 9;
  }
  y -= 9;
  line(doc, MARGIN, y + 8, PAGE_WIDTH - MARGIN, y + 8, SOFT_LINE, 0.5);
  y = ensurePageSpace(doc, y, imageHeight + 42);

  try {
    doc.addImage(attachment.dataUrl, imageFormat(attachment.dataUrl), imageX, y + 18, imageWidth, imageHeight, undefined, "MEDIUM");
  } catch {
    setText(doc, MUTED, 9);
    doc.text("Imagem não pôde ser renderizada no PDF.", MARGIN, y + 50);
  }

  return y + imageHeight + 42;
}

function drawAttachments(doc: jsPDF, record: ServiceRecord, y: number) {
  const attachments = (record.attachments ?? []).filter((item) => item?.dataUrl?.startsWith("data:image/"));
  if (!attachments.length) return y;
  const compact = attachments.length > 1;

  y = ensurePageSpace(doc, y, 70);
  sectionTitle(doc, "Evidências fotográficas", y);
  y += 34;

  attachments.forEach((attachment, index) => {
    y = drawAttachmentImage(doc, attachment, index, y, compact);
  });

  return y + 10;
}

function drawFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  line(doc, MARGIN, PAGE_HEIGHT - 45, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 45, BLUE, 1.2);
  setText(doc, MUTED, 7);
  doc.text("Tomasoni - Equipamentos para indústria de papelão ondulado", MARGIN, PAGE_HEIGHT - 29);
  doc.text(`Página ${pageNumber} de ${totalPages}`, PAGE_WIDTH - MARGIN - 58, PAGE_HEIGHT - 29);
}

function drawAllFooters(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, page, totalPages);
  }
}

function drawSignatureData(doc: jsPDF, record: ServiceRecord, y: number) {
  y = ensurePageSpace(doc, y, 190);
  sectionTitle(doc, "Assinatura do cliente", y);
  const col = (CONTENT_WIDTH - 12) / 2;
  y = wrappedFieldRow(doc, [
    { label: "Tipo de atendimento", value: record.service_type ?? "Visita técnica", x: MARGIN, width: col },
    { label: "Cliente / representante", value: record.customer_name, x: MARGIN + col + 12, width: col }
  ], y + 31, 33);
  y = ensurePageSpace(doc, y, 130);

  if (record.customer_signature) {
    const signatureWidth = 260;
    const signatureHeight = 72;
    const signatureX = MARGIN + (CONTENT_WIDTH - signatureWidth) / 2;
    const signatureY = y;
    doc.addImage(record.customer_signature, "PNG", signatureX, signatureY, signatureWidth, signatureHeight);
    line(doc, signatureX, signatureY + signatureHeight + 12, signatureX + signatureWidth, signatureY + signatureHeight + 12, MUTED, 0.55);
    setText(doc, MUTED, 7, "bold");
    doc.text("ASSINATURA DO CLIENTE / REPRESENTANTE", signatureX + signatureWidth / 2, signatureY + signatureHeight + 28, { align: "center" });
    setText(doc, DARK, 8);
    const nameLines = doc.splitTextToSize(valueOrDash(record.customer_name), signatureWidth) as string[];
    y = signatureY + signatureHeight + 43;
    for (const nameLine of nameLines) {
      y = ensurePageSpace(doc, y, 12);
      setText(doc, DARK, 8);
      doc.text(nameLine, signatureX + signatureWidth / 2, y, { align: "center" });
      y += 10;
    }
    return y + 15;
  } else {
    const signatureWidth = 260;
    const signatureX = MARGIN + (CONTENT_WIDTH - signatureWidth) / 2;
    line(doc, signatureX, y + 64, signatureX + signatureWidth, y + 64, MUTED, 0.55);
    setText(doc, MUTED, 7, "bold");
    doc.text("ASSINATURA DO CLIENTE / REPRESENTANTE", signatureX + signatureWidth / 2, y + 80, { align: "center" });
    return y + 98;
  }
}

async function createServicePdf(machine: Machine, record: ServiceRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait", compress: true });
  doc.setProperties({
    title: `${reportCode(machine, record)} - ${displayMachineCode(machine)}`,
    subject: "Relatório de Atendimento Técnico",
    author: "Tomasoni"
  });

  await drawHeader(doc, machine, record);
  const machineY = drawMachineData(doc, machine);
  const nextY = drawServiceData(doc, record, machineY);
  const attachmentY = drawAttachments(doc, record, nextY);
  const technicianY = drawTechnicianData(doc, record, attachmentY);
  if (record.service_type === "Visita técnica") drawSignatureData(doc, record, technicianY + 16);
  drawAllFooters(doc);

  return doc;
}

export function servicePdfFileName(machine: Machine, record: ServiceRecord) {
  return `${reportCode(machine, record)}-${displayMachineCode(machine)}.pdf`;
}

export async function servicePdfBase64(machine: Machine, record: ServiceRecord) {
  const doc = await createServicePdf(machine, record);
  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1] ?? "";
}

export async function servicePdfPreviewUrl(machine: Machine, record: ServiceRecord) {
  const doc = await createServicePdf(machine, record);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export async function downloadServicePdf(machine: Machine, record: ServiceRecord) {
  const doc = await createServicePdf(machine, record);
  doc.save(servicePdfFileName(machine, record));
}
