import { describe, expect, it } from "vitest";
import { isWindowedApp } from "@/lib/display-mode";

describe("app em janela ou tela cheia", () => {
  it("app instalado ocupando a tela toda (maximizado) mantém o menu lateral", () => {
    expect(isWindowedApp({ installedApp: true, innerWidth: 1920, availWidth: 1920 })).toBe(false);
    expect(isWindowedApp({ installedApp: true, innerWidth: 1905, availWidth: 1920 })).toBe(false);
  });

  it("app instalado fora da tela cheia usa a barra inferior", () => {
    expect(isWindowedApp({ installedApp: true, innerWidth: 1130, availWidth: 1920 })).toBe(true);
    expect(isWindowedApp({ installedApp: true, innerWidth: 960, availWidth: 1920 })).toBe(true);
    expect(isWindowedApp({ installedApp: true, innerWidth: 1700, availWidth: 1920 })).toBe(true);
  });

  it("navegador comum não é afetado (continua pelas regras de largura)", () => {
    expect(isWindowedApp({ installedApp: false, innerWidth: 1130, availWidth: 1920 })).toBe(false);
  });

  it("valores inválidos da tela não ativam o modo", () => {
    expect(isWindowedApp({ installedApp: true, innerWidth: 1130, availWidth: 0 })).toBe(false);
    expect(isWindowedApp({ installedApp: true, innerWidth: 1130, availWidth: Number.NaN })).toBe(false);
  });
});
