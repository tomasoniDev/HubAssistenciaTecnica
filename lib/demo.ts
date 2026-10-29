import "server-only";

import type {
  AppAdminInfo,
  AuthorizedUser,
  Machine,
  ServiceRecord,
  SupportContract,
  TravelSchedule
} from "@/lib/types";

// Modo demonstração: só existe fora de produção e só com DEMO_MODE=true.
// Serve para ver e ajustar a interface sem Supabase. Nenhum dado aqui é real.
export const isDemoMode = process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";

export const DEMO_SESSION_SECRET = "demo-only-secret-never-used-in-production";
export const DEMO_USER_ID = "demo-user-0001";

const NOW = new Date().toISOString();

function isoDay(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export const demoUser: AuthorizedUser = {
  id: DEMO_USER_ID,
  name: "Usuário Demonstração",
  email: "demo@tomasoni.ind.br",
  role: "Admin",
  phone: "11999990000",
  remote_access_allowed: true,
  credential_access_allowed: true,
  created_at: NOW,
  updated_at: NOW
};

const demoUsers: AuthorizedUser[] = [
  demoUser,
  { ...demoUser, id: "demo-user-0002", name: "Ana Souza", email: "ana.souza@tomasoni.ind.br", role: "Engenharia", remote_access_allowed: false, credential_access_allowed: false },
  { ...demoUser, id: "demo-user-0003", name: "Bruno Lima", email: "bruno.lima@tomasoni.ind.br", role: "Montagem Elétrica", remote_access_allowed: false, credential_access_allowed: false },
  { ...demoUser, id: "demo-user-0004", name: "Carla Mendes", email: "carla.mendes@tomasoni.ind.br", role: "Comercial", remote_access_allowed: false, credential_access_allowed: false },
  { ...demoUser, id: "demo-user-0005", name: "Diego Rocha", email: "diego.rocha@tomasoni.ind.br", role: "Coordenador", remote_access_allowed: true, credential_access_allowed: false }
];

function demoServices(machineId: string, base: number): ServiceRecord[] {
  const rows: Array<Partial<ServiceRecord> & { offset: number }> = [
    { offset: -12, equipment: "CLP", issue_summary: "Falha de comunicação com a IHM", service_type: "Acesso remoto", report_status: "Finalizado" },
    { offset: -48, equipment: "Inversor", issue_summary: "Alarme de sobrecorrente no eixo 2", service_type: "Visita técnica", report_status: "Finalizado" },
    { offset: -3, equipment: "Servo", issue_summary: "Ajuste de parâmetros de posicionamento", service_type: "Acesso remoto", report_status: "Rascunho" }
  ];
  return rows.map((row, index) => ({
    id: `demo-service-${base}-${index}`,
    machine_id: machineId,
    technician_id: null,
    technician_name: "Bruno Lima",
    technician_email: "bruno.lima@tomasoni.ind.br",
    technician_role: "Montagem Elétrica",
    technician_phone: "11999990003",
    support_technicians: [],
    service_type: row.service_type ?? "Acesso remoto",
    service_date: isoDay(row.offset),
    service_start: null,
    service_end: null,
    equipment: row.equipment ?? null,
    issue_summary: row.issue_summary ?? null,
    request: "Cliente relatou parada intermitente da máquina.",
    diagnosis: "Verificado o sinal e o cabeamento; ajuste necessário.",
    service_done: "Parâmetros revisados e teste de operação realizado.",
    observations: null,
    customer_name: "Responsável do cliente",
    customer_signature: null,
    attachments: null,
    has_attachments: index === 1,
    has_signature: index === 1,
    report_status: row.report_status ?? "Finalizado",
    report_recipients: [],
    created_by: DEMO_USER_ID,
    created_at: NOW,
    updated_at: NOW
  }));
}

function demoMachine(index: number, fields: Pick<Machine, "code" | "model" | "client" | "unit_city" | "serial" | "vm" | "remote_access">): Machine {
  const id = `demo-machine-${index}`;
  return {
    id,
    code: fields.code,
    model: fields.model,
    client: fields.client,
    unit_city: fields.unit_city,
    serial: fields.serial,
    description: "Máquina fictícia para demonstração.",
    manufacture_month: "03/2022",
    mechanical_list: `ML-${1000 + index}`,
    software_code: `SW-${200 + index}`,
    ip_range: "192.168.10.0/24",
    vm: fields.vm,
    software_version: "V2.4.1",
    access_method: null,
    remote_access: fields.remote_access,
    vnc_ip: fields.remote_access === "VNC" ? "10.0.0.10" : null,
    vnc_user: fields.remote_access === "VNC" ? "demo" : null,
    vnc_password: fields.remote_access === "VNC" ? "senha-demo" : null,
    vnc_vm_password: null,
    vnc_notes: null,
    sinema_url: fields.remote_access === "SINEMA" ? "https://sinema.exemplo.local" : null,
    sinema_user: fields.remote_access === "SINEMA" ? "demo" : null,
    sinema_password: fields.remote_access === "SINEMA" ? "senha-demo" : null,
    sinema_notes: null,
    support_contract_active: index % 3 !== 0,
    support_contract_type: index % 3 !== 0 ? "Preventivo" : null,
    support_contract_until: index % 3 !== 0 ? isoDay(40 * index - 60) : null,
    created_at: NOW,
    updated_at: NOW,
    machine_emails: [],
    service_records: demoServices(id, index)
  };
}

const demoMachines: Machine[] = [
  demoMachine(1, { code: "T-665 1001", model: "Linha de Corte A", client: "Metalúrgica Alfa", unit_city: "Campinas - SP", serial: "500-101/21", vm: "VM-01", remote_access: "VNC" }),
  demoMachine(2, { code: "T-665 1002", model: "Prensa Hidráulica", client: "Indústria Beta", unit_city: "Joinville - SC", serial: "500-212/22", vm: "VM-02", remote_access: "SINEMA" }),
  demoMachine(3, { code: "T-665 1003", model: "Linha de Corte B", client: "Metalúrgica Alfa", unit_city: "Sorocaba - SP", serial: "500-305/22", vm: null, remote_access: "Sem acesso remoto" }),
  demoMachine(4, { code: "T-665 1004", model: "Dobradeira CNC", client: "Gamma Componentes", unit_city: "Curitiba - PR", serial: "500-418/23", vm: "VM-03", remote_access: "VNC" }),
  demoMachine(5, { code: "T-665 1005", model: "Prensa Hidráulica", client: "Delta Estruturas", unit_city: "Belo Horizonte - MG", serial: "500-522/23", vm: "VM-04", remote_access: "SINEMA" })
];

const demoContracts: SupportContract[] = [
  { id: "demo-contract-1", machine_id: "demo-machine-1", code: "T-665 1001", client: "Metalúrgica Alfa", serial: "500-101/21", contract_type: "Preventivo", status: "Ativo", active: true, support_contract_until: isoDay(180), created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW },
  { id: "demo-contract-2", machine_id: "demo-machine-2", code: "T-665 1002", client: "Indústria Beta", serial: "500-212/22", contract_type: "Corretivo", status: "Ativo", active: true, support_contract_until: isoDay(20), created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW },
  { id: "demo-contract-3", machine_id: "demo-machine-4", code: "T-665 1004", client: "Gamma Componentes", serial: "500-418/23", contract_type: "Preventivo", status: "Em negociação", active: false, support_contract_until: isoDay(-5), created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW },
  { id: "demo-contract-4", machine_id: "demo-machine-5", code: "T-665 1005", client: "Delta Estruturas", serial: "500-522/23", contract_type: "Preventivo", status: "Inativo", active: false, support_contract_until: isoDay(-90), created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW }
];

const demoTravel: TravelSchedule[] = [
  { id: "demo-travel-1", start_date: "05/11", end_date: "08/11", code: "C101", client: "Metalúrgica Alfa", technicians: "Bruno Lima, Ana Souza", status: "Confirmada", reason: "Preventiva anual da Linha de Corte A.", created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW },
  { id: "demo-travel-2", start_date: "A definir", end_date: "A definir", code: "C102", client: "Indústria Beta", technicians: "Diego Rocha", status: "Aguardando cliente", reason: "Visita para revisão da prensa.", created_by: DEMO_USER_ID, created_at: NOW, updated_at: NOW }
];

const demoAdminInfo: AppAdminInfo = {
  credentialEncryption: { configured: false, plaintextCount: 3 },
  migrations: [{ version: "043", name: "Require Machine Code", file: "043_require_machine_code.sql", updated_at: NOW }],
  deployment: {
    environment: "demo",
    url: "localhost",
    commit_sha: null,
    commit_message: "Modo demonstração",
    commit_author: null,
    region: null,
    node_env: process.env.NODE_ENV ?? null,
    generated_at: NOW
  },
  auditLogs: [
    { id: "demo-audit-1", action: "machine.updated", entity: "machines", entity_id: "demo-machine-1", entity_label: "T-665 1001", user_id: DEMO_USER_ID, user_email: demoUser.email, user_name: demoUser.name, user_role: "Admin", details: { client: "Metalúrgica Alfa" }, created_at: NOW }
  ],
  secretRotation: { key: "sharepoint_client_secret_rotation", label: "CLIENT_SECRET SharePoint", rotated_at: isoDay(-60), rotation_days: 180, updated_at: null }
};

const DEMO_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export function demoServiceHeavy(id: string) {
  if (!id.endsWith("-1")) return { attachments: null, customer_signature: null };
  return {
    attachments: [{ id: "demo-attachment-1", name: "foto-demo.png", type: "image/png", dataUrl: DEMO_IMAGE, width: 1, height: 1, caption: "Imagem de demonstração" }],
    customer_signature: DEMO_IMAGE
  };
}

export function demoAppData() {
  return {
    session: { userId: DEMO_USER_ID, email: demoUser.email, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 },
    user: demoUser,
    machines: demoMachines,
    authorizedUsers: demoUsers,
    travelSchedules: demoTravel,
    supportContracts: demoContracts,
    chatContacts: [],
    chatConversations: [],
    adminInfo: demoAdminInfo,
    warnings: {
      users: null,
      travelSchedules: null,
      supportContracts: null,
      chatContacts: null,
      chatConversations: null,
      auditLogs: null,
      appSettings: null
    }
  };
}
