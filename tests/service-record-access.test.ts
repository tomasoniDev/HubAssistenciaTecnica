import { describe, expect, it } from "vitest";
import { canDeleteServiceRecord, canEditFinalizedReports, canModifyServiceRecord, isFinalizedServiceRecord } from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["Admin", "Diretoria", "Coordenador", "Engenharia", "Montagem", "Montagem Elétrica", "Montagem Mecânica", "Controladoria", "Comercial"];

const finalized = { created_by: "autor", report_status: "Finalizado" as const };
const draft = { created_by: "autor", report_status: "Rascunho" as const };
const author = (role: UserRole) => ({ id: "autor", role });
const other = (role: UserRole) => ({ id: "outro", role });

describe("relatório finalizado", () => {
  it("só Coordenação, Admin e Diretoria editam e excluem", () => {
    const allowed: UserRole[] = roles.filter((role) => canEditFinalizedReports(role));
    expect(allowed).toEqual(["Admin", "Diretoria", "Coordenador"]);
    for (const role of roles) {
      expect(canModifyServiceRecord(finalized, other(role))).toBe(allowed.includes(role));
      expect(canDeleteServiceRecord(finalized, other(role))).toBe(allowed.includes(role));
    }
  });

  it("o autor técnico não edita nem exclui o próprio relatório finalizado", () => {
    for (const role of ["Engenharia", "Montagem", "Montagem Elétrica", "Montagem Mecânica"] as UserRole[]) {
      expect(canModifyServiceRecord(finalized, author(role))).toBe(false);
      expect(canDeleteServiceRecord(finalized, author(role))).toBe(false);
    }
  });

  it("status ausente é tratado como finalizado (mais seguro)", () => {
    const semStatus = { created_by: "autor", report_status: null };
    expect(isFinalizedServiceRecord(semStatus)).toBe(true);
    expect(canModifyServiceRecord(semStatus, author("Engenharia"))).toBe(false);
  });

  it("Controladoria e Comercial nunca alteram", () => {
    for (const role of ["Controladoria", "Comercial"] as UserRole[]) {
      expect(canModifyServiceRecord(finalized, other(role))).toBe(false);
      expect(canDeleteServiceRecord(finalized, other(role))).toBe(false);
    }
  });
});

describe("rascunho", () => {
  it("o autor com permissão de emitir relatórios edita e exclui", () => {
    expect(canModifyServiceRecord(draft, author("Montagem Elétrica"))).toBe(true);
    expect(canDeleteServiceRecord(draft, author("Montagem Elétrica"))).toBe(true);
  });

  it("outro técnico não edita nem exclui rascunho alheio", () => {
    expect(canModifyServiceRecord(draft, other("Engenharia"))).toBe(false);
    expect(canDeleteServiceRecord(draft, other("Engenharia"))).toBe(false);
  });

  it("acesso total exclui rascunho alheio, mas não o edita (como antes)", () => {
    expect(canDeleteServiceRecord(draft, other("Admin"))).toBe(true);
    expect(canDeleteServiceRecord(draft, other("Diretoria"))).toBe(true);
    expect(canModifyServiceRecord(draft, other("Admin"))).toBe(false);
  });

  it("Controladoria autora não emite relatórios", () => {
    expect(canModifyServiceRecord(draft, author("Controladoria"))).toBe(false);
  });
});
