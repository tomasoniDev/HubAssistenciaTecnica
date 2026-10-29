import { afterEach, describe, expect, it, vi } from "vitest";
import { hydrateServiceRecord, needsHeavyFields } from "@/lib/service-record-client";
import type { ServiceRecord } from "@/lib/types";

function record(overrides: Partial<ServiceRecord> = {}): ServiceRecord {
  return {
    id: "r1", machine_id: "m1", technician_id: null, technician_name: "Ana", technician_email: null, technician_role: null,
    technician_phone: null, support_technicians: null, service_type: "Visita técnica", service_date: "2026-01-01",
    service_start: null, service_end: null, equipment: null, issue_summary: null, request: "", diagnosis: "", service_done: "",
    observations: null, customer_name: null, customer_signature: null, attachments: null, report_status: "Finalizado",
    report_recipients: null, created_by: null, created_at: "", updated_at: "u1", ...overrides
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("anexos sob demanda", () => {
  it("não busca nada quando o atendimento não tem anexos nem assinatura", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await hydrateServiceRecord(record({ has_attachments: false, has_signature: false }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.heavy_loaded).toBeUndefined();
  });

  it("não busca de novo registros que já vieram completos (ex.: recém-salvos)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const full = record({ attachments: [], has_attachments: true, heavy_loaded: true });
    expect(needsHeavyFields(full)).toBe(false);
    expect(await hydrateServiceRecord(full)).toBe(full);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("busca anexos e assinatura uma vez e reaproveita o cache", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ attachments: [{ id: "a", name: "x", type: "image/png", dataUrl: "data:image/png;base64,AA" }], customer_signature: "data:image/png;base64,BB" })
    });
    vi.stubGlobal("fetch", fetchMock);
    const light = record({ id: "cache-1", has_attachments: true, has_signature: true });

    const first = await hydrateServiceRecord(light);
    const second = await hydrateServiceRecord(light);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.attachments).toHaveLength(1);
    expect(first.customer_signature).toBe("data:image/png;base64,BB");
    expect(first.heavy_loaded).toBe(true);
    expect(second.attachments).toHaveLength(1);
  });

  it("busca de novo quando o registro foi alterado (updated_at diferente)", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ attachments: [], customer_signature: null }) });
    vi.stubGlobal("fetch", fetchMock);
    await hydrateServiceRecord(record({ id: "cache-2", updated_at: "v1", has_attachments: true }));
    await hydrateServiceRecord(record({ id: "cache-2", updated_at: "v2", has_attachments: true }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falha com mensagem clara em vez de devolver anexos vazios (evita apagar anexos ao editar)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Sem acesso" }) }));
    await expect(hydrateServiceRecord(record({ id: "cache-3", has_attachments: true }))).rejects.toThrow("Sem acesso");
  });
});
