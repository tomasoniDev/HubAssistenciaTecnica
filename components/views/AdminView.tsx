"use client";

import type { AppDeploymentInfo, AppMigrationInfo, AppSecretRotationInfo } from "@/lib/types";
import { DetailIcon } from "@/components/icons";
import { View, auditActionLabel, auditDetailsSummary, auditEntityLabel, displayUserName, formatDate, formatLongDateTime, isAssemblyRole, secretRotationMessage, shortCommit } from "@/lib/app-helpers";
import { hasFullAccess } from "@/lib/permissions";
import { AppAuditLog, AuthorizedUser, ChatContact, ChatConversation, Machine, ServiceRecord, SupportContract, UserRole } from "@/lib/types";

export type AdminViewProps = {
  adminAuditLogs: AppAuditLog[];
  adminCredentialEncryption: { configured: boolean; plaintextCount: number; } | null;
  adminDeployment: AppDeploymentInfo | undefined;
  adminMigrations: AppMigrationInfo[];
  adminSecretDaysRemaining: number | null;
  adminSecretNextRotation: string;
  adminSecretRotation: AppSecretRotationInfo | null;
  adminSecretStatus: "warning" | "danger" | "success";
  authorizedUsers: AuthorizedUser[];
  chatContacts: ChatContact[];
  chatConversations: ChatConversation[];
  currentUserCanViewAdmin: boolean;
  currentUserRole: UserRole | null;
  encryptStoredCredentials: () => Promise<void>;
  machines: Machine[];
  overviewData: { totalMachines: number; totalServices: number; servicesThisMonth: number; activeContracts: number; negotiatingContracts: number; expiringContracts: number; expiredContracts: number; remoteCoverage: number; staleMachines: number; machinesWithoutService: number; byModel: { name: string; value: number; }[]; byAccess: { name: string; value: number; }[]; byState: { name: string; value: number; }[]; geoStates: { state: string; value: number; machines: Machine[]; }[]; geoCities: { value: number; city: string; state: string; machines: Machine[]; }[]; byContractType: { name: string; value: number; }[]; byServiceType: { name: string; value: number; }[]; byClient: { name: string; value: number; }[]; byClientServices: { name: string; value: number; }[]; byVmSoftware: { name: string; value: number; }[]; serviceTrend: { name: string; value: number; }[]; topMachinesByService: { machine: Machine; value: number; }[]; machineAttention: { machine: Machine; lastDate: string; days: number | null; services: number; }[]; recentServices: { machine: Machine; record: ServiceRecord; }[]; };
  resetClientSecretRotation: () => Promise<void>;
  supportContracts: SupportContract[];
  view: View;
};

export function AdminView({
  adminAuditLogs,
  adminCredentialEncryption,
  adminDeployment,
  adminMigrations,
  adminSecretDaysRemaining,
  adminSecretNextRotation,
  adminSecretRotation,
  adminSecretStatus,
  authorizedUsers,
  chatContacts,
  chatConversations,
  currentUserCanViewAdmin,
  currentUserRole,
  encryptStoredCredentials,
  machines,
  overviewData,
  resetClientSecretRotation,
  supportContracts,
  view
}: AdminViewProps) {
  return (
    <>
        {view === "admin" && currentUserCanViewAdmin && (
          <section className="admin-page view active">
            <section className="kpi-grid">
              <article className="kpi-card accent">
                <span>Usuários autorizados</span>
                <strong>{authorizedUsers.length}</strong>
                <small>{authorizedUsers.filter((user) => hasFullAccess(user.role)).length} com acesso total</small>
              </article>
              <article className="kpi-card">
                <span>Máquinas cadastradas</span>
                <strong>{machines.length}</strong>
                <small>{machines.filter((machine) => machine.updated_at).length} registros monitorados</small>
              </article>
              <article className="kpi-card">
                <span>Relatórios</span>
                <strong>{overviewData.totalServices}</strong>
                <small>{overviewData.servicesThisMonth} no mês atual</small>
              </article>
              <article className="kpi-card success">
                <span>Contratos</span>
                <strong>{supportContracts.length}</strong>
                <small>{overviewData.activeContracts} ativos</small>
              </article>
              <article className="kpi-card warning">
                <span>Migrations locais</span>
                <strong>{adminMigrations.length}</strong>
                <small>Últimas versionadas</small>
              </article>
              <article className={`kpi-card ${adminSecretStatus}`}>
                <span>CLIENT_SECRET</span>
                <strong>{adminSecretDaysRemaining === null ? "-" : adminSecretDaysRemaining}</strong>
                <small>{adminSecretDaysRemaining === null ? "Rotação não configurada" : "dias para troca"}</small>
              </article>
              <article className="kpi-card">
                <span>Eventos auditados</span>
                <strong>{adminAuditLogs.length}</strong>
                <small>Últimos registros carregados</small>
              </article>
            </section>

            <section className="admin-grid">
              <article className="dashboard-card admin-info-card">
                <div className="card-title"><DetailIcon type="software" /><h3>Deploy e ambiente</h3></div>
                <div className="admin-info-list">
                  <div><span>Ambiente</span><strong>{adminDeployment?.environment || "-"}</strong></div>
                  <div><span>URL</span><strong>{adminDeployment?.url || "-"}</strong></div>
                  <div><span>Commit</span><strong>{shortCommit(adminDeployment?.commit_sha)}</strong></div>
                  <div><span>Mensagem</span><strong title={adminDeployment?.commit_message || ""}>{adminDeployment?.commit_message || "-"}</strong></div>
                  <div><span>Autor</span><strong>{adminDeployment?.commit_author || "-"}</strong></div>
                  <div><span>Região</span><strong>{adminDeployment?.region || "-"}</strong></div>
                  <div><span>Runtime</span><strong>{adminDeployment?.node_env || "-"}</strong></div>
                  <div><span>Leitura</span><strong>{formatLongDateTime(adminDeployment?.generated_at)}</strong></div>
                </div>
              </article>

              <article className={`dashboard-card admin-info-card secret-rotation-card ${adminSecretStatus}`}>
                <div className="card-title"><DetailIcon type="alert" /><h3>Rotação CLIENT_SECRET</h3></div>
                <div className="admin-info-list">
                  <div><span>Integração</span><strong>{adminSecretRotation?.label || "CLIENT_SECRET SharePoint"}</strong></div>
                  <div><span>Última troca</span><strong>{formatDate(adminSecretRotation?.rotated_at)}</strong></div>
                  <div><span>Próxima troca</span><strong>{formatDate(adminSecretNextRotation)}</strong></div>
                  <div><span>Ciclo</span><strong>{adminSecretRotation?.rotation_days ?? 180} dias</strong></div>
                  <div><span>Status</span><strong>{secretRotationMessage(adminSecretDaysRemaining)}</strong></div>
                </div>
                <button className="button ghost" type="button" onClick={() => void resetClientSecretRotation()}>Resetar contagem</button>
              </article>

              <article className="dashboard-card admin-info-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Migrations recentes</h3></div>
                <div className="admin-migration-list">
                  {adminMigrations.length ? adminMigrations.slice(0, 8).map((migration) => (
                    <div key={migration.file}>
                      <span>{migration.version}</span>
                      <strong title={migration.file}>{migration.name || migration.file}</strong>
                      <small>{formatLongDateTime(migration.updated_at)}</small>
                    </div>
                  )) : <p className="empty-card-note">Nenhuma migration local encontrada.</p>}
                </div>
              </article>

              <article className="dashboard-card admin-info-card">
                <div className="card-title"><DetailIcon type="check" /><h3>Criptografia das senhas</h3></div>
                <div className="admin-info-list">
                  <div><span>Chave configurada</span><strong>{adminCredentialEncryption?.configured ? "Sim" : "Não"}</strong></div>
                  <div><span>Senhas em texto</span><strong>{adminCredentialEncryption?.plaintextCount ?? 0}</strong></div>
                  <div><span>Status</span><strong>{!adminCredentialEncryption?.configured ? "Defina a chave na Vercel" : adminCredentialEncryption.plaintextCount > 0 ? "Há senhas para criptografar" : "Tudo criptografado"}</strong></div>
                </div>
                {currentUserRole === "Admin" && adminCredentialEncryption?.configured && adminCredentialEncryption.plaintextCount > 0 && (
                  <button className="button ghost" type="button" onClick={() => void encryptStoredCredentials()}>Criptografar senhas existentes</button>
                )}
              </article>

              <article className="dashboard-card admin-info-card">
                <div className="card-title"><DetailIcon type="check" /><h3>Permissões e módulos</h3></div>
                <div className="admin-info-list">
                  <div><span>Admin</span><strong>{authorizedUsers.filter((user) => user.role === "Admin").length}</strong></div>
                  <div><span>Diretoria</span><strong>{authorizedUsers.filter((user) => user.role === "Diretoria").length}</strong></div>
                  <div><span>Montagens</span><strong>{authorizedUsers.filter((user) => isAssemblyRole(user.role)).length}</strong></div>
                  <div><span>Controladoria</span><strong>{authorizedUsers.filter((user) => user.role === "Controladoria").length}</strong></div>
                  <div><span>Acesso Remoto</span><strong>{authorizedUsers.filter((user) => user.remote_access_allowed).length}</strong></div>
                  <div><span>Acesso a senhas</span><strong>{authorizedUsers.filter((user) => user.credential_access_allowed).length}</strong></div>
                  <div><span>Conversas</span><strong>{chatConversations.length}</strong></div>
                  <div><span>Clientes do chat</span><strong>{chatContacts.length}</strong></div>
                </div>
              </article>

              <article className="dashboard-card admin-audit-card admin-wide-card">
                <div className="card-title"><DetailIcon type="detail" /><h3>Últimas ações dos usuários</h3></div>
                <div className="admin-audit-list">
                  {adminAuditLogs.length ? adminAuditLogs.map((log) => (
                    <article key={log.id} className="admin-audit-item">
                      <time>{formatLongDateTime(log.created_at)}</time>
                      <div>
                        <strong>{auditActionLabel(log.action)}</strong>
                        <span>{auditEntityLabel(log.entity)} · {log.entity_label || auditDetailsSummary(log)}</span>
                        <p>{auditDetailsSummary(log)}</p>
                      </div>
                      <small>{log.user_name || displayUserName(log.user_email || "")}<br />{log.user_role || "-"}</small>
                    </article>
                  )) : (
                    <p className="empty-card-note">
                      Nenhuma ação auditada ainda. Aplique a migration 035_admin_audit_logs.sql para iniciar o registro das próximas operações.
                    </p>
                  )}
                </div>
              </article>
            </section>
          </section>
        )}
    </>
  );
}
