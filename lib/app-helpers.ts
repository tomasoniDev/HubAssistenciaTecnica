import type { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent } from "react";
import type { AppAdminInfo, AppAuditLog, AuthorizedUser, ChatContact, ChatConversation, ChatMessage, Machine, ServiceAttachment, ServiceRecord, ServiceTechnician, SupportContract, TravelSchedule, UserRole } from "@/lib/types";
import { ALLOWED_EMAIL_DOMAINS, canEditMachine, canEditSchedule, canEmitReports, canManageContracts, canManageUsers, hasFullAccess, isCorporateEmail } from "@/lib/permissions";

// Constantes, tipos e funções puras da interface (extraídos de app/page.tsx).

export type View = "home" | "overview" | "admin" | "machineDetail" | "service" | "registry" | "schedule" | "chat";
export type RegistryMachineSortKey = "code" | "model" | "client" | "unit_city" | "vm" | "manufacture_month" | "remote_access";
export type RegistryTab = "machines" | "users" | "clients";
export type ScheduleTab = "travel" | "contracts";
export type SortDirection = "asc" | "desc";
export type MachineSortKey = "code" | "model" | "client" | "unit_city" | "serial" | "software_version" | "manufacture_month" | "vm" | "last_service";
export type HistorySortKey = "service_date" | "equipment" | "technician_name" | "issue_summary";
export type UserSortKey = "name" | "email" | "role";
export type TravelSortKey = "start_date" | "end_date" | "code" | "client" | "technicians" | "status" | "reason" | "updated_at";
export type RemoteAccess = "SINEMA" | "VNC" | "Sem acesso remoto";
export type ServiceType = "Acesso remoto" | "Visita técnica";
export type ThemeMode = "light" | "dark";
export type ContractType = "Seg-Sex" | "Seg-Sab" | "Garantia";
export type ContractStatus = "Ativo" | "Inativo" | "Em negociação";
export type ActionMenuPosition = { top: number; right: number };
export type RemoteAccessStatus = "Online" | "Offline" | "Ocupado";
export type OnlineTechnician = { email: string; name: string; role?: string | null; status?: RemoteAccessStatus; onlineAt?: string };
export type ServicePreviewState = { machineId: string; record: ServiceRecord; recipients: string[]; pdfUrl: string; finalizeOnSend?: boolean };
export type AppSessionPayload = {
  session?: { userId: string; email: string; expiresAt?: number } | null;
  user?: AuthorizedUser | null;
};
export type AppDataPayload = AppSessionPayload & {
  machines?: Machine[];
  authorizedUsers?: AuthorizedUser[];
  travelSchedules?: TravelSchedule[];
  supportContracts?: SupportContract[];
  chatContacts?: ChatContact[];
  chatConversations?: ChatConversation[];
  adminInfo?: AppAdminInfo | null;
  error?: string;
};
export type LeafletLayerTarget = LeafletMap | LeafletLayerGroup;
export type LeafletMap = {
  fitBounds: (bounds: [number, number][], options?: Record<string, unknown>) => LeafletMap;
  getZoom: () => number;
  hasLayer: (layer: LeafletLayerGroup) => boolean;
  addLayer: (layer: LeafletLayerGroup) => LeafletMap;
  removeLayer: (layer: LeafletLayerGroup) => LeafletMap;
  on: (event: string, handler: () => void) => LeafletMap;
  off: (event: string, handler: () => void) => LeafletMap;
  invalidateSize: () => LeafletMap;
  remove: () => void;
  setView: (center: [number, number], zoom: number) => LeafletMap;
};
export type LeafletLayerGroup = {
  addTo: (map: LeafletMap) => LeafletLayerGroup;
  clearLayers: () => LeafletLayerGroup;
};
export type LeafletMarker = {
  addTo: (target: LeafletLayerTarget) => LeafletMarker;
  bindPopup: (content: string) => LeafletMarker;
};
export type LeafletTileLayer = {
  addTo: (map: LeafletMap) => LeafletTileLayer;
  on: (event: string, handler: () => void) => LeafletTileLayer;
  remove: () => void;
};
export type LeafletNamespace = {
  map: (element: HTMLElement, options?: Record<string, unknown>) => LeafletMap;
  tileLayer: (url: string, options?: Record<string, unknown>) => LeafletTileLayer;
  layerGroup: () => LeafletLayerGroup;
  circleMarker: (center: [number, number], options?: Record<string, unknown>) => LeafletMarker;
};

export type MachineFormState = {
  code: string;
  mechanical_list: string;
  software_code: string;
  ip_range: string;
  vm: string;
  serial: string;
  description: string;
  model: string;
  client: string;
  unit_city: string;
  manufacture_month: string;
  software_version: string;
  remote_access: RemoteAccess;
  vnc_ip: string;
  vnc_user: string;
  vnc_password: string;
  vnc_vm_password: string;
  vnc_notes: string;
  sinema_url: string;
  sinema_user: string;
  sinema_password: string;
  sinema_notes: string;
};

export type AuthorizedUserFormState = {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  remote_access_allowed: boolean;
  credential_access_allowed: boolean;
};

export type ChatContactFormState = {
  name: string;
  company: string;
  phone: string;
};

export type TravelScheduleFormState = {
  start_date: string;
  end_date: string;
  code: string;
  client: string;
  technicians: string;
  status: string;
  reason: string;
};

export type SupportContractFormState = {
  machine_id: string;
  code: string;
  client: string;
  serial: string;
  contract_type: string;
  support_contract_until: string;
  status: ContractStatus;
};

export const DEFAULT_MESSAGE = "Consulte uma máquina pelo código ou selecione uma linha da tabela.";
export const GENERIC_AUTH_MESSAGE = "Não foi possível iniciar o acesso. Verifique o e-mail corporativo e tente novamente.";
export const AUTH_CONFIRMED_AT_KEY = "tomasoni-servicecore-auth-confirmed-at";
export const AUTH_CONFIRMATION_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
export const BIOMETRIC_EMAIL_KEY = "tomasoni-servicecore-biometric-email";
export const BIOMETRIC_CREDENTIAL_KEY = "tomasoni-servicecore-biometric-credential";
export const BIOMETRIC_PROMPT_DISMISSED_KEY = "tomasoni-servicecore-biometric-dismissed";
export const BIOMETRIC_SESSION_VERIFIED_KEY = "tomasoni-servicecore-biometric-session-verified";
export const THEME_KEY = "tomasoni-servicecore-theme";
export const REMOTE_ACCESS_STATUS_KEY = "tomasoni-servicecore-remote-access-status";
export const SERVICE_EMAIL_SUGGESTIONS_KEY = "tomasoni-servicecore-service-email-suggestions";
export const PWA_SW_RELOAD_KEY = "tomasoni-servicecore-sw-reload";
export const MAX_SERVICE_ATTACHMENTS = 6;
export const INTERNAL_SERVICE_REPORT_RECIPIENTS = [
  "comercial@tomasoni.ind.br",
  "celia.bolgenhagen@tomasoni.ind.br",
  "maria.lukaszevski@tomasoni.ind.br",
  "raquel.bordim@tomasoni.ind.br"
];
export const REMOTE_ACCESS_OPTIONS: RemoteAccess[] = ["Sem acesso remoto", "SINEMA", "VNC"];
export const SERVICE_TYPE_OPTIONS: ServiceType[] = ["Acesso remoto", "Visita técnica"];
export const CONTRACT_TYPE_OPTIONS: ContractType[] = ["Seg-Sex", "Seg-Sab", "Garantia"];
export const CONTRACT_STATUS_OPTIONS: ContractStatus[] = ["Ativo", "Em negociação", "Inativo"];
export const SOFTWARE_OPTIONS = [
  ...Array.from({ length: 9 }, (_, index) => `TIA Portal V${index + 13}`),
  ...Array.from({ length: 5 }, (_, index) => `Scout 4.${index + 4}`)
];
export const VM_OPTIONS = Array.from({ length: 9 }, (_, index) => `V${index + 13}`);
export const USER_ROLE_OPTIONS: UserRole[] = ["Admin", "Diretoria", "Coordenador", "Engenharia", "Montagem Elétrica", "Montagem Mecânica", "Controladoria", "Comercial"];
export const TRAVEL_STATUS_OPTIONS = ["A definir", "Planejado", "Em andamento", "Concluido", "Cancelado"];
export const TRAVEL_CODE_PATTERN = /^C\d{3}$/;
export const STATE_CENTERS: Record<string, [number, number]> = {
  AC: [-9.0238, -70.812],
  AL: [-9.5713, -36.782],
  AP: [1.3545, -51.916],
  AM: [-3.4168, -65.856],
  BA: [-12.5797, -41.7007],
  CE: [-5.4984, -39.3206],
  DF: [-15.7998, -47.8645],
  ES: [-19.1834, -40.3089],
  GO: [-15.827, -49.8362],
  MA: [-5.42, -45.44],
  MT: [-12.6819, -56.9211],
  MS: [-20.7722, -54.7852],
  MG: [-18.5122, -44.555],
  PA: [-3.79, -52.48],
  PB: [-7.24, -36.78],
  PR: [-24.89, -51.55],
  PE: [-8.38, -37.86],
  PI: [-6.6, -42.28],
  RJ: [-22.25, -42.66],
  RN: [-5.81, -36.59],
  RS: [-30.17, -53.5],
  RO: [-10.83, -63.34],
  RR: [2.05, -61.39],
  SC: [-27.33, -50.48],
  SP: [-22.19, -48.79],
  SE: [-10.57, -37.45],
  TO: [-10.25, -48.25]
};

export function mapPointPosition(center: [number, number]) {
  const [lat, lon] = center;
  const left = Math.min(92, Math.max(8, ((lon + 74) / 40) * 100));
  const top = Math.min(92, Math.max(8, ((6 - lat) / 40) * 100));
  return { left: `${left}%`, top: `${top}%` };
}
export const EMPTY_MACHINE_FORM: MachineFormState = {
  code: "",
  mechanical_list: "",
  software_code: "",
  ip_range: "",
  vm: "",
  serial: "",
  description: "",
  model: "",
  client: "",
  unit_city: "",
  manufacture_month: "",
  software_version: "",
  remote_access: "Sem acesso remoto",
  vnc_ip: "",
  vnc_user: "",
  vnc_password: "",
  vnc_vm_password: "",
  vnc_notes: "",
  sinema_url: "",
  sinema_user: "",
  sinema_password: "",
  sinema_notes: ""
};
export const EMPTY_USER_FORM: AuthorizedUserFormState = {
  name: "",
  email: "",
  role: "Montagem Elétrica",
  phone: "",
  remote_access_allowed: false,
  credential_access_allowed: false
};
export const EMPTY_CHAT_CONTACT_FORM: ChatContactFormState = {
  name: "",
  company: "",
  phone: ""
};
export const EMPTY_TRAVEL_FORM: TravelScheduleFormState = {
  start_date: "",
  end_date: "",
  code: "",
  client: "",
  technicians: "",
  status: "A definir",
  reason: ""
};
export const EMPTY_CONTRACT_FORM: SupportContractFormState = {
  machine_id: "",
  code: "",
  client: "",
  serial: "",
  contract_type: "",
  support_contract_until: "",
  status: "Ativo"
};
export const MACHINE_SAFE_SELECT = `
  id,
  code,
  model,
  client,
  unit_city,
  serial,
  description,
  manufacture_month,
  mechanical_list,
  software_code,
  ip_range,
  vm,
  software_version,
  access_method,
  remote_access,
  support_contract_active,
  support_contract_type,
  support_contract_until,
  created_at,
  updated_at,
  machine_emails(*),
  service_records(*)
`;
export const EMPTY_MACHINE_CREDENTIALS = {
  vnc_ip: null,
  vnc_user: null,
  vnc_password: null,
  vnc_vm_password: null,
  vnc_notes: null,
  sinema_url: null,
  sinema_user: null,
  sinema_password: null,
  sinema_notes: null
};

export async function apiRequest<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const data = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (!response.ok) {
    throw new Error(data?.error ?? "Não foi possível concluir a operação.");
  }
  return data as T;
}

export async function appAction<T>(action: string, payload: Record<string, unknown> = {}) {
  return apiRequest<{ data?: T; ok?: boolean; backup?: unknown }>("/api/app-action", {
    method: "POST",
    body: JSON.stringify({ action, payload })
  });
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatPhone(value?: string | null) {
  const digits = onlyDigits(String(value ?? "")).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatFullDateInput(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatDayMonthInput(value: string) {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatTravelClientCodeInput(value: string) {
  const digits = onlyDigits(value).slice(0, 3);
  if (!digits && !value.trim()) return "";
  return `C${digits}`;
}

export function formatMachineProjectCodeInput(value: string) {
  const digits = onlyDigits(value);
  const suffix = (digits.startsWith("665") ? digits.slice(3) : digits).slice(0, 4);
  if (!suffix && !value.trim()) return "";
  return `T-665 ${suffix}`;
}

export function formatServiceDateTimeInput(value: string) {
  const digits = onlyDigits(value).slice(0, 10);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  if (digits.length <= 6) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)} - ${digits.slice(6)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)} - ${digits.slice(6, 8)}:${digits.slice(8)}`;
}

export function formatMonthYearInput(value: string) {
  const digits = onlyDigits(value).slice(0, 6);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function normalizeFullDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export function extractDateFromServiceDateTime(value: string) {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})(?:\s*-\s*\d{2}:\d{2})?$/);
  if (!match) return "";
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2]}-${match[1]}`;
}

export function daysUntil(value?: string | null) {
  if (!value) return null;
  const today = new Date();
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

export function addDays(value?: string | null, days = 0) {
  if (!value) return "";
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return "";
  target.setDate(target.getDate() + days);
  return target.toISOString().slice(0, 10);
}

export function secretRotationStatus(days: number | null) {
  if (days === null) return "warning";
  if (days < 0) return "danger";
  if (days <= 30) return "warning";
  return "success";
}

export function secretRotationMessage(days: number | null) {
  if (days === null) return "Configure a data da última troca para ativar o acompanhamento.";
  if (days < 0) return `Troca vencida há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}.`;
  if (days === 0) return "Troca vence hoje.";
  return `Faltam ${days} dia${days === 1 ? "" : "s"} para a próxima troca.`;
}

export function formatMonthYear(value?: string | null) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  const shortMatch = value.match(/^(\d{2})\/(\d{2})$/);
  if (shortMatch) return `${shortMatch[1]}/20${shortMatch[2]}`;
  if (/^\d{2}\/\d{4}$/.test(value)) return value;
  if (!year || !month) return value;
  return `${month}/${year}`;
}

export function monthYearSortValue(value?: string | null) {
  const formatted = formatMonthYear(value);
  const match = formatted.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[2]) * 100 + Number(match[1]);
}

export function normalizeMonthYear(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const shortMatch = trimmed.match(/^(\d{2})\/(\d{2})$/);
  if (shortMatch) return `${shortMatch[1]}/20${shortMatch[2]}`;
  const match = trimmed.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return trimmed;
  return `${match[1]}/${match[2]}`;
}

export function machineHasRemoteAccess(remoteAccess: string) {
  return remoteAccess !== "Sem acesso remoto";
}

export function normalizeRemoteAccess(value?: string | null): RemoteAccess {
  if (value === "SINEMA" || value === "VNC") return value;
  return "Sem acesso remoto";
}

export function normalizeServiceType(value?: string | null): ServiceType {
  if (value === "Visita técnica") return "Visita técnica";
  return "Acesso remoto";
}

export function displayMachineCode(machine?: Pick<Machine, "code" | "model" | "client"> | null) {
  return machine?.code?.trim() || machine?.model?.trim() || machine?.client?.trim() || "Máquina sem código";
}

export function normalizeLookup(value?: string | null) {
  return value?.trim().toUpperCase() ?? "";
}

export function serviceMachineLookupLabel(machine?: Machine | null) {
  if (!machine) return "";
  const code = displayMachineCode(machine);
  const details = [machine.client, machine.model]
    .map((item) => item?.trim())
    .filter(Boolean)
    .join(" - ");
  return details ? `${code} - ${details}` : code;
}

export function serviceTechnicianLookupLabel(user: AuthorizedUser) {
  const details = [user.email, user.role].filter(Boolean).join(" - ");
  return details ? `${user.name} - ${details}` : user.name;
}

export function isAssemblyRole(role?: string | null) {
  return String(role ?? "").trim().toLowerCase().startsWith("montagem");
}

export function normalizeLookupText(value?: string | null) {
  return value?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? "";
}

export function findMachineByLookup(machines: Machine[], value: string) {
  const target = normalizeLookupText(value);
  if (!target) return null;

  return machines.find((machine) => {
    const candidates = [
      machine.id,
      machine.code,
      displayMachineCode(machine),
      serviceMachineLookupLabel(machine),
      machine.code && machine.client ? `${machine.code} - ${machine.client}` : "",
      machine.code && machine.model ? `${machine.code} - ${machine.model}` : ""
    ];
    return candidates.some((candidate) => normalizeLookupText(candidate) === target);
  }) ?? null;
}

export function parseServiceTechnicianInput(value: string, users: AuthorizedUser[]) {
  const seen = new Set<string>();
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item): ServiceTechnician => {
      const normalized = normalizeLookupText(item);
      const user = users.find((candidate) => {
        const candidates = [candidate.name, candidate.email, serviceTechnicianLookupLabel(candidate)];
        return candidates.some((candidateValue) => normalizeLookupText(candidateValue) === normalized);
      });
      if (user) return { id: user.id, name: user.name, email: user.email, role: user.role };
      return { name: item, email: null, role: null };
    })
    .filter((technician) => {
      const key = normalizeLookupText(technician.email || technician.name);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatServiceTechniciansInput(technicians?: ServiceTechnician[] | null) {
  return (technicians ?? []).map((technician) => technician.name).filter(Boolean).join("; ");
}

export function serviceRecordWithTechnicianRole(record: ServiceRecord, users: AuthorizedUser[]) {
  if (record.technician_role) return record;
  const technicianEmail = normalizeLookupText(record.technician_email);
  if (!technicianEmail) return record;
  const technician = users.find((user) => normalizeLookupText(user.email) === technicianEmail);
  return technician?.role ? { ...record, technician_role: technician.role } : record;
}

export function contractMatchesMachine(contract: SupportContract, machine: Machine) {
  const contractSerial = normalizeLookup(contract.serial);
  const machineSerial = normalizeLookup(machine.serial);
  if (contractSerial && machineSerial && contractSerial === machineSerial) return true;
  if (contract.machine_id && contract.machine_id === machine.id) return true;
  const contractCode = normalizeLookup(contract.code);
  const machineCode = normalizeLookup(machine.code);
  return Boolean(contractCode && machineCode && contractCode === machineCode);
}

export function contractStatus(contract?: SupportContract | null): ContractStatus {
  if (!contract) return "Inativo";
  if (contract.status === "Ativo" || contract.status === "Inativo" || contract.status === "Em negociação") {
    return contract.status;
  }
  return contract.active ? "Ativo" : "Inativo";
}

export function isActiveContract(contract?: SupportContract | null) {
  return contractStatus(contract) === "Ativo";
}

export function isNegotiatingContract(contract?: SupportContract | null) {
  return contractStatus(contract) === "Em negociação";
}

export function sortContractsByRelevance(a: SupportContract, b: SupportContract) {
  const statusWeight: Record<ContractStatus, number> = { "Ativo": 3, "Em negociação": 2, "Inativo": 1 };
  const statusDiff = statusWeight[contractStatus(b)] - statusWeight[contractStatus(a)];
  if (statusDiff) return statusDiff;
  return compareDate(b.support_contract_until, a.support_contract_until);
}

export function latestContractForMachine(contracts: SupportContract[], machine?: Machine | null) {
  if (!machine) return undefined;
  return contracts.filter((contract) => contractMatchesMachine(contract, machine)).sort(sortContractsByRelevance)[0];
}

export function machineFormFromMachine(machine?: Machine | null): MachineFormState {
  if (!machine) return EMPTY_MACHINE_FORM;
  return {
    code: machine.code ?? "",
    mechanical_list: machine.mechanical_list ?? "",
    software_code: machine.software_code ?? "",
    ip_range: machine.ip_range ?? "",
    vm: machine.vm ?? "",
    serial: machine.serial ?? "",
    description: (machine.description ?? "").slice(0, 160),
    model: machine.model ?? "",
    client: machine.client ?? "",
    unit_city: machine.unit_city ?? "",
    manufacture_month: formatMonthYear(machine.manufacture_month) === "-" ? "" : formatMonthYear(machine.manufacture_month),
    software_version: machine.software_version ?? "",
    remote_access: normalizeRemoteAccess(machine.remote_access ?? machine.access_method),
    vnc_ip: machine.vnc_ip ?? "",
    vnc_user: machine.vnc_user ?? "",
    vnc_password: machine.vnc_password ?? "",
    vnc_vm_password: machine.vnc_vm_password ?? "",
    vnc_notes: machine.vnc_notes ?? "",
    sinema_url: machine.sinema_url ?? "",
    sinema_user: machine.sinema_user ?? "",
    sinema_password: machine.sinema_password ?? "",
    sinema_notes: machine.sinema_notes ?? ""
  };
}

export function parseEmails(value: string) {
  return value
    .split(/[;,\n]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function uniqueValidEmails(emails: (string | null | undefined)[]) {
  const seen = new Set<string>();
  return emails
    .map((email) => String(email ?? "").trim().toLowerCase())
    .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    .filter((email) => {
      if (seen.has(email)) return false;
      seen.add(email);
      return true;
    });
}

export function serviceReportRecipients(clientRecipients: string[], technicianEmail?: string | null) {
  return uniqueValidEmails([...clientRecipients, ...INTERNAL_SERVICE_REPORT_RECIPIENTS, technicianEmail]);
}

export function clientServiceRecipients(recipients: string[], technicianEmail?: string | null) {
  const automaticRecipients = new Set(serviceReportRecipients([], technicianEmail));
  return uniqueValidEmails(recipients).filter((email) => !automaticRecipients.has(email));
}

export function serviceEmailSubjectDate(record: ServiceRecord) {
  const startDate = extractDateFromServiceDateTime(record.service_start ?? "");
  return formatDate(startDate || record.service_date);
}

export function serviceEmailSubject(machine: Machine, record: ServiceRecord) {
  return [
    "Relatório de atendimento",
    machine.client || "Cliente não informado",
    serviceEmailSubjectDate(record),
    machine.model || displayMachineCode(machine)
  ].join(" - ");
}

export function serviceEmailTechnicians(record: ServiceRecord) {
  const seen = new Set<string>();
  return [
    record.technician_name,
    ...(record.support_technicians ?? []).map((technician) => technician?.name)
  ]
    .map((name) => String(name ?? "").trim())
    .filter(Boolean)
    .filter((name) => {
      const key = normalizeLookupText(name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function serviceEmailMessage(machine: Machine, record: ServiceRecord) {
  const model = machine.model || displayMachineCode(machine);
  const client = machine.client || "cliente não informado";
  const unitCity = machine.unit_city || "unidade/cidade não informada";
  const start = record.service_start || formatDate(record.service_date);
  const end = record.service_end || "-";
  const equipment = record.equipment || "-";
  const machineCode = displayMachineCode(machine);
  const serial = machine.serial || "-";
  const technicians = serviceEmailTechnicians(record);
  const techniciansLabel = technicians.length > 1 ? "Técnicos" : "Técnico";
  const techniciansValue = technicians.join("; ") || "-";
  const serviceType = record.service_type || "-";
  const mainMessage = `Relatório de atendimento técnico ao ${model} da ${client}, ${unitCity}, de ${start} a ${end}.`;
  const text = `${mainMessage}\n\nEquipamento: ${equipment}\nCódigo da máquina: ${machineCode}\nNúmero de série: ${serial}\n${techniciansLabel}: ${techniciansValue}\nTipo: ${serviceType}\n\n\nMensagem automática. Não responda este e-mail.\n\nO relatório de atendimento segue em anexo.`;
  const html = `<p>${escapeHtml(mainMessage)}</p><p><strong>Equipamento:</strong> ${escapeHtml(equipment)}<br/><strong>Código da máquina:</strong> ${escapeHtml(machineCode)}<br/><strong>Número de série:</strong> ${escapeHtml(serial)}<br/><strong>${techniciansLabel}:</strong> ${escapeHtml(techniciansValue)}<br/><strong>Tipo:</strong> ${escapeHtml(serviceType)}</p><p style="margin-top: 28px;">Mensagem automática. Não responda este e-mail.</p><p>O relatório de atendimento segue em anexo.</p>`;
  return { text, html };
}

export function serviceReportStatus(record: ServiceRecord) {
  return record.report_status === "Rascunho" ? "Rascunho" : "Finalizado";
}

export function isServiceDraft(record: ServiceRecord) {
  return serviceReportStatus(record) === "Rascunho";
}

export function finalizedServiceRecords(machine?: Machine | null) {
  return (machine?.service_records ?? []).filter((record) => !isServiceDraft(record));
}

export function lastServiceDate(machine: Machine) {
  const dates = finalizedServiceRecords(machine).map((record) => record.service_date).filter(Boolean);
  return dates.sort().at(-1) ?? "";
}

export function daysSince(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - target.getTime()) / 86400000);
}

export function monthKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${month}/${year.slice(-2)}`;
}

export function addMonths(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function locationState(value?: string | null) {
  const text = value?.trim();
  if (!text) return "Sem localização";
  const match = text.match(/(?:-|\/)\s*([A-Za-z]{2})\s*$/);
  return match ? match[1].toUpperCase() : "Sem UF";
}

export function locationCity(value?: string | null) {
  const text = value?.trim();
  if (!text) return "";
  const match = text.match(/^(.+?)(?:\s*[-/]\s*)[A-Za-z]{2}\s*$/);
  return (match?.[1] ?? text).trim();
}

export function percent(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function compareText(first?: string | null, second?: string | null) {
  return (first ?? "").localeCompare(second ?? "", "pt-BR", { numeric: true, sensitivity: "base" });
}

export function compareDate(first?: string | null, second?: string | null) {
  return (first ?? "").localeCompare(second ?? "");
}

export function normalizeStatus(value?: string | null) {
  return value?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() ?? "";
}

export function isCompletedTravel(item: TravelSchedule) {
  return normalizeStatus(item.status) === "concluido";
}

export function dayMonthOrderValue(value?: string | null, fallback = Number.MAX_SAFE_INTEGER) {
  const normalized = value?.trim() ?? "";
  const match = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return fallback;
  return Number(match[2]) * 100 + Number(match[1]);
}

export function compareTravelValue(first: TravelSchedule, second: TravelSchedule, key: TravelSortKey) {
  if (key === "start_date" || key === "end_date") {
    return dayMonthOrderValue(first[key]) - dayMonthOrderValue(second[key]);
  }
  if (key === "updated_at") {
    return compareDate(first.updated_at || first.created_at, second.updated_at || second.created_at);
  }
  return compareText(String(first[key] ?? ""), String(second[key] ?? ""));
}

export function compareTravelBySort(first: TravelSchedule, second: TravelSchedule, sort: { key: TravelSortKey; direction: SortDirection }) {
  const result = compareTravelValue(first, second, sort.key);
  return sort.direction === "asc" ? result : -result;
}

export function nextDirection(isSameColumn: boolean, currentDirection: SortDirection) {
  return isSameColumn && currentDirection === "asc" ? "desc" : "asc";
}

export function sortMark(isActive: boolean, direction: SortDirection) {
  if (!isActive) return "↕";
  return direction === "asc" ? "↑" : "↓";
}

export function hasFreshAuthConfirmation() {
  const confirmedAt = Number(window.localStorage.getItem(AUTH_CONFIRMED_AT_KEY) ?? 0);
  return Boolean(confirmedAt) && Date.now() - confirmedAt < AUTH_CONFIRMATION_INTERVAL_MS;
}

export function storeAuthConfirmation() {
  window.localStorage.setItem(AUTH_CONFIRMED_AT_KEY, String(Date.now()));
}

export function clearAuthConfirmation() {
  window.localStorage.removeItem(AUTH_CONFIRMED_AT_KEY);
}

export function bufferToBase64Url(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function base64UrlToBuffer(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

export function canUseWebAuthn() {
  return typeof window !== "undefined" && Boolean(window.PublicKeyCredential && navigator.credentials);
}

export function isMobileAuthDevice() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 760px), ((pointer: coarse) and (max-width: 1024px))").matches;
}

export function hasBiometricEnabledFor(email: string) {
  return Boolean(
    email
    && window.localStorage.getItem(BIOMETRIC_EMAIL_KEY) === email
    && window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY)
    && canUseWebAuthn()
  );
}

export function hasBiometricVerifiedThisOpen(email: string) {
  return window.sessionStorage.getItem(BIOMETRIC_SESSION_VERIFIED_KEY) === email;
}

export function storeBiometricVerifiedThisOpen(email: string) {
  window.sessionStorage.setItem(BIOMETRIC_SESSION_VERIFIED_KEY, email);
}

export function clearBiometricVerifiedThisOpen() {
  window.sessionStorage.removeItem(BIOMETRIC_SESSION_VERIFIED_KEY);
}

export function validateCodePattern(value: string, pattern: RegExp, label: string) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) return "";
  return pattern.test(normalized) ? "" : `${label} deve estar no padrão esperado ou ficar vazio.`;
}

export function validateDayMonth(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized || normalized.toLowerCase() === "a definir") return "";
  const match = normalized.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return `${label} deve estar no formato dd/mm.`;
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return `${label} possui mês inválido.`;
  const maxDay = new Date(2024, month, 0).getDate();
  if (day < 1 || day > maxDay) return `${label} possui dia inválido para o mês informado.`;
  return "";
}

export function validateServiceDateTime(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  if (/^\d{2}\/\d{2}$/.test(normalized)) return validateDayMonth(normalized, label);
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?$/);
  if (!match) return `${label} deve estar no formato dd/mm/aa ou dd/mm/aa - hh:mm.`;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);
  const hour = match[4] ? Number(match[4]) : null;
  const minute = match[5] ? Number(match[5]) : null;
  if (month < 1 || month > 12) return `${label} possui mês inválido.`;
  if (year < 2000 || year > 2099) return `${label} possui ano inválido.`;
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return `${label} possui dia inválido para o mês informado.`;
  if (hour !== null && (hour < 0 || hour > 23)) return `${label} possui hora inválida.`;
  if (minute !== null && (minute < 0 || minute > 59)) return `${label} possui minuto inválido.`;
  return "";
}

export function validateFullDate(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return `${label} deve estar no formato dd/mm/aaaa.`;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return `${label} possui mês inválido.`;
  if (year < 1900 || year > 2099) return `${label} possui ano inválido.`;
  const maxDay = new Date(year, month, 0).getDate();
  if (day < 1 || day > maxDay) return `${label} possui dia inválido para o mês informado.`;
  return "";
}

export function validateMonthYear(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) return "";
  const match = normalized.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return `${label} deve estar no formato mm/aaaa.`;
  const month = Number(match[1]);
  if (month < 1 || month > 12) return `${label} possui mês inválido.`;
  return "";
}

export function isValidIpv4Octet(value: string) {
  if (!/^\d{1,3}$/.test(value)) return false;
  const number = Number(value);
  return number >= 0 && number <= 255;
}

export function validateIpv4Like(value: string, label: string, options: { allowWildcard?: boolean; allowPort?: boolean } = {}) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  const [address, suffix] = normalized.split(/[/:]/);
  const separatorMatch = normalized.match(/[/:]/);
  if (suffix && (!options.allowPort || !/^\d{1,5}$/.test(suffix) || Number(suffix) < 1 || Number(suffix) > 65535)) {
    return `${label} possui porta inválida.`;
  }
  if (!suffix && separatorMatch) return `${label} possui formato de IP inválido.`;
  const octets = address.split(".");
  if (octets.length !== 4) return `${label} deve estar no formato IPv4, como 189.1.87.xxx ou 189.1.87.200.`;
  const valid = octets.every((octet, index) => {
    if (options.allowWildcard && index >= 2 && (/^x{1,3}$/.test(octet) || octet === "*")) return true;
    return isValidIpv4Octet(octet);
  });
  return valid ? "" : `${label} possui IPv4 inválido.`;
}

let leafletLoadPromise: Promise<LeafletNamespace> | null = null;

export function loadLeaflet() {
  if (typeof window === "undefined") return Promise.reject(new Error("Mapa indisponível fora do navegador."));
  const existingLeaflet = (window as unknown as { L?: LeafletNamespace }).L;
  if (existingLeaflet) return Promise.resolve(existingLeaflet);

  if (!leafletLoadPromise) {
    leafletLoadPromise = import("leaflet").then((module) => {
      const leaflet = (module.default ?? module) as unknown as LeafletNamespace;
      (window as unknown as { L?: LeafletNamespace }).L = leaflet;
      return leaflet;
    });
  }

  return leafletLoadPromise;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  }[character] ?? character));
}

export async function geocodeCity(city: string, state: string) {
  if (!city || !STATE_CENTERS[state]) return null;
  const cacheKey = `tomasoni-map-city:${city.toLowerCase()}-${state.toLowerCase()}`;
  const cached = window.localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as [number, number];
      if (Array.isArray(parsed) && parsed.length === 2) return parsed;
    } catch {
      window.localStorage.removeItem(cacheKey);
    }
  }

  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(`${city}, ${state}, Brasil`)}`);
  if (!response.ok) return null;
  const result = await response.json() as Array<{ lat?: string; lon?: string }>;
  const first = result[0];
  if (!first?.lat || !first?.lon) return null;
  const point: [number, number] = [Number(first.lat), Number(first.lon)];
  if (Number.isNaN(point[0]) || Number.isNaN(point[1])) return null;
  window.localStorage.setItem(cacheKey, JSON.stringify(point));
  return point;
}

export function describeAuthError(error: unknown) {
  if (!error) return "erro não informado pelo Supabase.";
  if (typeof error === "string") return error || "erro não informado pelo Supabase.";
  if (error instanceof Error) {
    return [error.name, error.message].filter(Boolean).join(": ") || "erro não informado pelo Supabase.";
  }

  try {
    const entries = Object.entries(error as Record<string, unknown>)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
    return entries.length ? entries.join(" | ") : JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function authMessage(error: unknown) {
  const detail = describeAuthError(error);
  const normalized = detail.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "Código inválido ou expirado.";
  if (normalized.includes("failed to fetch") || normalized.includes("network")) return "Falha de conexão. Verifique a internet e tente novamente.";
  if (normalized.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (normalized.includes("user already registered")) return "Usuário já cadastrado.";
  if (normalized.includes("signup is disabled")) return "O cadastro de novos usuários está desativado no Supabase.";
  if (normalized.includes("rate limit") || normalized.includes("over_email_send_rate_limit") || normalized.includes("too many requests")) return "Limite temporário de envio de e-mails atingido. Aguarde alguns minutos e tente novamente.";
  if (normalized.includes("smtp") || normalized.includes("email provider") || normalized.includes("send email")) return `Falha no envio do e-mail pelo provedor SMTP. Detalhe: ${detail}`;
  if (normalized.includes("for security purposes")) return "Aguarde alguns segundos antes de solicitar um novo envio.";
  if (normalized.includes("otp") || normalized.includes("token")) return "Código inválido ou expirado. Solicite um novo código e tente novamente.";
  return `Não foi possível concluir a autenticação. Detalhe: ${detail}`;
}

export function dataMessage(error: string) {
  const normalized = error.toLowerCase();
  if (normalized.includes("status") && normalized.includes("schema cache")) return "A coluna de status dos contratos ainda não foi reconhecida pela API do Supabase. Aplique a migration 022_refresh_support_contract_status_schema.sql e tente novamente.";
  if (normalized.includes("support_contracts") || normalized.includes("relation") || normalized.includes("schema cache")) return "Estrutura de contratos não encontrada no Supabase. Aplique as migrations 020_support_contracts_permissions.sql, 021_add_support_contract_status.sql e 022_refresh_support_contract_status_schema.sql e tente novamente.";
  if (normalized.includes("support_contracts_status_check")) return "Status de contrato inválido no banco. Aplique a migration 022_refresh_support_contract_status_schema.sql e tente novamente.";
  if (normalized.includes("duplicate") || normalized.includes("unique")) return "Já existe um cadastro com estes dados.";
  if (normalized.includes("permission") || normalized.includes("row-level security")) return "Seu usuário não tem permissão para executar esta ação.";
  if (normalized.includes("network") || normalized.includes("fetch")) return "Falha de conexão. Verifique a internet e tente novamente.";
  return "Não foi possível concluir a operação. Revise os dados e tente novamente.";
}

export function screenLegend(view: View, registryTab: RegistryTab, selectedMachine?: Machine) {
  if (view === "home") return "Consulte uma máquina pelo código ou selecione uma linha da tabela.";
  if (view === "overview") return "Visão geral da base instalada, contratos, acessos e atendimentos registrados.";
  if (view === "admin") return "Monitore atualizações, deploys, migrations e ações registradas no sistema.";
  if (view === "chat") return "Acesso Remoto: receba, assuma, transfira e encerre conversas.";
  if (view === "machineDetail") return selectedMachine ? `Dados cadastrais e histórico da máquina ${displayMachineCode(selectedMachine)}.` : "Dados cadastrais e histórico da máquina.";
  if (view === "service") return "Registre um novo atendimento técnico e gere o relatório em PDF.";
  if (view === "schedule") return "Acompanhe o cronograma de viagens e atendimentos planejados.";
  if (registryTab === "machines") return "Cadastre, altere ou exclua máquinas e informações de acesso.";
  if (registryTab === "clients") return "Consulte e ajuste clientes identificados pelo Acesso Remoto.";
  return "Cadastre e gerencie os usuários autorizados a acessar o sistema.";
}

export function helpText(view: View, registryTab: RegistryTab) {
  if (view === "home") return "Use o filtro para localizar uma máquina por código, modelo, cliente ou localização. Clique no código da máquina para abrir os dados cadastrais e o histórico de atendimentos.";
  if (view === "overview") return "A visão geral consolida indicadores da base cadastrada, contratos, acesso remoto, localização e volume de atendimentos. Use os rankings para localizar máquinas, clientes e regiões que merecem atenção.";
  if (view === "admin") return "A tela administrativa concentra informações técnicas do app e a trilha de auditoria das operações feitas pelos usuários. O acesso fica restrito aos perfis Admin e Diretoria.";
  if (view === "chat") return "Use a tela de Acesso Remoto para validar atendimentos recebidos pelo WhatsApp. Conversas podem ser assumidas por usuários Online, transferidas e encerradas com histórico salvo.";
  if (view === "machineDetail") return "Nesta tela ficam os dados técnicos da máquina, informações de acesso remoto e histórico. Clique em um atendimento para ver o registro completo ou use o menu de ações para baixar o PDF.";
  if (view === "service") return "Registre o atendimento com tipo, motivo breve e descrições completas. Em visita técnica, colete a assinatura do cliente para incluir no PDF.";
  if (view === "schedule") return "Use o cronograma para planejar viagens, técnicos envolvidos, cliente, código, status e motivo. Datas podem ser dd/mm ou A definir.";
  if (registryTab === "machines") return "Cadastre ou altere máquinas e informações de acesso. Use o menu de ações da tabela para editar ou excluir cadastros.";
  if (registryTab === "clients") return "Use esta lista para corrigir nome, empresa e telefone dos contatos que abriram chamados pelo Acesso Remoto.";
  return "Cadastre usuários autorizados. O perfil define permissões de cadastro, cronograma, contratos, histórico e relatórios.";
}

export function helpSections(view: View, registryTab: RegistryTab) {
  if (view === "overview") {
    return [
      ["KPIs superiores", "Resumo rápido da base: máquinas cadastradas, atendimentos do mês, contratos, cobertura remota e máquinas que pedem atenção."],
      ["Tendência de atendimentos", "Mostra o volume mensal dos últimos meses para perceber aumento ou queda na demanda."],
      ["Acesso remoto", "Distribui a base entre SINEMA, VNC e máquinas sem acesso remoto cadastrado."],
      ["Contratos", "Resume contratos ativos, vencidos e a vencer, separando também o tipo de contrato quando informado."],
      ["Modelos", "Mostra quais modelos concentram mais máquinas cadastradas."],
      ["Softwares por VM", "Conta códigos de software únicos por VM. Se duas máquinas usam o mesmo código de software, ele entra uma única vez naquela VM."],
      ["Geolocalização", "No zoom inicial o mapa agrupa por estado. Ao aproximar, o mapa tenta posicionar as máquinas pela cidade cadastrada."],
      ["Clientes", "Clientes com mais máquinas indica base instalada. Clientes mais atendidos indica volume de chamados registrados."],
      ["Rankings inferiores", "Ajudam a localizar máquinas com mais atendimentos, máquinas há muito tempo sem registro e os últimos atendimentos lançados."]
    ];
  }

  if (view === "registry" && registryTab === "machines") {
    return [
      ["Código", "Número do projeto da máquina ou referência principal usada pela equipe."],
      ["Modelo e descrição", "Informe o tipo da máquina no modelo e detalhe a configuração no campo descrição."],
      ["Cliente e localização", "Informe a empresa e a cidade com UF, preferencialmente no formato Cidade - UF."],
      ["Mecânica", "Lista mecânica ou referência do projeto mecânico."],
      ["Código do software", "Número do software da máquina. Ele é usado nos indicadores por VM."],
      ["VM", "Nome ou identificação da VM onde o software está alocado."],
      ["Faixa de IP", "Faixa reservada pela engenharia no padrão IPv4, como 189.1.87.xxx."],
      ["Fabricação", "Mês e ano no formato mm/aaaa."],
      ["Software", "Selecione a versão padronizada de TIA Portal ou Scout."],
      ["Acesso remoto", "Escolha SINEMA, VNC ou sem acesso remoto. Os campos adicionais aparecem conforme a opção."],
      ["Contrato", "Preencha somente quando houver contrato ativo ou informação de vigência relevante."]
    ];
  }

  if (view === "service") {
    return [
      ["Máquina e equipamento", "Selecione a máquina atendida e indique o equipamento ou área afetada."],
      ["Tipo de atendimento", "Use acesso remoto para suporte remoto e visita técnica quando houver atendimento presencial."],
      ["E-mails para envio", "Informe os e-mails dos clientes. Comercial, Célia, Raquel e o técnico responsável entram automaticamente no envio."],
      ["Motivo breve", "Resumo curto que aparece nas tabelas, por exemplo: Falha no acionamento X."],
      ["Campos descritivos", "Registre solicitação, diagnóstico, serviço realizado e observações com o máximo de clareza."],
      ["Assinatura", "Em visita técnica, o campo de assinatura entra no relatório em PDF."]
    ];
  }

  if (view === "machineDetail") {
    return [
      ["Card principal", "Mostra os dados cadastrais mais importantes da máquina."],
      ["Software", "Concentra software, código do software, VM, faixa de IP e último atendimento."],
      ["Acesso remoto", "Mostra informações de SINEMA ou VNC cadastradas para consulta rápida."],
      ["Histórico", "Clique em um atendimento para abrir o popup com o registro completo e baixar o PDF."],
      ["Ações rápidas", "Permite registrar novo atendimento, alterar cadastro ou baixar o último PDF."]
    ];
  }

  if (view === "home") {
    return [
      ["Filtro", "Use para buscar por código, modelo, cliente, localização, VM, software ou acesso remoto."],
      ["Tabela", "Clique no código da máquina para abrir seus dados cadastrais e histórico."],
      ["Ordenação", "Clique nos cabeçalhos para ordenar a lista conforme a coluna escolhida."]
    ];
  }

  if (view === "schedule") {
    return [
      ["Datas", "Informe início e fim no formato dd/mm ou escreva A definir quando a agenda ainda não estiver fechada."],
      ["Código e cliente", "Use o código da máquina ou projeto quando existir e selecione/digite o cliente atendido."],
      ["Técnicos", "Liste os técnicos envolvidos. O campo aceita mais de um nome e aparece completo na tabela."],
      ["Status", "Atualize o andamento da viagem para facilitar o acompanhamento operacional."],
      ["Motivo", "Descreva o objetivo da viagem ou atendimento planejado com o nível de detalhe necessário."]
    ];
  }

  if (view === "admin") {
    return [
      ["Deploy", "Mostra ambiente, URL, commit, autor e data da leitura informados pela Vercel."],
      ["Migrations", "Lista as migrations mais recentes versionadas no repositório para facilitar conferência com o Supabase."],
      ["Auditoria", "Mostra as últimas ações gravadas no sistema: criação, edição, exclusão, relatórios, contratos, cronograma e Acesso Remoto."],
      ["Permissões", "Esta tela é restrita aos perfis Admin e Diretoria."]
    ];
  }

  if (view === "chat") {
    return [
      ["Fila de conversas", "Lista mensagens recebidas pelo WhatsApp. Conversas abertas ainda não foram assumidas; atribuídas têm um técnico responsável; encerradas ficam no histórico."],
      ["Status do usuário", "O status fica no cartão inferior do perfil: Online recebe transferências, Ocupado responde apenas conversas já atribuídas e Offline apenas visualiza."],
      ["Assumir e transferir", "Um usuário Online pode assumir conversa sem responsável. Para transferir, escolha um usuário Online na janela de transferência."],
      ["Responder", "As respostas são gravadas no histórico. Quando as credenciais oficiais da Meta estiverem configuradas, também serão enviadas ao WhatsApp."],
      ["Encerrar", "Use ao finalizar o chamado para arquivar a conversa e manter o histórico consultável."]
    ];
  }

  if (view === "registry" && registryTab === "clients") {
    return [
      ["Origem dos clientes", "A lista é formada automaticamente pelos contatos que enviam mensagens ao WhatsApp do Acesso Remoto."],
      ["Edição manual", "Use quando o cliente responder de forma incompleta ou confusa às mensagens automáticas."],
      ["Máquinas", "Código de máquina e número de série continuam ligados ao chamado, não ao cadastro fixo do cliente."],
      ["Exclusão", "Remove o cadastro do cliente, mas não apaga as conversas já registradas no histórico."]
    ];
  }

  return [
    ["Usuário", "Cadastre o nome que será exibido no sistema e associado aos registros feitos por essa conta."],
    ["E-mail", "Informe o e-mail corporativo autorizado. Apenas e-mails cadastrados conseguem validar o acesso ao app."],
    ["Perfil / setor", "Escolha o perfil correto para liberar apenas as telas e ações compatíveis com o setor do usuário."],
    ["Acesso Remoto", "Marque esta permissão para liberar a tela de Acesso Remoto e o status de plantão no perfil inferior."],
    ["Permissões", "Admin e Diretoria têm acesso total, incluindo Cronograma e Contratos. Coordenador segue as permissões de Engenharia e também pode cadastrar usuários. Montagem Elétrica e Montagem Mecânica podem emitir relatórios. Controladoria fica em consulta, sem edição ou emissão. Comercial pode criar, editar e excluir contratos e viagens; nos demais módulos permanece em consulta, sem emissão de relatórios."],
    ["Ações", "Use o menu de ações da tabela para editar dados do usuário ou remover acessos que não devem mais entrar no sistema."]
  ];
}

export function displayUserName(value: string) {
  const localPart = value.trim().split("@")[0];
  return localPart ? localPart.replace(/\./g, " ") : "Usuário";
}

export function initialsFromEmail(value: string) {
  const parts = displayUserName(value).split(/\s+/).filter(Boolean);
  if (!parts.length) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}`.toUpperCase();
}

export function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    "machine.created": "Máquina cadastrada",
    "machine.updated": "Máquina alterada",
    "authorized_users.deleted": "Usuário excluído",
    "user.created": "Usuário cadastrado",
    "user.updated": "Usuário alterado",
    "profile.updated": "Perfil alterado",
    "chat_contact.updated": "Cliente do acesso remoto alterado",
    "chat_contacts.deleted": "Cliente do acesso remoto excluído",
    "travel.created": "Viagem cadastrada",
    "travel.updated": "Viagem alterada",
    "travel_schedules.deleted": "Viagem excluída",
    "contract.created": "Contrato cadastrado",
    "contract.updated": "Contrato alterado",
    "support_contracts.deleted": "Contrato excluído",
    "service.created": "Atendimento registrado",
    "service.updated": "Atendimento alterado",
    "service_records.deleted": "Atendimento excluído",
    "machines.deleted": "Máquina excluída",
    "chat.assigned": "Conversa atribuída",
    "chat.closed": "Conversa encerrada"
  };
  return labels[action] ?? action;
}

export function auditEntityLabel(entity?: string | null) {
  const labels: Record<string, string> = {
    machines: "Máquinas",
    authorized_users: "Usuários",
    chat_contacts: "Clientes",
    travel_schedules: "Cronograma",
    support_contracts: "Contratos",
    service_records: "Relatórios",
    chat_conversations: "Acesso Remoto"
  };
  return entity ? labels[entity] ?? entity : "-";
}

export function auditDetailsSummary(log: AppAuditLog) {
  const details = log.details ?? {};
  const keys = ["code", "client", "model", "status", "service_type", "issue_summary", "contract_type", "assigned_to_name", "email"];
  const summary = keys
    .map((key) => {
      const value = details[key];
      return typeof value === "string" && value.trim() ? value.trim() : "";
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(" · ");
  return summary || log.entity_label || "-";
}

export function formatLongDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function shortCommit(value?: string | null) {
  return value ? value.slice(0, 7) : "-";
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function chatStatusLabel(status: ChatConversation["status"]) {
  if (status === "closed") return "Encerrada";
  if (status === "assigned") return "Em atendimento";
  return "Aberta";
}

export function chatMediaLabel(message: ChatMessage) {
  if (message.message_type === "image") return "Abrir imagem";
  if (message.message_type === "video") return "Abrir vídeo";
  if (message.message_type === "audio") return "Abrir áudio";
  if (message.message_type === "document") return message.media_filename ? `Abrir ${message.media_filename}` : "Abrir documento";
  return "Abrir mídia";
}

export function remoteAccessStatusClass(status: RemoteAccessStatus) {
  if (status === "Online") return "online";
  if (status === "Ocupado") return "busy";
  return "offline";
}
