"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { SaveIcon } from "@/components/icons";
import { ServiceDateTimeField } from "@/components/service-datetime-field";
import { SERVICE_TYPE_OPTIONS, ServiceType, View, displayUserName, isServiceDraft, serviceMachineLookupLabel, serviceTechnicianLookupLabel } from "@/lib/app-helpers";
import { AuthorizedUser, Machine, ServiceAttachment, ServiceRecord } from "@/lib/types";
import { ChangeEvent, FormEvent, PointerEvent } from "react";

export type ServiceFormViewProps = {
  addServiceAttachmentFiles: (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  authorizedUsers: AuthorizedUser[];
  clearSignature: () => void;
  closeSignaturePad: () => Promise<void>;
  currentUserEmail: string;
  currentUserId: string;
  currentUserName: string;
  drawSignature: (event: PointerEvent<HTMLCanvasElement>) => void;
  editingServiceRecord: ServiceRecord | null;
  finishSignature: (event?: PointerEvent<HTMLCanvasElement>) => void;
  machines: Machine[];
  openSignaturePad: () => Promise<void>;
  removeServiceAttachment: (id: string) => void;
  saveService: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  selectServiceEmailSuggestion: (email: string) => void;
  serviceAttachments: ServiceAttachment[];
  serviceEmailSuggestions: string[];
  serviceMachineLookupInput: string;
  serviceMachineLookupInvalid: boolean;
  serviceRecipientsInput: string;
  serviceRecipientSuggestionsOpen: boolean;
  serviceType: ServiceType;
  setServiceMachineLookupInput: Dispatch<SetStateAction<string>>;
  setServiceMachineTouched: Dispatch<SetStateAction<boolean>>;
  setServiceRecipientsInput: Dispatch<SetStateAction<string>>;
  setServiceRecipientSuggestionsOpen: Dispatch<SetStateAction<boolean>>;
  setSupportTechniciansInput: Dispatch<SetStateAction<string>>;
  signatureCanvasRef: RefObject<HTMLCanvasElement | null>;
  signatureExpanded: boolean;
  startNewService: (machine?: Machine | null) => void;
  startSignature: (event: PointerEvent<HTMLCanvasElement>) => void;
  supportTechniciansInput: string;
  updateServiceAttachmentCaption: (id: string, caption: string) => void;
  updateServiceType: (value: ServiceType) => void;
  view: View;
};

export function ServiceFormView({
  addServiceAttachmentFiles,
  authorizedUsers,
  clearSignature,
  closeSignaturePad,
  currentUserEmail,
  currentUserId,
  currentUserName,
  drawSignature,
  editingServiceRecord,
  finishSignature,
  machines,
  openSignaturePad,
  removeServiceAttachment,
  saveService,
  selectServiceEmailSuggestion,
  serviceAttachments,
  serviceEmailSuggestions,
  serviceMachineLookupInput,
  serviceMachineLookupInvalid,
  serviceRecipientsInput,
  serviceRecipientSuggestionsOpen,
  serviceType,
  setServiceMachineLookupInput,
  setServiceMachineTouched,
  setServiceRecipientsInput,
  setServiceRecipientSuggestionsOpen,
  setSupportTechniciansInput,
  signatureCanvasRef,
  signatureExpanded,
  startNewService,
  startSignature,
  supportTechniciansInput,
  updateServiceAttachmentCaption,
  updateServiceType,
  view
}: ServiceFormViewProps) {
  return (
    <>
        {view === "service" && (
          <form id="service-record-form" className="form-panel" onSubmit={saveService}>
            <div className="section-header">
              <h2>{editingServiceRecord ? "Editar atendimento" : "Registrar atendimento"}</h2>
            </div>
            <div className="fields-grid">
              <label className={serviceMachineLookupInvalid ? "field-invalid" : ""}>
                Máquina
                <input
                  name="machine_lookup"
                  list="service-machine-suggestions"
                  required
                  placeholder="Código, cliente ou modelo"
                  value={serviceMachineLookupInput}
                  onChange={(event) => {
                    setServiceMachineLookupInput(event.target.value);
                    setServiceMachineTouched(Boolean(event.target.value.trim()));
                  }}
                  onBlur={() => setServiceMachineTouched(true)}
                  aria-invalid={serviceMachineLookupInvalid}
                  aria-describedby={serviceMachineLookupInvalid ? "service-machine-error" : undefined}
                />
                {serviceMachineLookupInvalid && <span id="service-machine-error" className="field-error">Máquina não cadastrada. Selecione uma opção válida das sugestões.</span>}
              </label>
              <datalist id="service-machine-suggestions">{machines.map((machine) => <option key={machine.id} value={serviceMachineLookupLabel(machine)} />)}</datalist>
              <label>Equipamento<input name="equipment" placeholder="CLP, IHM, servo, inversor" defaultValue={editingServiceRecord?.equipment ?? ""} /></label>
              <label>Técnico responsável<input value={editingServiceRecord && editingServiceRecord.created_by !== currentUserId ? editingServiceRecord.technician_name : currentUserName || displayUserName(currentUserEmail)} readOnly /></label>
              <label>
                Demais técnicos
                <input
                  name="support_technicians"
                  list="service-technician-suggestions"
                  placeholder="Nome; outro nome"
                  value={supportTechniciansInput}
                  onChange={(event) => setSupportTechniciansInput(event.target.value)}
                />
              </label>
              <datalist id="service-technician-suggestions">{authorizedUsers.map((user) => <option key={user.id} value={serviceTechnicianLookupLabel(user)} />)}</datalist>
              <label>Início do atendimento<ServiceDateTimeField name="service_start" label="Início do atendimento" initialValue={editingServiceRecord?.service_start} /></label>
              <label>Fim do atendimento<ServiceDateTimeField name="service_end" label="Fim do atendimento" initialValue={editingServiceRecord?.service_end} /></label>
              <label>Tipo de atendimento<select name="service_type" value={serviceType} onChange={(event) => updateServiceType(event.target.value as ServiceType)}>
                {SERVICE_TYPE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select></label>
              {(!editingServiceRecord || isServiceDraft(editingServiceRecord)) && (
                <label className="wide email-suggestion-field">
                  E-mails dos clientes para envio
                  <textarea
                    name="service_recipients"
                    rows={2}
                    placeholder="um@email.com; outro@email.com"
                    value={serviceRecipientsInput}
                    onChange={(event) => {
                      setServiceRecipientsInput(event.target.value);
                      setServiceRecipientSuggestionsOpen(true);
                    }}
                    onFocus={() => setServiceRecipientSuggestionsOpen(true)}
                    onBlur={() => window.setTimeout(() => setServiceRecipientSuggestionsOpen(false), 120)}
                  />
                  {serviceRecipientSuggestionsOpen && serviceEmailSuggestions.length > 0 && (
                    <div className="email-suggestions" role="listbox" aria-label="Sugestões de e-mail">
                      {serviceEmailSuggestions.map((email) => (
                        <button key={email} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => selectServiceEmailSuggestion(email)}>
                          {email}
                        </button>
                      ))}
                    </div>
                  )}
                </label>
              )}
              {serviceType === "Visita técnica" && (
                <label>Cliente / representante<input name="customer_name" placeholder="Nome de quem assinou" defaultValue={editingServiceRecord?.customer_name ?? ""} /></label>
              )}
              <label className="wide">Motivo breve<input name="issue_summary" placeholder="Ex.: Falha no acionamento X" defaultValue={editingServiceRecord?.issue_summary ?? ""} /></label>
              <label className="wide">Solicitação do cliente / problema relatado<textarea name="request" rows={3} required defaultValue={editingServiceRecord?.request ?? ""} /></label>
              <label className="wide">Diagnóstico<textarea name="diagnosis" rows={3} required defaultValue={editingServiceRecord?.diagnosis ?? ""} /></label>
              <label className="wide">Serviço realizado<textarea name="service_done" rows={3} required defaultValue={editingServiceRecord?.service_done ?? ""} /></label>
              <label className="wide">Observações<textarea name="observations" rows={3} defaultValue={editingServiceRecord?.observations ?? ""} /></label>
              <section className="attachment-panel wide">
                <div className="section-header">
                  <div>
                    <h3>Imagens do relatório</h3>
                    <p>Anexe fotos de evidência, componentes, alarmes ou medições. Elas serão incluídas no PDF.</p>
                  </div>
                  <label className="button ghost attachment-upload-button">
                    Anexar imagens
                    <input type="file" accept="image/*" multiple onChange={addServiceAttachmentFiles} />
                  </label>
                </div>
                {serviceAttachments.length > 0 ? (
                  <div className="attachment-grid">
                    {serviceAttachments.map((attachment, index) => (
                      <article className="attachment-card" key={attachment.id}>
                        <img src={attachment.dataUrl} alt={`Imagem ${index + 1} do relatório`} />
                        <input
                          value={attachment.caption ?? ""}
                          onChange={(event) => updateServiceAttachmentCaption(attachment.id, event.target.value)}
                          placeholder={`Legenda da imagem ${index + 1}`}
                          maxLength={120}
                        />
                        <button className="button ghost" type="button" onClick={() => removeServiceAttachment(attachment.id)}>Remover</button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">Nenhuma imagem anexada.</p>
                )}
              </section>
              {serviceType === "Visita técnica" && (
                <section className={`signature-panel wide ${signatureExpanded ? "signature-expanded" : ""}`}>
                  <div className="section-header">
                    <div>
                      <h3>Assinatura do cliente</h3>
                      <p>{signatureExpanded ? "Use a tela horizontal para assinar com mais espaço." : "Assine com mouse, touchpad ou tela touch."}</p>
                    </div>
                    <div className="signature-actions">
                      {!signatureExpanded && <button className="button ghost signature-expand-button" type="button" onClick={() => void openSignaturePad()}>Ampliar assinatura</button>}
                      {signatureExpanded && <button className="button primary" type="button" onClick={() => void closeSignaturePad()}>Concluir</button>}
                      <button className="button ghost" type="button" onClick={clearSignature}>Limpar assinatura</button>
                    </div>
                  </div>
                  <div className="signature-canvas-wrap">
                    <canvas
                      ref={signatureCanvasRef}
                      className="signature-canvas"
                      width={900}
                      height={220}
                      aria-label="Campo para assinatura do cliente"
                      onPointerDown={startSignature}
                      onPointerMove={drawSignature}
                      onPointerUp={finishSignature}
                      onPointerCancel={finishSignature}
                    />
                    <div className="signature-guide" aria-hidden="true">
                      <span>Assine sobre a linha</span>
                    </div>
                  </div>
                </section>
              )}
            </div>
            <div className="service-form-actions">
              {editingServiceRecord && <button className="button ghost" type="button" onClick={() => startNewService()}>Cancelar edição</button>}
              {(!editingServiceRecord || isServiceDraft(editingServiceRecord)) ? (
                <>
                  <button className="button ghost" type="submit" name="report_action" value="draft">Salvar prévia</button>
                  <button className="button primary" type="submit" name="report_action" value="finalize">Finalizar atendimento</button>
                </>
              ) : (
                <button className="icon-button save-action" type="submit" name="report_action" value="update" title="Salvar alterações" aria-label="Salvar alterações"><SaveIcon /></button>
              )}
            </div>
          </form>
        )}
    </>
  );
}
