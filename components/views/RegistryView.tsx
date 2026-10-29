"use client";

import type { Dispatch, SetStateAction } from "react";
import { DetailIcon, EditIcon, MoreIcon, SaveIcon, TrashIcon } from "@/components/icons";
import { ActionMenuPosition, AuthorizedUserFormState, EMPTY_USER_FORM, MachineFormState, REMOTE_ACCESS_OPTIONS, RegistryMachineSortKey, RegistryTab, RemoteAccess, SOFTWARE_OPTIONS, SortDirection, USER_ROLE_OPTIONS, UserSortKey, VM_OPTIONS, View, displayMachineCode, formatDateTime, formatMachineProjectCodeInput, formatMonthYear, formatMonthYearInput, formatPhone, sortMark } from "@/lib/app-helpers";
import { AuthorizedUser, ChatContact, Machine, UserRole } from "@/lib/types";
import { FormEvent, MouseEvent as ReactMouseEvent } from "react";

export type RegistryViewProps = {
  actionMenuPosition: ActionMenuPosition | null;
  citySuggestions: string[];
  clientSuggestions: string[];
  currentUserCanAccessCredentials: boolean;
  currentUserCanEditMachine: boolean;
  currentUserCanManageUsers: boolean;
  currentUserCanUseRemoteAccess: boolean;
  deleteChatContact: (id: string) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  editChatContact: (contact: ChatContact) => void;
  editingMachineId: string;
  editingUserId: string;
  machineForm: MachineFormState;
  machineMainFieldsDisabled: boolean;
  openActionMenu: string;
  registryMachines: Machine[];
  registryMachineSort: { key: RegistryMachineSortKey; direction: SortDirection; };
  registryTab: RegistryTab;
  saveMachine: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  saveUser: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setEditingMachineId: Dispatch<SetStateAction<string>>;
  setEditingUserId: Dispatch<SetStateAction<string>>;
  setOpenActionMenu: Dispatch<SetStateAction<string>>;
  setRegistryTab: Dispatch<SetStateAction<RegistryTab>>;
  setUserForm: Dispatch<SetStateAction<AuthorizedUserFormState>>;
  showRemoteAccess: boolean;
  sortedChatContacts: ChatContact[];
  sortedUsers: AuthorizedUser[];
  toggleActionMenu: (id: string, event: ReactMouseEvent<HTMLButtonElement>) => void;
  toggleRegistryMachineSort: (key: RegistryMachineSortKey) => void;
  toggleUserSort: (key: UserSortKey) => void;
  updateMachineForm: <K extends keyof MachineFormState>(key: K, value: MachineFormState[K]) => void;
  userForm: AuthorizedUserFormState;
  userSort: { key: UserSortKey; direction: SortDirection; };
  view: View;
};

export function RegistryView({
  actionMenuPosition,
  citySuggestions,
  clientSuggestions,
  currentUserCanAccessCredentials,
  currentUserCanEditMachine,
  currentUserCanManageUsers,
  currentUserCanUseRemoteAccess,
  deleteChatContact,
  deleteMachine,
  deleteUser,
  editChatContact,
  editingMachineId,
  editingUserId,
  machineForm,
  machineMainFieldsDisabled,
  openActionMenu,
  registryMachines,
  registryMachineSort,
  registryTab,
  saveMachine,
  saveUser,
  setEditingMachineId,
  setEditingUserId,
  setOpenActionMenu,
  setRegistryTab,
  setUserForm,
  showRemoteAccess,
  sortedChatContacts,
  sortedUsers,
  toggleActionMenu,
  toggleRegistryMachineSort,
  toggleUserSort,
  updateMachineForm,
  userForm,
  userSort,
  view
}: RegistryViewProps) {
  return (
    <>
        {view === "registry" && (
          <section className="view active">
            <section className="table-panel">
              <div className="section-header">
                <h2>Cadastro</h2>
                <div className="segmented-control" aria-label="Tipo de cadastro">
                  {currentUserCanEditMachine && <button className={registryTab === "machines" ? "active" : ""} type="button" onClick={() => setRegistryTab("machines")}><DetailIcon type="software" /> Máquinas</button>}
                  {currentUserCanUseRemoteAccess && <button className={registryTab === "clients" ? "active" : ""} type="button" onClick={() => setRegistryTab("clients")}><DetailIcon type="client" /> Clientes</button>}
                  {currentUserCanManageUsers && <button className={registryTab === "users" ? "active" : ""} type="button" onClick={() => setRegistryTab("users")}><DetailIcon type="client" /> Usuários</button>}
                </div>
              </div>
            </section>

            {registryTab === "machines" && (
              <>
                {currentUserCanEditMachine && (
                <form className="machine-form" onSubmit={saveMachine}>
                  <div className="section-header">
                    <h2>{editingMachineId ? "Alterar máquina" : "Cadastrar máquina"}</h2>
                    <div className="actions-row">
                      {editingMachineId && <button className="button ghost" type="button" onClick={() => setEditingMachineId("")}>Cancelar</button>}
                      <button className="icon-button save-action" title="Salvar máquina" aria-label="Salvar máquina"><SaveIcon /></button>
                    </div>
                  </div>
                  <section className="form-card">
                    <h3>Dados da máquina</h3>
                    <div className="fields-grid">
                      <label>Código<input required disabled={machineMainFieldsDisabled} value={machineForm.code} onChange={(event) => updateMachineForm("code", formatMachineProjectCodeInput(event.target.value))} placeholder="T-665 9999" maxLength={10} /></label>
                      <label>Modelo<input disabled={machineMainFieldsDisabled} value={machineForm.model} onChange={(event) => updateMachineForm("model", event.target.value)} placeholder="Onduladeira, Dryend, ICV..." maxLength={120} /></label>
                      <label className="wide">Descrição<input disabled={machineMainFieldsDisabled} value={machineForm.description} onChange={(event) => updateMachineForm("description", event.target.value)} placeholder="Descrição curta do modelo da máquina" maxLength={160} /></label>
                      <label>Cliente<input disabled={machineMainFieldsDisabled} list="client-suggestions" value={machineForm.client} onChange={(event) => updateMachineForm("client", event.target.value)} placeholder="Nome da empresa" maxLength={160} /></label>
                      <datalist id="client-suggestions">{clientSuggestions.map((client) => <option key={client} value={client} />)}</datalist>
                      <label>Localização<input disabled={machineMainFieldsDisabled} list="city-suggestions" value={machineForm.unit_city} onChange={(event) => updateMachineForm("unit_city", event.target.value)} placeholder="Cidade - UF ou Cidade - PAIS" maxLength={160} /></label>
                      <datalist id="city-suggestions">{citySuggestions.map((city) => <option key={city} value={city} />)}</datalist>
                      <label>Mecânica<input disabled={machineMainFieldsDisabled} value={machineForm.mechanical_list} onChange={(event) => updateMachineForm("mechanical_list", event.target.value)} placeholder="500-xxx ou T-0xxx" maxLength={10} /></label>
                      <label>Código do software<input disabled={machineMainFieldsDisabled} value={machineForm.software_code} onChange={(event) => updateMachineForm("software_code", formatMachineProjectCodeInput(event.target.value))} placeholder="T-665 9999" maxLength={10} /></label>
                      <label>VM<select disabled={machineMainFieldsDisabled} value={machineForm.vm} onChange={(event) => updateMachineForm("vm", event.target.value)}>
                        <option value="">Selecione</option>
                        {machineForm.vm && !VM_OPTIONS.includes(machineForm.vm) && <option value={machineForm.vm}>{machineForm.vm}</option>}
                        {VM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select></label>
                      <label>Faixa de IP<input disabled={machineMainFieldsDisabled} value={machineForm.ip_range} onChange={(event) => updateMachineForm("ip_range", event.target.value)} placeholder="Ex.: 189.1.87.xxx" maxLength={15} /></label>
                      <label>Número de série<input disabled={machineMainFieldsDisabled} value={machineForm.serial} onChange={(event) => updateMachineForm("serial", event.target.value)} placeholder="500-xxx ou 500-697/22" maxLength={12} /></label>
                      <label>Fabricação<input disabled={machineMainFieldsDisabled} value={machineForm.manufacture_month} onChange={(event) => updateMachineForm("manufacture_month", formatMonthYearInput(event.target.value))} placeholder="mm/aaaa" pattern="\d{2}/\d{4}" maxLength={7} /></label>
                      <label>Software<select disabled={machineMainFieldsDisabled} value={machineForm.software_version} onChange={(event) => updateMachineForm("software_version", event.target.value)}>
                        <option value="">Selecione</option>
                        {machineForm.software_version && !SOFTWARE_OPTIONS.includes(machineForm.software_version) && <option value={machineForm.software_version}>{machineForm.software_version}</option>}
                        {SOFTWARE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select></label>
                    </div>
                  </section>

                  <section className="form-card">
                    <h3>Informações de Acesso</h3>
                    <div className="fields-grid">
                      <label>Acesso remoto<select disabled={machineMainFieldsDisabled} value={machineForm.remote_access} onChange={(event) => updateMachineForm("remote_access", event.target.value as RemoteAccess)}>
                        {REMOTE_ACCESS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select></label>
                    </div>

                  {showRemoteAccess && !currentUserCanAccessCredentials && (
                    <p className="empty-state">Seu usuário não tem permissão para visualizar ou alterar credenciais de acesso remoto.</p>
                  )}

                  {showRemoteAccess && currentUserCanAccessCredentials && (
                    <>
                      {machineForm.remote_access === "VNC" && (
                        <div className="fields-grid">
                          <label>IP de acesso<input disabled={machineMainFieldsDisabled} value={machineForm.vnc_ip} onChange={(event) => updateMachineForm("vnc_ip", event.target.value)} placeholder="Ex.: 189.1.87.200/5906" maxLength={21} /></label>
                          <label>Senha<input disabled={machineMainFieldsDisabled} type="text" value={machineForm.vnc_password} onChange={(event) => updateMachineForm("vnc_password", event.target.value)} /></label>
                          <label>Usuário VM<input disabled={machineMainFieldsDisabled} value={machineForm.vnc_user} onChange={(event) => updateMachineForm("vnc_user", event.target.value)} /></label>
                          <label>Senha VM<input disabled={machineMainFieldsDisabled} type="text" value={machineForm.vnc_vm_password} onChange={(event) => updateMachineForm("vnc_vm_password", event.target.value)} /></label>
                          <label className="wide">Observações de acesso<textarea disabled={machineMainFieldsDisabled} rows={3} value={machineForm.vnc_notes} onChange={(event) => updateMachineForm("vnc_notes", event.target.value)} /></label>
                        </div>
                      )}
                      {machineForm.remote_access === "SINEMA" && (
                        <div className="fields-grid">
                          <label>Device Name<input disabled={machineMainFieldsDisabled} value={machineForm.sinema_url} onChange={(event) => updateMachineForm("sinema_url", event.target.value)} /></label>
                          <label>Subnet Name<input disabled={machineMainFieldsDisabled} value={machineForm.sinema_user} onChange={(event) => updateMachineForm("sinema_user", event.target.value)} /></label>
                          <label className="wide">Observações<textarea disabled={machineMainFieldsDisabled} rows={3} value={machineForm.sinema_notes} onChange={(event) => updateMachineForm("sinema_notes", event.target.value)} /></label>
                        </div>
                      )}
                    </>
                  )}
                  </section>
                </form>
                )}

                <section className="table-panel">
                  <div className="section-header"><h2>Máquinas cadastradas</h2><span>{registryMachines.length} registros</span></div>
                  <div className="table-wrap">
                    <table>
                      <thead><tr>
                        <th aria-sort={registryMachineSort.key === "code" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("code")}>Código <span aria-hidden="true">{sortMark(registryMachineSort.key === "code", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "model" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("model")}>Modelo <span aria-hidden="true">{sortMark(registryMachineSort.key === "model", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "client" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("client")}>Cliente <span aria-hidden="true">{sortMark(registryMachineSort.key === "client", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "unit_city" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("unit_city")}>Localização <span aria-hidden="true">{sortMark(registryMachineSort.key === "unit_city", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "vm" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("vm")}>VM <span aria-hidden="true">{sortMark(registryMachineSort.key === "vm", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "manufacture_month" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("manufacture_month")}>Fabricação <span aria-hidden="true">{sortMark(registryMachineSort.key === "manufacture_month", registryMachineSort.direction)}</span></button></th>
                        <th aria-sort={registryMachineSort.key === "remote_access" ? (registryMachineSort.direction === "asc" ? "ascending" : "descending") : "none"}><button className="sort-header" type="button" onClick={() => toggleRegistryMachineSort("remote_access")}>Acesso <span aria-hidden="true">{sortMark(registryMachineSort.key === "remote_access", registryMachineSort.direction)}</span></button></th>
                        <th>Ações</th>
                      </tr></thead>
                      <tbody>{registryMachines.map((machine) => (
                        <tr key={machine.id}>
                          <td>{displayMachineCode(machine)}</td>
                          <td>{machine.model || "-"}</td>
                          <td>{machine.client || "-"}</td>
                          <td>{machine.unit_city || "-"}</td>
                          <td>{machine.vm || "-"}</td>
                          <td>{formatMonthYear(machine.manufacture_month)}</td>
                          <td>{machine.remote_access || machine.access_method || "Sem acesso remoto"}</td>
                          <td>
                            {currentUserCanEditMachine ? <div className="row-actions">
                              <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações da máquina ${displayMachineCode(machine)}`} onClick={(event) => toggleActionMenu(`machine-${machine.id}`, event)}><MoreIcon /></button>
                              {openActionMenu === `machine-${machine.id}` && (
                                <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                  <button type="button" onClick={() => { setEditingMachineId(machine.id); setRegistryTab("machines"); setOpenActionMenu(""); }}><EditIcon /> Alterar cadastro</button>
                                  <button className="danger" type="button" onClick={() => { void deleteMachine(machine.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                                </div>
                              )}
                            </div> : "-"}
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            {registryTab === "clients" && currentUserCanUseRemoteAccess && (
              <section className="table-panel">
                <div className="section-header"><h2>Clientes do Acesso Remoto</h2><span>{sortedChatContacts.length} registros</span></div>
                <div className="table-wrap">
                  <table className="compact-table">
                    <thead><tr><th>Cliente</th><th>Empresa</th><th>Telefone</th><th>Última atualização</th><th>Ações</th></tr></thead>
                    <tbody>{sortedChatContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>{contact.name || "-"}</td>
                        <td>{contact.company || "-"}</td>
                        <td>{contact.phone}</td>
                        <td>{formatDateTime(contact.updated_at)}</td>
                        <td>
                          <div className="row-actions">
                            <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações do cliente ${contact.name || contact.phone}`} onClick={(event) => toggleActionMenu(`contact-${contact.id}`, event)}><MoreIcon /></button>
                            {openActionMenu === `contact-${contact.id}` && (
                              <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                <button type="button" onClick={() => editChatContact(contact)}><EditIcon /> Alterar</button>
                                <button className="danger" type="button" onClick={() => { void deleteChatContact(contact.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                  {!sortedChatContacts.length && <p className="empty-state">Nenhum cliente identificado pelo Acesso Remoto ainda.</p>}
                </div>
              </section>
            )}

            {registryTab === "users" && currentUserCanManageUsers && (
              <>
                <form className="form-panel" onSubmit={saveUser}>
                  <div className="section-header">
                    <h2>{editingUserId ? "Alterar usuário" : "Cadastrar usuário"}</h2>
                    <div className="actions-row">
                      {editingUserId && <button className="button ghost" type="button" onClick={() => { setEditingUserId(""); setUserForm(EMPTY_USER_FORM); }}>Cancelar</button>}
                      <button className="icon-button save-action" title="Salvar usuário" aria-label="Salvar usuário"><SaveIcon /></button>
                    </div>
                  </div>
                  <div className="fields-grid">
                    <label>Usuário<input value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} /></label>
                    <label>E-mail<input value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} type="email" /></label>
                    <label>Telefone<input value={formatPhone(userForm.phone)} onChange={(event) => setUserForm((current) => ({ ...current, phone: formatPhone(event.target.value) }))} placeholder="(45) 99952-6775" inputMode="tel" maxLength={15} /></label>
                    <label>Perfil / Setor<select value={userForm.role} onChange={(event) => setUserForm((current) => ({ ...current, role: event.target.value as UserRole }))}>
                      {userForm.role === "Montagem" && <option value="Montagem">Montagem (legado)</option>}
                      {USER_ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select></label>
                    <label className="checkbox-field"><input type="checkbox" checked={userForm.remote_access_allowed} onChange={(event) => setUserForm((current) => ({ ...current, remote_access_allowed: event.target.checked }))} /> Permitir Acesso Remoto</label>
                    <label className="checkbox-field"><input type="checkbox" checked={userForm.credential_access_allowed} onChange={(event) => setUserForm((current) => ({ ...current, credential_access_allowed: event.target.checked }))} /> Permitir acesso às senhas</label>
                  </div>
                </form>
                <section className="table-panel">
                  <div className="table-wrap">
                    <table className="compact-table">
                      <thead><tr>
                        <th><button className="sort-header" type="button" onClick={() => toggleUserSort("name")}>Usuário <span>{sortMark(userSort.key === "name", userSort.direction)}</span></button></th>
                        <th><button className="sort-header" type="button" onClick={() => toggleUserSort("email")}>E-mail <span>{sortMark(userSort.key === "email", userSort.direction)}</span></button></th>
                        <th>Telefone</th>
                        <th><button className="sort-header" type="button" onClick={() => toggleUserSort("role")}>Perfil / Setor <span>{sortMark(userSort.key === "role", userSort.direction)}</span></button></th>
                        <th>Acesso remoto</th>
                        <th>Senhas</th>
                        <th>Ações</th>
                      </tr></thead>
                      <tbody>{sortedUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{formatPhone(user.phone) || "-"}</td>
                          <td>{user.role}</td>
                          <td>{user.remote_access_allowed ? "Sim" : "Não"}</td>
                          <td>{user.credential_access_allowed ? "Sim" : "Não"}</td>
                          <td>
                            <div className="row-actions">
                              <button className="icon-button menu-trigger" type="button" title="Ações" aria-label={`Ações do usuário ${user.name}`} onClick={(event) => toggleActionMenu(`user-${user.id}`, event)}><MoreIcon /></button>
                              {openActionMenu === `user-${user.id}` && (
                                <div className="row-menu floating-row-menu" style={actionMenuPosition ?? undefined}>
                                  <button type="button" onClick={() => { setEditingUserId(user.id); setUserForm({ name: user.name, email: user.email, role: user.role, phone: formatPhone(user.phone), remote_access_allowed: Boolean(user.remote_access_allowed), credential_access_allowed: Boolean(user.credential_access_allowed) }); setOpenActionMenu(""); }}><EditIcon /> Alterar</button>
                                  <button className="danger" type="button" onClick={() => { void deleteUser(user.id); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
          </section>
        )}
    </>
  );
}
