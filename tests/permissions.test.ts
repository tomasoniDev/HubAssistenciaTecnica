import { describe, expect, it } from "vitest";
import {
  canAccessCredentials,
  canEditMachine,
  canEditSchedule,
  canEmitReports,
  canManageContracts,
  canManageUsers,
  canUseRemoteAccess,
  hasFullAccess,
  isCorporateEmail
} from "@/lib/permissions";
import type { UserRole } from "@/lib/types";

const roles: UserRole[] = ["Admin", "Diretoria", "Coordenador", "Engenharia", "Montagem", "Montagem Elétrica", "Montagem Mecânica", "Controladoria", "Comercial"];

const allowed = (check: (role: UserRole) => boolean) => roles.filter((role) => check(role));

describe("permissões por perfil", () => {
  it("acesso total", () => {
    expect(allowed(hasFullAccess)).toEqual(["Admin", "Diretoria"]);
  });

  it("gerenciar usuários", () => {
    expect(allowed(canManageUsers)).toEqual(["Admin", "Diretoria", "Coordenador"]);
  });

  it("editar máquinas", () => {
    expect(allowed(canEditMachine)).toEqual(["Admin", "Diretoria", "Coordenador", "Engenharia"]);
  });

  it("contratos e cronograma (Comercial incluído)", () => {
    expect(allowed(canManageContracts)).toEqual(["Admin", "Diretoria", "Comercial"]);
    expect(allowed(canEditSchedule)).toEqual(["Admin", "Diretoria", "Comercial"]);
  });

  it("emitir relatórios", () => {
    expect(allowed(canEmitReports)).toEqual(["Admin", "Diretoria", "Coordenador", "Engenharia", "Montagem", "Montagem Elétrica", "Montagem Mecânica"]);
  });

  it("perfis sem papel definido não têm permissões", () => {
    for (const check of [hasFullAccess, canManageUsers, canEditMachine, canManageContracts, canEmitReports, canEditSchedule]) {
      expect(check(null)).toBe(false);
      expect(check(undefined)).toBe(false);
    }
  });

  it("acesso remoto: Admin ou liberado individualmente", () => {
    expect(canUseRemoteAccess({ role: "Admin", remote_access_allowed: false })).toBe(true);
    expect(canUseRemoteAccess({ role: "Engenharia", remote_access_allowed: true })).toBe(true);
    expect(canUseRemoteAccess({ role: "Engenharia", remote_access_allowed: false })).toBe(false);
    expect(canUseRemoteAccess(null)).toBe(false);
  });

  it("senhas: Admin ou liberado individualmente (Diretoria não vê por padrão)", () => {
    expect(canAccessCredentials({ role: "Admin", credential_access_allowed: false })).toBe(true);
    expect(canAccessCredentials({ role: "Diretoria", credential_access_allowed: false })).toBe(false);
    expect(canAccessCredentials({ role: "Diretoria", credential_access_allowed: true })).toBe(true);
  });
});

describe("e-mail corporativo", () => {
  it("aceita só os domínios da Tomasoni", () => {
    expect(isCorporateEmail("nome@tomasoni.ind.br")).toBe(true);
    expect(isCorporateEmail("  Nome@Tomasoni.In.Br ")).toBe(true);
    expect(isCorporateEmail("nome@gmail.com")).toBe(false);
    expect(isCorporateEmail("nome@tomasoni.ind.br.evil.com")).toBe(false);
    expect(isCorporateEmail("nome@faketomasoni.ind.br")).toBe(false);
  });
});
