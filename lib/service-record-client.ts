import type { ServiceRecord } from "./types";

// Anexos e assinatura são pesados e não vêm na carga inicial: são buscados
// sob demanda quando o atendimento é aberto, editado ou vira PDF.

type HeavyFields = Pick<ServiceRecord, "attachments" | "customer_signature">;

const MAX_CACHED_RECORDS = 8;
const cache = new Map<string, { updatedAt: string; heavy: HeavyFields }>();

export function needsHeavyFields(record: ServiceRecord) {
  return !record.heavy_loaded && Boolean(record.has_attachments || record.has_signature);
}

export async function hydrateServiceRecord(record: ServiceRecord): Promise<ServiceRecord> {
  if (!needsHeavyFields(record)) return record;

  const cached = cache.get(record.id);
  if (cached && cached.updatedAt === record.updated_at) {
    return { ...record, ...cached.heavy, heavy_loaded: true };
  }

  const response = await fetch(`/api/service-record?id=${encodeURIComponent(record.id)}`, {
    credentials: "include"
  });
  const data = await response.json().catch(() => null) as (Partial<HeavyFields> & { error?: string }) | null;
  if (!response.ok || !data) {
    throw new Error(data?.error ?? "Não foi possível carregar os anexos e a assinatura do atendimento.");
  }

  const heavy: HeavyFields = {
    attachments: data.attachments ?? null,
    customer_signature: data.customer_signature ?? null
  };

  cache.delete(record.id);
  cache.set(record.id, { updatedAt: record.updated_at, heavy });
  while (cache.size > MAX_CACHED_RECORDS) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }

  return { ...record, ...heavy, heavy_loaded: true };
}
