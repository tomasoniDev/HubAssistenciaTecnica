import type { AuthorizedUser, UserRole } from "./types";

// Regras de permissão compartilhadas entre servidor (validação real) e
// interface (mostrar ou esconder opções). Mudar aqui vale para os dois lados.

export const ALLOWED_EMAIL_DOMAINS = ["tomasoni.ind.br", "tomasoni.in.br"];

export function isCorporateEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((domain) => normalized.endsWith(`@${domain}`));
}

export function hasFullAccess(role?: UserRole | null) {
  return role === "Admin" || role === "Diretoria";
}

export function canManageUsers(role?: UserRole | null) {
  return hasFullAccess(role) || role === "Coordenador";
}

export function canEditMachine(role?: UserRole | null) {
  return hasFullAccess(role) || role === "Engenharia" || role === "Coordenador";
}

export function canManageContracts(role?: UserRole | null) {
  return hasFullAccess(role) || role === "Comercial";
}

export function canEmitReports(role?: UserRole | null) {
  return hasFullAccess(role)
    || role === "Engenharia"
    || role === "Coordenador"
    || role === "Montagem"
    || role === "Montagem Elétrica"
    || role === "Montagem Mecânica";
}

export function canEditSchedule(role?: UserRole | null) {
  return hasFullAccess(role) || role === "Comercial";
}

export function canUseRemoteAccess(user?: Pick<AuthorizedUser, "role" | "remote_access_allowed"> | null) {
  return user?.role === "Admin" || Boolean(user?.remote_access_allowed);
}

export function canAccessCredentials(user?: Pick<AuthorizedUser, "role" | "credential_access_allowed"> | null) {
  return user?.role === "Admin" || Boolean(user?.credential_access_allowed);
}

// ---- Atendimentos: quem pode alterar ou excluir ----
// Rascunho: o autor (exclusão também por acesso total).
// Finalizado: somente Coordenação, Admin e Diretoria.

export type ServiceRecordAccessInfo = {
  created_by: string | null;
  report_status: "Rascunho" | "Finalizado" | null;
};

export type ServiceRecordActor = { id: string; role?: UserRole | null };

export function isFinalizedServiceRecord(record: Pick<ServiceRecordAccessInfo, "report_status">) {
  return record.report_status !== "Rascunho";
}

export function canEditFinalizedReports(role?: UserRole | null) {
  return hasFullAccess(role) || role === "Coordenador";
}

export function canModifyServiceRecord(record: ServiceRecordAccessInfo, actor: ServiceRecordActor) {
  if (isFinalizedServiceRecord(record)) return canEditFinalizedReports(actor.role);
  return canEmitReports(actor.role) && record.created_by === actor.id;
}

export function canDeleteServiceRecord(record: ServiceRecordAccessInfo, actor: ServiceRecordActor) {
  if (isFinalizedServiceRecord(record)) return canEditFinalizedReports(actor.role);
  return hasFullAccess(actor.role) || (canEmitReports(actor.role) && record.created_by === actor.id);
}

export const FINALIZED_REPORT_LOCK_MESSAGE = "Relatórios finalizados só podem ser alterados ou excluídos por Coordenação, Admin ou Diretoria.";
