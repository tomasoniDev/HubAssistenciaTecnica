import { describe, expect, it } from "vitest";
import { composeServiceDateTime, parseServiceDateTime } from "@/lib/service-datetime";
import { extractDateFromServiceDateTime, validateServiceDateTime } from "@/lib/app-helpers";

describe("parseServiceDateTime", () => {
  it("lê data e hora no formato gravado hoje", () => {
    expect(parseServiceDateTime("05/11/26 - 14:30")).toEqual({ date: "2026-11-05", time: "14:30", legacy: "" });
  });

  it("lê data sem hora e ano com 4 dígitos", () => {
    expect(parseServiceDateTime("05/11/26")).toEqual({ date: "2026-11-05", time: "", legacy: "" });
    expect(parseServiceDateTime("05/11/2026 - 08:00")).toEqual({ date: "2026-11-05", time: "08:00", legacy: "" });
  });

  it("vazio fica vazio", () => {
    expect(parseServiceDateTime("")).toEqual({ date: "", time: "", legacy: "" });
    expect(parseServiceDateTime(null)).toEqual({ date: "", time: "", legacy: "" });
  });

  it("textos antigos fora do formato são preservados como legado", () => {
    expect(parseServiceDateTime("05/11")).toEqual({ date: "", time: "", legacy: "05/11" });
    expect(parseServiceDateTime("semana que vem")).toEqual({ date: "", time: "", legacy: "semana que vem" });
  });

  it("datas impossíveis viram legado em vez de mudar de dia", () => {
    expect(parseServiceDateTime("31/02/26").legacy).toBe("31/02/26");
  });
});

describe("composeServiceDateTime", () => {
  it("monta o texto no formato que o PDF e o histórico já usam", () => {
    expect(composeServiceDateTime("2026-11-05", "14:30")).toBe("05/11/26 - 14:30");
    expect(composeServiceDateTime("2026-11-05", "")).toBe("05/11/26");
  });

  it("sem data não há valor", () => {
    expect(composeServiceDateTime("", "14:30")).toBe("");
  });

  it("o texto gerado passa na validação e na extração de data do app", () => {
    for (const text of [composeServiceDateTime("2026-11-05", "14:30"), composeServiceDateTime("2026-01-31", "")]) {
      expect(validateServiceDateTime(text, "Início")).toBe("");
      expect(extractDateFromServiceDateTime(text)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(extractDateFromServiceDateTime("05/11/26 - 14:30")).toBe("2026-11-05");
  });

  it("ida e volta mantém data e hora", () => {
    const parts = parseServiceDateTime(composeServiceDateTime("2027-03-09", "07:05"));
    expect(parts).toEqual({ date: "2027-03-09", time: "07:05", legacy: "" });
  });
});
