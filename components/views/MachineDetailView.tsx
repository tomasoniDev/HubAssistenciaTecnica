"use client";

import type { Dispatch, SetStateAction } from "react";
import { DetailIcon, EditIcon, MoreIcon, PdfDownloadIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { ActionMenuPosition, ContractStatus, HistorySortKey, RegistryTab, RemoteAccess, SortDirection, View, displayMachineCode, formatDate, formatMonthYear, lastServiceDate, normalizeServiceType, sortMark } from "@/lib/app-helpers";
import { downloadServicePdf } from "@/lib/pdf";
import { Machine, ServiceRecord, SupportContract } from "@/lib/types";
import { MouseEvent as ReactMouseEvent } from "react";

export type MachineDetailViewProps = {
  actionMenuPosition: ActionMenuPosition | null;
  canDeleteRecord: (record: ServiceRecord) => boolean;
  canModifyRecord: (record: ServiceRecord) => boolean;
  currentUserCanAccessCredentials: boolean;
  currentUserCanEditMachine: boolean;
  currentUserCanEmitReports: boolean;
  currentUserCanViewMachineDetailCards: boolean;
  currentUserId: string;
  deleteServiceRecord: (record: ServiceRecord) => Promise<void>;
  filteredHistory: ServiceRecord[];
  historyFilter: string;
  historySort: { key: HistorySortKey; direction: SortDirection; };
  openActionMenu: string;
  openServiceDraftPreview: (record: ServiceRecord) => Promise<void>;
  openServiceRecord: (record: ServiceRecord) => Promise<void>;
  pdfReadyServiceRecord: (record: ServiceRecord) => ServiceRecord;
  selectedMachine: Machine | undefined;
  selectedMachineAccess: RemoteAccess;
  selectedMachineContract: SupportContract | undefined;
  selectedMachineContractDays: number | null;
  selectedMachineContractStatus: ContractStatus;
  selectedMachineDraftReports: ServiceRecord[];
  selectedMachineHasContractInfo: boolean;
  selectedMachineRecentHistory: ServiceRecord[];
  setEditingMachineId: Dispatch<SetStateAction<string>>;
  setHistoryFilter: Dispatch<SetStateAction<string>>;
  setOpenActionMenu: Dispatch<SetStateAction<string>>;
  setRegistryTab: Dispatch<SetStateAction<RegistryTab>>;
  setView: Dispatch<SetStateAction<View>>;
  showFullHistory: () => void;
  startNewService: (machine?: Machine | null) => void;
  startServiceEdit: (sourceRecord: ServiceRecord, preservedRecipients?: string[] | null) => Promise<void>;
  toggleActionMenu: (id: string, event: ReactMouseEvent<HTMLButtonElement>) => void;
  toggleHistorySort: (key: HistorySortKey) => void;
  view: View;
};

export function MachineDetailView({
  actionMenuPosition,
  canDeleteRecord,
  canModifyRecord,
  currentUserCanAccessCredentials,
  currentUserCanEditMachine,
  currentUserCanEmitReports,
  currentUserCanViewMachineDetailCards,
  currentUserId,
  deleteServiceRecord,
  filteredHistory,
  historyFilter,
  historySort,
  openActionMenu,
  openServiceDraftPreview,
  openServiceRecord,
  pdfReadyServiceRecord,
  selectedMachine,
  selectedMachineAccess,
  selectedMachineContract,
  selectedMachineContractDays,
  selectedMachineContractStatus,
  selectedMachineDraftReports,
  selectedMachineHasContractInfo,
  selectedMachineRecentHistory,
  setEditingMachineId,
  setHistoryFilter,
  setOpenActionMenu,
  setRegistryTab,
  setView,
  showFullHistory,
  startNewService,
  startServiceEdit,
  toggleActionMenu,
  toggleHistorySort,
  view
}: MachineDetailViewProps) {
  return (
    <>
        {view === "machineDetail" && selectedMachine && (
          <section className="machine-dashboard view active">
            <section className="machine-hero">
              <div className="machine-hero-main">
                <div className="machine-title-row">
                  <h2>{selectedMachine.model || "Máquina"}</h2>
                  <span className="code-pill">{displayMachineCode(selectedMachine)}</span>
                </div>
                <div className="machine-metrics">
                  <div><DetailIcon type="client" /><p><span>Cliente</span><strong>{selectedMachine.client || "-"}</strong></p></div>
                  <div><DetailIcon type="serial" /><p><span>Número de série</span><strong>{selectedMachine.serial || "-"}</strong></p></div>
                  <div><DetailIcon type="calendar" /><p><span>Fabricação</span><strong>{formatMonthYear(selectedMachine.manufacture_month)}</strong></p></div>
                  <div><DetailIcon type="location" /><p><span>Localização</span><strong>{selectedMachine.unit_city || "-"}</strong></p></div>
                  <div><DetailIcon type="mechanical" /><p><span>Lista Mecânica</span><strong>{selectedMachine.mechanical_list || "-"}</strong></p></div>
                  <div className="metric-wide"><DetailIcon type="detail" /><p><span>Descrição</span><strong>{selectedMachine.description || "-"}</strong></p></div>
                </div>
              </div>
              <aside className={`contract-card ${selectedMachineContractStatus === "Ativo" ? "active" : selectedMachineContractStatus === "Em negociação" ? "negotiating" : "inactive"}`}>
                <DetailIcon type={selectedMachineContractStatus === "Ativo" ? "check" : selectedMachineContractStatus === "Em negociação" ? "history" : "alert"} />
                <strong>{selectedMachineContractStatus === "Ativo" ? "Contrato Ativo" : selectedMachineContractStatus === "Em negociação" ? "Em negociação" : "Sem contrato ativo"}</strong>
                {selectedMachineHasContractInfo && selectedMachineContract && (
                  <>
                    <span>Tipo de contrato</span>
                    <b>{selectedMachineContract.contract_type || "-"}</b>
                    <span>Fim da vigência</span>
                    <em>{formatDate(selectedMachineContract.support_contract_until)}</em>
                    {selectedMachineContractDays !== null && <small>{selectedMachineContractDays >= 0 ? `Faltam ${selectedMachineContractDays} dias` : `Vencido há ${Math.abs(selectedMachineContractDays)} dias`}</small>}
                  </>
                )}
              </aside>
            </section>

            {currentUserCanViewMachineDetailCards && (
              <section className="dashboard-grid">
                <article className="dashboard-card">
                  <div className="card-title"><DetailIcon type="software" /><h3>Software</h3></div>
                  <dl className="spec-list">
                    <div><dt>Software</dt><dd><span className="soft-pill">{selectedMachine.software_version || "-"}</span></dd></div>
                    <div><dt>Código do software</dt><dd>{selectedMachine.software_code || "-"}</dd></div>
                    <div><dt>VM</dt><dd>{selectedMachine.vm || "-"}</dd></div>
                    <div><dt>Faixa de IP</dt><dd>{selectedMachine.ip_range || "-"}</dd></div>
                    <div><dt>Último atendimento</dt><dd>{formatDate(lastServiceDate(selectedMachine))}</dd></div>
                  </dl>
                </article>

                <article className="dashboard-card remote-access-card">
                  <div className="card-title"><DetailIcon type="remote" /><h3>Acesso Remoto</h3><span className="soft-pill">{selectedMachineAccess}</span></div>
                  <dl className="spec-list">
                    {selectedMachineAccess === "VNC" && (
                      <>
                        <div><dt>IP de acesso</dt><dd>{selectedMachine.vnc_ip || "-"}</dd></div>
                        <div><dt>Usuário VM</dt><dd>{selectedMachine.vnc_user || "-"}</dd></div>
                        <div><dt>Senha</dt><dd>{currentUserCanAccessCredentials ? selectedMachine.vnc_password || "-" : "Protegida"}</dd></div>
                        <div><dt>Senha VM</dt><dd>{currentUserCanAccessCredentials ? selectedMachine.vnc_vm_password || "-" : "Protegida"}</dd></div>
                        <div><dt>Observações</dt><dd>{selectedMachine.vnc_notes || "-"}</dd></div>
                      </>
                    )}
                    {selectedMachineAccess === "SINEMA" && (
                      <>
                        <div><dt>Device Name</dt><dd>{selectedMachine.sinema_url || "-"}</dd></div>
                        <div><dt>Subnet Name</dt><dd>{selectedMachine.sinema_user || "-"}</dd></div>
                        <div><dt>Observações</dt><dd>{selectedMachine.sinema_notes || "-"}</dd></div>
                      </>
                    )}
                    {selectedMachineAccess === "Sem acesso remoto" && <div><dt>Status</dt><dd>Sem acesso remoto cadastrado</dd></div>}
                  </dl>
                </article>

                <article className="dashboard-card history-card">
                  <div className="card-title"><DetailIcon type="history" /><h3>Histórico de Atendimentos</h3><button className="button ghost" type="button" onClick={showFullHistory}>Ver todos</button></div>
                  <div className="history-list">
                    {selectedMachineRecentHistory.length ? selectedMachineRecentHistory.map((record) => (
                      <button key={record.id} type="button" onClick={() => void openServiceRecord(record)}>
                        <span>{formatDate(record.service_date)}</span>
                        <strong>{record.issue_summary || record.equipment || "Atendimento"}</strong>
                        <em>{normalizeServiceType(record.service_type)}</em>
                      </button>
                    )) : <p>Nenhum atendimento registrado.</p>}
                  </div>
                </article>
              </section>
            )}

            <section className="dashboard-card quick-actions-card">
              <div className="card-title"><DetailIcon type="mechanical" /><h3>Ações rápidas</h3></div>
              <div className="quick-action-grid">
                {currentUserCanEmitReports && <button type="button" onClick={() => startNewService(selectedMachine)}><PlusIcon /><span>Novo atendimento</span></button>}
                {currentUserCanEditMachine && <button type="button" onClick={() => { setEditingMachineId(selectedMachine.id); setRegistryTab("machines"); setView("registry"); }}><EditIcon /><span>Alterar cadastro</span></button>}
                <button type="button" onClick={() => selectedMachineRecentHistory[0] && downloadServicePdf(selectedMachine, pdfReadyServiceRecord(selectedMachineRecentHistory[0]))} disabled={!selectedMachineRecentHistory.length}><PdfDownloadIcon /><span>Baixar último PDF</span></button>
              </div>
            </section>

            {selectedMachineDraftReports.length > 0 && (
              <section className="dashboard-card draft-history-card">
                <div className="section-header">
                  <div>
                    <h2>Prévias não finalizadas</h2>
                    <p>Relatórios salvos para revisão, assinatura ou envio posterior.</p>
                  </div>
                  <span>{selectedMachineDraftReports.length} pendente{selectedMachineDraftReports.length === 1 ? "" : "s"}</span>
                </div>
                <div className="table-wrap">
                  <table className="history-table">
                    <thead><tr>
                      <th>Data</th>
                      <th>Equipamento</th>
                      <th>Técnico</th>
                      <th>Motivo breve</th>
                      <th>Ações</th>
                    </tr></thead>
                    <tbody>
                      {selectedMachineDraftReports.map((record) => (
                        <tr key={record.id}>
                          <td>{formatDate(record.service_date)}</td>
                          <td>{record.equipment || "-"}</td>
                          <td>{record.technician_name}</td>
                          <td>{record.issue_summary || "-"}</td>
                          <td>
                            <div className="row-actions">
                              <button className="icon-button menu-trigger" type="button" title="Ações" aria-label="Ações da prévia" onClick={(event) => toggleActionMenu(`draft-service-${record.id}`, event)}><MoreIcon /></button>
                              {openActionMenu === `draft-service-${record.id}` && (
                                <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                  <button type="button" onClick={() => { void openServiceDraftPreview(record); setOpenActionMenu(""); }}><PdfDownloadIcon /> Abrir prévia</button>
                                  {canModifyRecord(record) && <button type="button" onClick={() => { startServiceEdit(record); setOpenActionMenu(""); }}><EditIcon /> Editar</button>}
                                  {currentUserCanEmitReports && record.created_by === currentUserId && <button type="button" onClick={() => { void openServiceDraftPreview(record); setOpenActionMenu(""); }}><DetailIcon type="mail" /> Finalizar</button>}
                                  {canDeleteRecord(record) && <button className="danger" type="button" onClick={() => { void deleteServiceRecord(record); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="dashboard-card full-history-card" id="full-machine-history">
              <div className="section-header"><h2>Histórico completo de {displayMachineCode(selectedMachine)}</h2><span>{filteredHistory.length} registros</span></div>
              <label>Filtrar histórico<input value={historyFilter} onChange={(event) => setHistoryFilter(event.target.value)} /></label>
              <div className="table-wrap">
                <table className="history-table">
                  <thead><tr>
                    <th><button className="sort-header" type="button" onClick={() => toggleHistorySort("service_date")}>Data <span>{sortMark(historySort.key === "service_date", historySort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleHistorySort("equipment")}>Equipamento <span>{sortMark(historySort.key === "equipment", historySort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleHistorySort("technician_name")}>Técnico <span>{sortMark(historySort.key === "technician_name", historySort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleHistorySort("issue_summary")}>Motivo breve <span>{sortMark(historySort.key === "issue_summary", historySort.direction)}</span></button></th>
                    <th>Ações</th>
                  </tr></thead>
                  <tbody>
                    {filteredHistory.map((record) => (
                      <tr key={record.id} className="clickable-row" onClick={() => void openServiceRecord(record)}>
                        <td>{formatDate(record.service_date)}</td>
                        <td>{record.equipment || "-"}</td>
                        <td>{record.technician_name}</td>
                        <td>{record.issue_summary || "-"}</td>
                        <td>
                          <div className="row-actions" onClick={(event) => event.stopPropagation()}>
                            <button className="icon-button menu-trigger" type="button" title="Ações" aria-label="Ações do atendimento" onClick={(event) => toggleActionMenu(`service-${record.id}`, event)}><MoreIcon /></button>
                            {openActionMenu === `service-${record.id}` && (
                              <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                <button type="button" onClick={() => { downloadServicePdf(selectedMachine, pdfReadyServiceRecord(record)); setOpenActionMenu(""); }}><PdfDownloadIcon /> Baixar PDF</button>
                                {canModifyRecord(record) && <button type="button" onClick={() => { startServiceEdit(record); setOpenActionMenu(""); }}><EditIcon /> Editar</button>}
                                {canDeleteRecord(record) && <button className="danger" type="button" onClick={() => { void deleteServiceRecord(record); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}
    </>
  );
}
