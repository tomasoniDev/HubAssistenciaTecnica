"use client";

import type { Dispatch, SetStateAction } from "react";
import { EditIcon, MoreIcon, SaveIcon, TrashIcon } from "@/components/icons";
import { ActionMenuPosition, CONTRACT_STATUS_OPTIONS, CONTRACT_TYPE_OPTIONS, ContractStatus, EMPTY_CONTRACT_FORM, EMPTY_TRAVEL_FORM, ScheduleTab, SortDirection, SupportContractFormState, TRAVEL_STATUS_OPTIONS, TravelScheduleFormState, TravelSortKey, View, contractStatus, daysUntil, displayMachineCode, formatDate, formatDayMonthInput, formatFullDateInput, formatMachineProjectCodeInput, formatTravelClientCodeInput, sortMark } from "@/lib/app-helpers";
import { Machine, SupportContract, TravelSchedule } from "@/lib/types";
import { FormEvent, MouseEvent as ReactMouseEvent } from "react";

export type ScheduleViewProps = {
  actionMenuPosition: ActionMenuPosition | null;
  completedTravelSchedules: TravelSchedule[];
  completedTravelSort: { key: TravelSortKey; direction: SortDirection; };
  contractForm: SupportContractFormState;
  currentUserCanEditSchedule: boolean;
  currentUserCanManageContracts: boolean;
  deleteSupportContract: (id: string) => Promise<void>;
  deleteTravelSchedule: (id: string) => Promise<void>;
  editingContractId: string;
  editingTravelId: string;
  editSupportContract: (contract: SupportContract) => void;
  editTravelSchedule: (item: TravelSchedule) => void;
  machines: Machine[];
  openActionMenu: string;
  openTravelSchedules: TravelSchedule[];
  saveSupportContract: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveTravelSchedule: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  scheduleTab: ScheduleTab;
  setContractForm: Dispatch<SetStateAction<SupportContractFormState>>;
  setEditingContractId: Dispatch<SetStateAction<string>>;
  setEditingTravelId: Dispatch<SetStateAction<string>>;
  setOpenActionMenu: Dispatch<SetStateAction<string>>;
  setScheduleTab: Dispatch<SetStateAction<ScheduleTab>>;
  setTravelForm: Dispatch<SetStateAction<TravelScheduleFormState>>;
  supportContracts: SupportContract[];
  toggleActionMenu: (id: string, event: ReactMouseEvent<HTMLButtonElement>) => void;
  toggleCompletedTravelSort: (key: TravelSortKey) => void;
  toggleTravelSort: (key: TravelSortKey) => void;
  travelCodeSuggestions: string[];
  travelForm: TravelScheduleFormState;
  travelSort: { key: TravelSortKey; direction: SortDirection; };
  updateContractMachine: (machineId: string) => void;
  updateContractSerial: (serial: string) => void;
  view: View;
};

export function ScheduleView({
  actionMenuPosition,
  completedTravelSchedules,
  completedTravelSort,
  contractForm,
  currentUserCanEditSchedule,
  currentUserCanManageContracts,
  deleteSupportContract,
  deleteTravelSchedule,
  editingContractId,
  editingTravelId,
  editSupportContract,
  editTravelSchedule,
  machines,
  openActionMenu,
  openTravelSchedules,
  saveSupportContract,
  saveTravelSchedule,
  scheduleTab,
  setContractForm,
  setEditingContractId,
  setEditingTravelId,
  setOpenActionMenu,
  setScheduleTab,
  setTravelForm,
  supportContracts,
  toggleActionMenu,
  toggleCompletedTravelSort,
  toggleTravelSort,
  travelCodeSuggestions,
  travelForm,
  travelSort,
  updateContractMachine,
  updateContractSerial,
  view
}: ScheduleViewProps) {
  return (
    <>
        {view === "schedule" && (
          <section className="view active schedule-page">
            {currentUserCanManageContracts && (
              <section className="table-panel">
                <div className="section-header">
                  <h2>Cronograma</h2>
                  <div className="segmented-control" aria-label="Tipo de registro">
                    <button className={scheduleTab === "travel" ? "active" : ""} type="button" onClick={() => setScheduleTab("travel")}>Registro de viagens</button>
                    <button className={scheduleTab === "contracts" ? "active" : ""} type="button" onClick={() => setScheduleTab("contracts")}>Contratos</button>
                  </div>
                </div>
              </section>
            )}

            {scheduleTab === "travel" && currentUserCanEditSchedule && (
              <form className="form-panel" onSubmit={saveTravelSchedule}>
                <div className="section-header">
                  <h2>{editingTravelId ? "Alterar viagem" : "Registrar viagem"}</h2>
                  <div className="actions-row">
                    {editingTravelId && <button className="button ghost" type="button" onClick={() => { setEditingTravelId(""); setTravelForm(EMPTY_TRAVEL_FORM); }}>Cancelar</button>}
                    <button className="icon-button save-action" title="Salvar cronograma" aria-label="Salvar cronograma"><SaveIcon /></button>
                  </div>
                </div>
                <div className="fields-grid">
                  <label>Data de início<input value={travelForm.start_date} onChange={(event) => setTravelForm((current) => ({ ...current, start_date: /^a/i.test(event.target.value) ? event.target.value : formatDayMonthInput(event.target.value) }))} placeholder="dd/mm ou A definir" maxLength={10} /></label>
                  <label>Data de fim<input value={travelForm.end_date} onChange={(event) => setTravelForm((current) => ({ ...current, end_date: /^a/i.test(event.target.value) ? event.target.value : formatDayMonthInput(event.target.value) }))} placeholder="dd/mm ou A definir" maxLength={10} /></label>
                  <label>Código do cliente<input list="travel-code-suggestions" value={travelForm.code} onChange={(event) => setTravelForm((current) => ({ ...current, code: formatTravelClientCodeInput(event.target.value) }))} placeholder="Cxxx" maxLength={4} /></label>
                  <datalist id="travel-code-suggestions">{travelCodeSuggestions.map((code) => <option key={code} value={code} />)}</datalist>
                  <label>Cliente<input list="client-suggestions" value={travelForm.client} onChange={(event) => setTravelForm((current) => ({ ...current, client: event.target.value }))} /></label>
                  <label>Técnicos<input value={travelForm.technicians} onChange={(event) => setTravelForm((current) => ({ ...current, technicians: event.target.value }))} placeholder="Nomes separados por vírgula" /></label>
                  <label>Status<input list="travel-status-suggestions" value={travelForm.status} onChange={(event) => setTravelForm((current) => ({ ...current, status: event.target.value }))} placeholder="Digite ou selecione" /></label>
                  <datalist id="travel-status-suggestions">
                    {TRAVEL_STATUS_OPTIONS.map((option) => <option key={option} value={option} />)}
                  </datalist>
                  <label className="wide">Motivo<textarea rows={3} value={travelForm.reason} onChange={(event) => setTravelForm((current) => ({ ...current, reason: event.target.value }))} /></label>
                </div>
              </form>
            )}

            {scheduleTab === "contracts" && currentUserCanManageContracts && (
              <>
                <form className="form-panel" onSubmit={saveSupportContract}>
                  <div className="section-header">
                    <h2>{editingContractId ? "Alterar contrato" : "Registrar contrato"}</h2>
                    <div className="actions-row">
                      {editingContractId && <button className="button ghost" type="button" onClick={() => { setEditingContractId(""); setContractForm(EMPTY_CONTRACT_FORM); }}>Cancelar</button>}
                      <button className="icon-button save-action" title="Salvar contrato" aria-label="Salvar contrato"><SaveIcon /></button>
                    </div>
                  </div>
                  <div className="fields-grid">
                    <label>Número de série<input list="contract-serial-suggestions" value={contractForm.serial} onChange={(event) => updateContractSerial(event.target.value)} placeholder="500-xxx ou 500-697/22" maxLength={12} /></label>
                    <datalist id="contract-serial-suggestions">
                      {machines.filter((machine) => machine.serial?.trim()).map((machine) => <option key={machine.id} value={machine.serial ?? ""}>{displayMachineCode(machine)} - {machine.client || "Cliente não informado"}</option>)}
                    </datalist>
                    <label>Máquina vinculada<select value={contractForm.machine_id} onChange={(event) => updateContractMachine(event.target.value)}>
                      <option value="">Selecionar manualmente, se necessário</option>
                      {machines.map((machine) => <option key={machine.id} value={machine.id}>{displayMachineCode(machine)} - {machine.client || "Cliente não informado"}</option>)}
                    </select></label>
                    <label>Código<input value={contractForm.code} onChange={(event) => setContractForm((current) => ({ ...current, code: formatMachineProjectCodeInput(event.target.value) }))} placeholder="T-665 9999" maxLength={10} /></label>
                    <label>Cliente<input list="client-suggestions" value={contractForm.client} onChange={(event) => setContractForm((current) => ({ ...current, client: event.target.value }))} /></label>
                    <label>Status do contrato<select value={contractForm.status} onChange={(event) => setContractForm((current) => ({ ...current, status: event.target.value as ContractStatus }))}>
                      {CONTRACT_STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select></label>
                    <label>Tipo de contrato<select value={contractForm.contract_type} onChange={(event) => setContractForm((current) => ({ ...current, contract_type: event.target.value }))}>
                      <option value="">Selecione</option>
                      {CONTRACT_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select></label>
                    <label>Final de vigência<input value={contractForm.support_contract_until} onChange={(event) => setContractForm((current) => ({ ...current, support_contract_until: formatFullDateInput(event.target.value) }))} placeholder="dd/mm/aaaa" maxLength={10} /></label>
                  </div>
                </form>

                <section className="table-panel">
                  <div className="section-header"><h2>Contratos cadastrados</h2><span>{supportContracts.length} registros</span></div>
                  <div className="table-wrap">
                    <table className="compact-table schedule-table">
                      <thead><tr><th>Código</th><th>Cliente</th><th>Número de série</th><th>Tipo</th><th>Status</th><th>Fim da vigência</th><th>Prazo</th><th>Ações</th></tr></thead>
                      <tbody>{supportContracts.map((contract) => {
                        const remainingDays = daysUntil(contract.support_contract_until);
                        const status = contractStatus(contract);
                        return (
                          <tr key={contract.id}>
                            <td>{contract.code || "-"}</td>
                            <td>{contract.client || "-"}</td>
                            <td>{contract.serial || "-"}</td>
                            <td>{contract.contract_type || "-"}</td>
                            <td><span className={`soft-pill ${status === "Inativo" ? "danger-pill" : status === "Em negociação" ? "warning-pill" : ""}`}>{status}</span></td>
                            <td>{formatDate(contract.support_contract_until)}</td>
                            <td>{remainingDays === null ? "-" : remainingDays >= 0 ? `${remainingDays} dias` : `Vencido há ${Math.abs(remainingDays)} dias`}</td>
                            <td>
                              <div className="row-actions">
                                <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações do contrato ${contract.code || contract.serial || contract.id}`} onClick={(event) => toggleActionMenu(`contract-${contract.id}`, event)}><MoreIcon /></button>
                                {openActionMenu === `contract-${contract.id}` && (
                                  <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                    <button type="button" onClick={() => { editSupportContract(contract); setOpenActionMenu(""); }}><EditIcon /> Alterar contrato</button>
                                    <button className="danger" type="button" onClick={() => { void deleteSupportContract(contract.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {scheduleTab === "travel" && (
            <section className="table-panel">
              <div className="section-header"><h2>Cronograma de viagens</h2><span>{openTravelSchedules.length} registros</span></div>
              <div className="table-wrap">
                <table className="compact-table schedule-table">
                  <thead>
                    <tr>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("start_date")}>Início <span>{sortMark(travelSort.key === "start_date", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("end_date")}>Fim <span>{sortMark(travelSort.key === "end_date", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("code")}>Código <span>{sortMark(travelSort.key === "code", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("client")}>Cliente <span>{sortMark(travelSort.key === "client", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("technicians")}>Técnicos <span>{sortMark(travelSort.key === "technicians", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("status")}>Status <span>{sortMark(travelSort.key === "status", travelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleTravelSort("reason")}>Motivo <span>{sortMark(travelSort.key === "reason", travelSort.direction)}</span></button></th>
                      {currentUserCanEditSchedule && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>{openTravelSchedules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.start_date || "-"}</td>
                      <td>{item.end_date || "-"}</td>
                      <td>{item.code || "-"}</td>
                      <td>{item.client || "-"}</td>
                      <td>{item.technicians || "-"}</td>
                      <td><span className="soft-pill">{item.status || "-"}</span></td>
                      <td>{item.reason || "-"}</td>
                      {currentUserCanEditSchedule && (
                        <td>
                          <div className="row-actions">
                            <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações da viagem ${item.code || item.client || item.id}`} onClick={(event) => toggleActionMenu(`travel-${item.id}`, event)}><MoreIcon /></button>
                            {openActionMenu === `travel-${item.id}` && (
                              <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                <button type="button" onClick={() => { editTravelSchedule(item); setOpenActionMenu(""); }}><EditIcon /> Alterar viagem</button>
                                <button className="danger" type="button" onClick={() => { void deleteTravelSchedule(item.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
            )}

            {scheduleTab === "travel" && (
            <section className="table-panel">
              <div className="section-header"><h2>Viagens concluídas</h2><span>{completedTravelSchedules.length} registros</span></div>
              <div className="table-wrap">
                <table className="compact-table schedule-table">
                  <thead>
                    <tr>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("start_date")}>Início <span>{sortMark(completedTravelSort.key === "start_date", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("end_date")}>Fim <span>{sortMark(completedTravelSort.key === "end_date", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("code")}>Código <span>{sortMark(completedTravelSort.key === "code", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("client")}>Cliente <span>{sortMark(completedTravelSort.key === "client", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("technicians")}>Técnicos <span>{sortMark(completedTravelSort.key === "technicians", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("status")}>Status <span>{sortMark(completedTravelSort.key === "status", completedTravelSort.direction)}</span></button></th>
                      <th><button className="sort-header" type="button" onClick={() => toggleCompletedTravelSort("reason")}>Motivo <span>{sortMark(completedTravelSort.key === "reason", completedTravelSort.direction)}</span></button></th>
                      {currentUserCanEditSchedule && <th>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>{completedTravelSchedules.map((item) => (
                    <tr key={item.id}>
                      <td>{item.start_date || "-"}</td>
                      <td>{item.end_date || "-"}</td>
                      <td>{item.code || "-"}</td>
                      <td>{item.client || "-"}</td>
                      <td>{item.technicians || "-"}</td>
                      <td><span className="soft-pill">{item.status || "-"}</span></td>
                      <td>{item.reason || "-"}</td>
                      {currentUserCanEditSchedule && (
                        <td>
                          <div className="row-actions">
                            <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações da viagem concluída ${item.code || item.client || item.id}`} onClick={(event) => toggleActionMenu(`travel-done-${item.id}`, event)}><MoreIcon /></button>
                            {openActionMenu === `travel-done-${item.id}` && (
                              <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                <button type="button" onClick={() => { editTravelSchedule(item); setOpenActionMenu(""); }}><EditIcon /> Alterar viagem</button>
                                <button className="danger" type="button" onClick={() => { void deleteTravelSchedule(item.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                              </div>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
            )}
          </section>
        )}
    </>
  );
}
