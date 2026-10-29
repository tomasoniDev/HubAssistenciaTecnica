"use client";

import { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { downloadServicePdf, servicePdfBase64, servicePdfFileName, servicePdfPreviewUrl } from "@/lib/pdf";
import { hydrateServiceRecord, needsHeavyFields } from "@/lib/service-record-client";
import { ALLOWED_EMAIL_DOMAINS, canEditMachine, canEditSchedule, canEmitReports, canManageContracts, canManageUsers, hasFullAccess, isCorporateEmail } from "@/lib/permissions";
import type { AppAdminInfo, AppAuditLog, AuthorizedUser, ChatContact, ChatConversation, ChatMessage, Machine, ServiceAttachment, ServiceRecord, ServiceTechnician, SupportContract, TravelSchedule, UserRole } from "@/lib/types";
import {
  ActionMenuPosition,
  addDays,
  addMonths,
  apiRequest,
  appAction,
  AppDataPayload,
  AppSessionPayload,
  auditActionLabel,
  auditDetailsSummary,
  auditEntityLabel,
  AUTH_CONFIRMATION_INTERVAL_MS,
  AUTH_CONFIRMED_AT_KEY,
  authMessage,
  AuthorizedUserFormState,
  base64UrlToBuffer,
  BIOMETRIC_CREDENTIAL_KEY,
  BIOMETRIC_EMAIL_KEY,
  BIOMETRIC_PROMPT_DISMISSED_KEY,
  BIOMETRIC_SESSION_VERIFIED_KEY,
  bufferToBase64Url,
  canUseWebAuthn,
  ChatContactFormState,
  chatMediaLabel,
  chatStatusLabel,
  clearAuthConfirmation,
  clearBiometricVerifiedThisOpen,
  clientServiceRecipients,
  compareDate,
  compareText,
  compareTravelBySort,
  compareTravelValue,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  contractMatchesMachine,
  contractStatus,
  ContractStatus,
  ContractType,
  dataMessage,
  dayMonthOrderValue,
  daysSince,
  daysUntil,
  DEFAULT_MESSAGE,
  describeAuthError,
  displayMachineCode,
  displayUserName,
  EMPTY_CHAT_CONTACT_FORM,
  EMPTY_CONTRACT_FORM,
  EMPTY_MACHINE_CREDENTIALS,
  EMPTY_MACHINE_FORM,
  EMPTY_TRAVEL_FORM,
  EMPTY_USER_FORM,
  escapeHtml,
  extractDateFromServiceDateTime,
  finalizedServiceRecords,
  findMachineByLookup,
  formatDate,
  formatDateTime,
  formatDayMonthInput,
  formatFullDateInput,
  formatLongDateTime,
  formatMachineProjectCodeInput,
  formatMonthYear,
  formatMonthYearInput,
  formatPhone,
  formatServiceDateTimeInput,
  formatServiceTechniciansInput,
  formatTravelClientCodeInput,
  GENERIC_AUTH_MESSAGE,
  geocodeCity,
  hasBiometricEnabledFor,
  hasBiometricVerifiedThisOpen,
  hasFreshAuthConfirmation,
  helpSections,
  helpText,
  HistorySortKey,
  initialsFromEmail,
  INTERNAL_SERVICE_REPORT_RECIPIENTS,
  isActiveContract,
  isAssemblyRole,
  isCompletedTravel,
  isMobileAuthDevice,
  isNegotiatingContract,
  isServiceDraft,
  isValidIpv4Octet,
  lastServiceDate,
  latestContractForMachine,
  LeafletLayerGroup,
  LeafletLayerTarget,
  LeafletMap,
  LeafletMarker,
  LeafletNamespace,
  LeafletTileLayer,
  loadLeaflet,
  locationCity,
  locationState,
  MACHINE_SAFE_SELECT,
  machineFormFromMachine,
  MachineFormState,
  machineHasRemoteAccess,
  MachineSortKey,
  mapPointPosition,
  MAX_SERVICE_ATTACHMENTS,
  monthKey,
  monthLabel,
  monthYearSortValue,
  nextDirection,
  normalizeFullDate,
  normalizeLookup,
  normalizeLookupText,
  normalizeMonthYear,
  normalizeRemoteAccess,
  normalizeServiceType,
  normalizeStatus,
  OnlineTechnician,
  onlyDigits,
  parseEmails,
  parseServiceTechnicianInput,
  percent,
  PWA_SW_RELOAD_KEY,
  RegistryMachineSortKey,
  RegistryTab,
  REMOTE_ACCESS_OPTIONS,
  REMOTE_ACCESS_STATUS_KEY,
  RemoteAccess,
  RemoteAccessStatus,
  remoteAccessStatusClass,
  ScheduleTab,
  screenLegend,
  secretRotationMessage,
  secretRotationStatus,
  SERVICE_EMAIL_SUGGESTIONS_KEY,
  SERVICE_TYPE_OPTIONS,
  serviceEmailMessage,
  serviceEmailSubject,
  serviceEmailSubjectDate,
  serviceEmailTechnicians,
  serviceMachineLookupLabel,
  ServicePreviewState,
  serviceRecordWithTechnicianRole,
  serviceReportRecipients,
  serviceReportStatus,
  serviceTechnicianLookupLabel,
  ServiceType,
  shortCommit,
  SOFTWARE_OPTIONS,
  sortContractsByRelevance,
  SortDirection,
  sortMark,
  STATE_CENTERS,
  storeAuthConfirmation,
  storeBiometricVerifiedThisOpen,
  SupportContractFormState,
  THEME_KEY,
  ThemeMode,
  TRAVEL_CODE_PATTERN,
  TRAVEL_STATUS_OPTIONS,
  TravelScheduleFormState,
  TravelSortKey,
  uniqueValidEmails,
  USER_ROLE_OPTIONS,
  UserSortKey,
  validateCodePattern,
  validateDayMonth,
  validateFullDate,
  validateIpv4Like,
  validateMonthYear,
  validateServiceDateTime,
  View,
  VM_OPTIONS
} from "@/lib/app-helpers";
import {
  DetailIcon,
  EditIcon,
  HelpIcon,
  LogOutIcon,
  MoonIcon,
  MoreIcon,
  NAV_ICON_PATHS,
  NavIcon,
  NavIconName,
  PdfDownloadIcon,
  PlusIcon,
  SaveIcon,
  SunIcon,
  TrashIcon
} from "@/components/icons";

export default function Home() {
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overviewMapRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const machineFormSourceIdRef = useRef<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [biometricPromptOpen, setBiometricPromptOpen] = useState(false);
  const [biometricRequired, setBiometricRequired] = useState(false);
  const [isMobileAuthDeviceState, setIsMobileAuthDeviceState] = useState(() => isMobileAuthDevice());
  const [view, setView] = useState<View>("home");
  const [registryTab, setRegistryTab] = useState<RegistryTab>("machines");
  const [machines, setMachines] = useState<Machine[]>([]);
  const [authorizedUsers, setAuthorizedUsers] = useState<AuthorizedUser[]>([]);
  const [travelSchedules, setTravelSchedules] = useState<TravelSchedule[]>([]);
  const [supportContracts, setSupportContracts] = useState<SupportContract[]>([]);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatContacts, setChatContacts] = useState<ChatContact[]>([]);
  const [adminInfo, setAdminInfo] = useState<AppAdminInfo | null>(null);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [chatReply, setChatReply] = useState("");
  const [onlineTechnicians, setOnlineTechnicians] = useState<OnlineTechnician[]>([]);
  const [remoteAccessStatus, setRemoteAccessStatus] = useState<RemoteAccessStatus>("Offline");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [currentUserRemoteAccessAllowed, setCurrentUserRemoteAccessAllowed] = useState(false);
  const [currentUserCredentialAccessAllowed, setCurrentUserCredentialAccessAllowed] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState("");
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [machineFilter, setMachineFilter] = useState("");
  const [historyFilter, setHistoryFilter] = useState("");
  const [machineSort, setMachineSort] = useState<{ key: MachineSortKey; direction: SortDirection }>({ key: "last_service", direction: "desc" });
  const [registryMachineSort, setRegistryMachineSort] = useState<{ key: RegistryMachineSortKey; direction: SortDirection }>({ key: "code", direction: "asc" });
  const [historySort, setHistorySort] = useState<{ key: HistorySortKey; direction: SortDirection }>({ key: "service_date", direction: "desc" });
  const [userSort, setUserSort] = useState<{ key: UserSortKey; direction: SortDirection }>({ key: "name", direction: "asc" });
  const [editingMachineId, setEditingMachineId] = useState("");
  const [editingUserId, setEditingUserId] = useState("");
  const [userForm, setUserForm] = useState<AuthorizedUserFormState>(EMPTY_USER_FORM);
  const [editingContact, setEditingContact] = useState<ChatContact | null>(null);
  const [contactForm, setContactForm] = useState<ChatContactFormState>(EMPTY_CHAT_CONTACT_FORM);
  const [editingTravelId, setEditingTravelId] = useState("");
  const [travelForm, setTravelForm] = useState<TravelScheduleFormState>(EMPTY_TRAVEL_FORM);
  const [scheduleTab, setScheduleTab] = useState<ScheduleTab>("travel");
  const [editingContractId, setEditingContractId] = useState("");
  const [contractForm, setContractForm] = useState<SupportContractFormState>(EMPTY_CONTRACT_FORM);
  const [travelSort, setTravelSort] = useState<{ key: TravelSortKey; direction: SortDirection }>({ key: "start_date", direction: "asc" });
  const [completedTravelSort, setCompletedTravelSort] = useState<{ key: TravelSortKey; direction: SortDirection }>({ key: "updated_at", direction: "desc" });
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState<ServiceRecord | null>(null);
  const [servicePreview, setServicePreview] = useState<ServicePreviewState | null>(null);
  const [servicePreviewSending, setServicePreviewSending] = useState(false);
  const [editingServiceRecord, setEditingServiceRecord] = useState<ServiceRecord | null>(null);
  const [editingPreviewRecipients, setEditingPreviewRecipients] = useState<string[] | null>(null);
  const [mapMode, setMapMode] = useState<"loading" | "leaflet" | "fallback">("loading");
  const [focusedMapState, setFocusedMapState] = useState("");
  const [machineForm, setMachineForm] = useState<MachineFormState>(EMPTY_MACHINE_FORM);
  const [serviceType, setServiceType] = useState<ServiceType>("Acesso remoto");
  const [serviceMachineLookupInput, setServiceMachineLookupInput] = useState("");
  const [serviceMachineTouched, setServiceMachineTouched] = useState(false);
  const [supportTechniciansInput, setSupportTechniciansInput] = useState("");
  const [serviceRecipientsInput, setServiceRecipientsInput] = useState("");
  const [serviceRecipientSuggestionsOpen, setServiceRecipientSuggestionsOpen] = useState(false);
  const [savedServiceEmails, setSavedServiceEmails] = useState<string[]>([]);
  const [customerSignature, setCustomerSignature] = useState("");
  const [serviceAttachments, setServiceAttachments] = useState<ServiceAttachment[]>([]);
  const [isSigning, setIsSigning] = useState(false);
  const [signatureExpanded, setSignatureExpanded] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ title: string; message: string; confirmLabel: string; destructive: boolean } | null>(null);
  const confirmResolver = useRef<((accepted: boolean) => void) | null>(null);
  const [openActionMenu, setOpenActionMenu] = useState("");
  const [actionMenuPosition, setActionMenuPosition] = useState<ActionMenuPosition | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
    setTheme(storedTheme);
    document.documentElement.classList.toggle("dark", storedTheme === "dark");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller && !window.sessionStorage.getItem(PWA_SW_RELOAD_KEY)) {
          window.sessionStorage.setItem(PWA_SW_RELOAD_KEY, "1");
          window.location.reload();
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== "production") console.error("Erro ao registrar service worker", error);
      });
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px), ((pointer: coarse) and (max-width: 1024px))");
    const updateDeviceMode = () => setIsMobileAuthDeviceState(query.matches);
    updateDeviceMode();
    query.addEventListener("change", updateDeviceMode);
    return () => query.removeEventListener("change", updateDeviceMode);
  }, []);

  useEffect(() => {
    const authScreenOpen = sessionReady && (!isAuthenticated || biometricRequired);
    document.documentElement.classList.toggle("auth-screen-open", authScreenOpen);
    document.body.classList.toggle("auth-screen-open", authScreenOpen);
    return () => {
      document.documentElement.classList.remove("auth-screen-open");
      document.body.classList.remove("auth-screen-open");
    };
  }, [biometricRequired, isAuthenticated, sessionReady]);

  useEffect(() => {
    try {
      const storedEmails = JSON.parse(window.localStorage.getItem(SERVICE_EMAIL_SUGGESTIONS_KEY) ?? "[]");
      if (Array.isArray(storedEmails)) {
        setSavedServiceEmails(storedEmails.filter((email): email is string => typeof email === "string"));
      }
    } catch {
      setSavedServiceEmails([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (servicePreview?.pdfUrl) URL.revokeObjectURL(servicePreview.pdfUrl);
    };
  }, [servicePreview?.pdfUrl]);

  useEffect(() => {
    let cancelled = false;
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/municipios")
      .then((response) => response.ok ? response.json() : [])
      .then((rows: Array<{ nome?: string; microrregiao?: { mesorregiao?: { UF?: { sigla?: string } } } }>) => {
        if (cancelled) return;
        const suggestions = rows
          .map((row) => {
            const city = row.nome?.trim();
            const state = row.microrregiao?.mesorregiao?.UF?.sigla?.trim();
            return city && state ? `${city} - ${state}` : "";
          })
          .filter(Boolean)
          .sort((a, b) => compareText(a, b));
        setCitySuggestions(suggestions);
      })
      .catch(() => setCitySuggestions([]));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiRequest<AppSessionPayload>("/api/auth/session")
      .then(async (payload) => {
        if (cancelled) return;
        setSessionReady(true);
        const session = payload.session;
        const user = payload.user;
        const userEmail = session?.email ?? "";

        if (!session || !user) {
          setIsAuthenticated(false);
          return;
        }

        if (!isCorporateEmail(userEmail)) {
          await signOut();
          setMessage("Acesso negado. Use um e-mail corporativo da Tomasoni.");
          return;
        }

        if (!hasFreshAuthConfirmation()) {
          await signOut();
          setMessage("Por segurança, confirme seu acesso novamente com o código enviado ao e-mail.");
          return;
        }

        applyAuthorizedSession(session.userId, userEmail, user);
        if (isMobileAuthDeviceState && hasBiometricEnabledFor(userEmail) && !hasBiometricVerifiedThisOpen(userEmail)) {
          setBiometricRequired(true);
          setIsAuthenticated(false);
          setMessage("Confirme sua biometria para abrir o app neste dispositivo.");
          return;
        }

        setIsAuthenticated(true);
        await loadData();
      })
      .catch(() => {
        if (cancelled) return;
        setSessionReady(true);
        setIsAuthenticated(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isMobileAuthDeviceState]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = window.setInterval(() => {
      if (hasFreshAuthConfirmation()) return;
      setMessage("Por segurança, confirme seu acesso novamente com o código enviado ao e-mail.");
      void signOut();
    }, 60 * 1000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    setOpenActionMenu("");
    setActionMenuPosition(null);
    setUserMenuOpen(false);
  }, [view, registryTab]);

  useEffect(() => {
    document.body.classList.toggle("signature-mode-open", signatureExpanded);
    return () => document.body.classList.remove("signature-mode-open");
  }, [signatureExpanded]);

  useEffect(() => {
    function closeFloatingLayers(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (!target.closest(".user-menu")) setUserMenuOpen(false);
      if (!target.closest(".row-actions") && !target.closest(".row-menu")) {
        setOpenActionMenu("");
        setActionMenuPosition(null);
      }
    }

    document.addEventListener("mousedown", closeFloatingLayers);
    return () => document.removeEventListener("mousedown", closeFloatingLayers);
  }, []);

  const selectedMachine = machines.find((machine) => machine.id === selectedMachineId);
  const serviceMachine = selectedMachine ?? machines[0];
  const previewMachine = servicePreview ? machines.find((machine) => machine.id === servicePreview.machineId) : null;
  const activeServiceEmailToken = serviceRecipientsInput.split(/[;,\n]/).at(-1)?.trim().toLowerCase() ?? "";
  const serviceEmailSuggestions = activeServiceEmailToken.length >= 2
    ? savedServiceEmails
        .filter((email) => email.includes(activeServiceEmailToken) && !parseEmails(serviceRecipientsInput).map((item) => item.toLowerCase()).includes(email.toLowerCase()))
        .slice(0, 5)
    : [];
  const serviceMachineLookupInvalid = serviceMachineTouched && Boolean(serviceMachineLookupInput.trim()) && !findMachineByLookup(machines, serviceMachineLookupInput);
  const editingMachine = machines.find((machine) => machine.id === editingMachineId);
  const selectedChat = chatConversations.find((conversation) => conversation.id === selectedChatId) ?? chatConversations[0];
  const showRemoteAccess = machineHasRemoteAccess(machineForm.remote_access);
  const currentUserHasFullAccess = hasFullAccess(currentUserRole);
  const currentUserCanViewAdmin = currentUserHasFullAccess;
  const currentUserCanUseRemoteAccess = currentUserRole === "Admin" || currentUserRemoteAccessAllowed;
  const currentUserCanAccessCredentials = currentUserRole === "Admin" || currentUserCredentialAccessAllowed;
  const canDownloadBackup = currentUserRole === "Admin";
  const currentUserCanManageUsers = canManageUsers(currentUserRole);
  const currentUserCanEditMachine = canEditMachine(currentUserRole);
  const currentUserCanManageContracts = canManageContracts(currentUserRole);
  const currentUserCanEmitReports = canEmitReports(currentUserRole);
  const currentUserCanEditSchedule = canEditSchedule(currentUserRole);
  const currentUserCanViewMachineDetailCards = !isAssemblyRole(currentUserRole) && currentUserRole !== "Controladoria" && currentUserRole !== "Comercial";
  const adminDeployment = adminInfo?.deployment;
  const adminMigrations = adminInfo?.migrations ?? [];
  const adminAuditLogs = adminInfo?.auditLogs ?? [];
  const adminSecretRotation = adminInfo?.secretRotation ?? null;
  const adminSecretNextRotation = addDays(adminSecretRotation?.rotated_at, adminSecretRotation?.rotation_days ?? 180);
  const adminSecretDaysRemaining = daysUntil(adminSecretNextRotation);
  const adminSecretStatus = secretRotationStatus(adminSecretDaysRemaining);
  const machineMainFieldsDisabled = !currentUserCanEditMachine;
  const selectedMachineAccess = normalizeRemoteAccess(selectedMachine?.remote_access ?? selectedMachine?.access_method);
  const selectedMachineContract = latestContractForMachine(supportContracts, selectedMachine);
  const selectedMachineContractStatus = contractStatus(selectedMachineContract);
  const selectedMachineHasContractInfo = selectedMachineContractStatus === "Ativo" || selectedMachineContractStatus === "Em negociação";
  const selectedMachineContractDays = daysUntil(selectedMachineContract?.support_contract_until);
  const selectedMachineDraftReports = [...(selectedMachine?.service_records ?? [])]
    .filter((record) => currentUserCanEmitReports && isServiceDraft(record) && record.created_by === currentUserId)
    .sort((a, b) => compareDate(b.updated_at, a.updated_at) || compareDate(b.service_date, a.service_date));
  const selectedMachineRecentHistory = finalizedServiceRecords(selectedMachine)
    .sort((a, b) => compareDate(b.service_date, a.service_date))
    .slice(0, 5);
  const openTravelSchedules = travelSchedules
    .filter((item) => !isCompletedTravel(item))
    .sort((a, b) => compareTravelBySort(a, b, travelSort) || compareText(a.client, b.client));
  const completedTravelSchedules = travelSchedules
    .filter(isCompletedTravel)
    .sort((a, b) => compareTravelBySort(a, b, completedTravelSort) || compareText(a.client, b.client));
  const selectedChatAssignedToCurrent = Boolean(selectedChat?.assigned_to_email && selectedChat.assigned_to_email.toLowerCase() === currentUserEmail.toLowerCase());
  const canReplySelectedChat = Boolean(
    selectedChat
    && selectedChat.status !== "closed"
    && currentUserCanUseRemoteAccess
    && (remoteAccessStatus === "Online" || (remoteAccessStatus === "Ocupado" && selectedChatAssignedToCurrent))
  );
  const canAssumeSelectedChat = Boolean(selectedChat && selectedChat.status !== "closed" && !selectedChat.assigned_to_email && currentUserCanUseRemoteAccess && remoteAccessStatus === "Online");
  const availableTransferUsers = onlineTechnicians.filter((user) => user.status === "Online" && user.email.toLowerCase() !== currentUserEmail.toLowerCase());
  const canTransferSelectedChat = Boolean(selectedChat && selectedChat.status !== "closed" && canReplySelectedChat && availableTransferUsers.length);

  useEffect(() => {
    if (!currentUserCanManageContracts && scheduleTab !== "travel") {
      setScheduleTab("travel");
    }
  }, [currentUserCanManageContracts, scheduleTab]);

  useEffect(() => {
    if (view !== "registry") return;
    if (registryTab === "machines" && !currentUserCanEditMachine) {
      setRegistryTab(currentUserCanUseRemoteAccess ? "clients" : "users");
    }
    if (registryTab === "clients" && !currentUserCanUseRemoteAccess) {
      setRegistryTab(currentUserCanEditMachine ? "machines" : "users");
    }
    if (registryTab === "users" && !currentUserCanManageUsers) {
      setRegistryTab(currentUserCanUseRemoteAccess ? "clients" : "machines");
    }
  }, [currentUserCanEditMachine, currentUserCanManageUsers, currentUserCanUseRemoteAccess, registryTab, view]);

  useEffect(() => {
    if (view === "chat" && !currentUserCanUseRemoteAccess) {
      setView("home");
    }
  }, [currentUserCanUseRemoteAccess, view]);

  useEffect(() => {
    if (view === "admin" && !currentUserCanViewAdmin) {
      setView("home");
    }
  }, [currentUserCanViewAdmin, view]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserEmail || !currentUserCanUseRemoteAccess) {
      setRemoteAccessStatus("Offline");
      return;
    }

    const storedStatus = window.localStorage.getItem(`${REMOTE_ACCESS_STATUS_KEY}:${currentUserEmail.toLowerCase()}`) as RemoteAccessStatus | null;
    setRemoteAccessStatus(storedStatus === "Online" || storedStatus === "Ocupado" ? storedStatus : "Offline");
  }, [currentUserCanUseRemoteAccess, currentUserEmail, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = window.setInterval(() => {
      void loadData();
    }, view === "chat" ? 15000 : 45000);

    return () => window.clearInterval(interval);
  }, [isAuthenticated, view]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserCanUseRemoteAccess || !currentUserEmail || remoteAccessStatus === "Offline") {
      setOnlineTechnicians([]);
      return;
    }

    const currentUserPresence: OnlineTechnician = {
      email: currentUserEmail,
      name: currentUserName || displayUserName(currentUserEmail),
      role: currentUserRole,
      status: remoteAccessStatus,
      onlineAt: new Date().toISOString()
    };
    setOnlineTechnicians([currentUserPresence]);
  }, [currentUserCanUseRemoteAccess, currentUserEmail, currentUserName, currentUserRole, isAuthenticated, remoteAccessStatus]);

  const overviewData = useMemo(() => {
    const today = new Date();
    const currentMonth = monthKey(today);
    const lastSixMonths = Array.from({ length: 6 }, (_, index) => monthKey(addMonths(today, index - 5)));
    const serviceEntries = machines.flatMap((machine) => finalizedServiceRecords(machine).map((record) => ({ machine, record })));
    const machinesWithRemote = machines.filter((machine) => machineHasRemoteAccess(normalizeRemoteAccess(machine.remote_access ?? machine.access_method)));
    const machinesWithoutService = machines.filter((machine) => !lastServiceDate(machine));
    const machineContracts = machines
      .map((machine) => latestContractForMachine(supportContracts, machine))
      .filter((contract): contract is SupportContract => Boolean(contract));
    const activeContracts = machineContracts.filter(isActiveContract);
    const negotiatingContracts = machineContracts.filter(isNegotiatingContract);
    const expiringContracts = activeContracts.filter((contract) => {
      const days = daysUntil(contract.support_contract_until);
      return days !== null && days >= 0 && days <= 90;
    });
    const expiredContracts = activeContracts.filter((contract) => {
      const days = daysUntil(contract.support_contract_until);
      return days !== null && days < 0;
    });
    const staleMachines = machines.filter((machine) => {
      const days = daysSince(lastServiceDate(machine));
      return days === null || days > 180;
    });
    const machinesByState = new Map<string, Machine[]>();
    const machinesByCity = new Map<string, { city: string; state: string; machines: Machine[] }>();
    const softwareByVm = new Map<string, Set<string>>();
    machines.forEach((machine) => {
      const state = locationState(machine.unit_city);
      machinesByState.set(state, [...(machinesByState.get(state) ?? []), machine]);
      const city = locationCity(machine.unit_city);
      if (city && STATE_CENTERS[state]) {
        const key = `${city}|${state}`.toLowerCase();
        const current = machinesByCity.get(key) ?? { city, state, machines: [] };
        current.machines.push(machine);
        machinesByCity.set(key, current);
      }
      const softwareCode = machine.software_code?.trim();
      if (softwareCode) {
        const vm = machine.vm?.trim() || "VM não informada";
        const current = softwareByVm.get(vm) ?? new Set<string>();
        current.add(softwareCode.toUpperCase());
        softwareByVm.set(vm, current);
      }
    });

    const countBy = <T,>(items: T[], label: (item: T) => string) => {
      const map = new Map<string, number>();
      items.forEach((item) => {
        const key = label(item) || "Não informado";
        map.set(key, (map.get(key) ?? 0) + 1);
      });
      return [...map.entries()]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value || compareText(a.name, b.name));
    };

    const serviceMonthCounts = new Map(lastSixMonths.map((key) => [key, 0]));
    serviceEntries.forEach(({ record }) => {
      if (!record.service_date) return;
      const key = record.service_date.slice(0, 7);
      if (serviceMonthCounts.has(key)) serviceMonthCounts.set(key, (serviceMonthCounts.get(key) ?? 0) + 1);
    });

    const machineAttention = machines
      .map((machine) => ({
        machine,
        lastDate: lastServiceDate(machine),
        days: daysSince(lastServiceDate(machine)),
        services: finalizedServiceRecords(machine).length
      }))
      .sort((a, b) => (b.days ?? 99999) - (a.days ?? 99999))
      .slice(0, 6);

    const topMachinesByService = [...machines]
      .map((machine) => ({ machine, value: finalizedServiceRecords(machine).length }))
      .sort((a, b) => b.value - a.value || compareText(displayMachineCode(a.machine), displayMachineCode(b.machine)))
      .slice(0, 6);

    const recentServices = serviceEntries
      .sort((a, b) => compareDate(b.record.service_date, a.record.service_date))
      .slice(0, 6);

    return {
      totalMachines: machines.length,
      totalServices: serviceEntries.length,
      servicesThisMonth: serviceEntries.filter(({ record }) => record.service_date?.startsWith(currentMonth)).length,
      activeContracts: activeContracts.length,
      negotiatingContracts: negotiatingContracts.length,
      expiringContracts: expiringContracts.length,
      expiredContracts: expiredContracts.length,
      remoteCoverage: percent(machinesWithRemote.length, machines.length),
      staleMachines: staleMachines.length,
      machinesWithoutService: machinesWithoutService.length,
      byModel: countBy(machines, (machine) => machine.model?.trim() || "Modelo não informado").slice(0, 7),
      byAccess: countBy(machines, (machine) => normalizeRemoteAccess(machine.remote_access ?? machine.access_method)),
      byState: countBy(machines, (machine) => locationState(machine.unit_city)).slice(0, 8),
      geoStates: [...machinesByState.entries()]
        .filter(([state]) => Boolean(STATE_CENTERS[state]))
        .map(([state, stateMachines]) => ({ state, value: stateMachines.length, machines: stateMachines }))
        .sort((a, b) => b.value - a.value || compareText(a.state, b.state)),
      geoCities: [...machinesByCity.values()]
        .map((item) => ({ ...item, value: item.machines.length }))
        .sort((a, b) => b.value - a.value || compareText(`${a.city}-${a.state}`, `${b.city}-${b.state}`)),
      byContractType: countBy(activeContracts, (contract) => contract.contract_type || "Tipo não informado"),
      byServiceType: countBy(serviceEntries, ({ record }) => normalizeServiceType(record.service_type)),
      byClient: countBy(machines, (machine) => machine.client?.trim() || "Cliente não informado").slice(0, 8),
      byClientServices: countBy(serviceEntries, ({ machine }) => machine.client?.trim() || "Cliente não informado").slice(0, 8),
      byVmSoftware: [...softwareByVm.entries()]
        .map(([name, softwareCodes]) => ({ name, value: softwareCodes.size }))
        .sort((a, b) => b.value - a.value || compareText(a.name, b.name))
        .slice(0, 8),
      serviceTrend: [...serviceMonthCounts.entries()].map(([name, value]) => ({ name: monthLabel(name), value })),
      topMachinesByService,
      machineAttention,
      recentServices
    };
  }, [machines, supportContracts]);

  useEffect(() => {
    if (view !== "overview" || !overviewMapRef.current) {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      return;
    }

    let cancelled = false;
    setMapMode("loading");
    const timeout = window.setTimeout(() => {
      if (!cancelled) setMapMode("fallback");
    }, 5000);

    loadLeaflet()
      .then((leaflet) => {
        if (cancelled || !overviewMapRef.current) return;
        window.clearTimeout(timeout);
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        const map = leaflet.map(overviewMapRef.current, {
          scrollWheelZoom: true,
          zoomControl: true
        }).setView([-14.235, -51.9253], 4);
        window.setTimeout(() => {
          if (!cancelled) map.invalidateSize();
        }, 120);

        leaflet.tileLayer("/api/map-tile/{z}/{x}/{y}.png?v=osm-20260909", {
          attribution: "&copy; OpenStreetMap",
          detectRetina: true
        }).addTo(map);

        const stateLayer = leaflet.layerGroup();
        const cityLayer = leaflet.layerGroup();
        const bounds: [number, number][] = [];

        overviewData.geoStates.forEach((item) => {
          const center = STATE_CENTERS[item.state];
          if (!center) return;
          bounds.push(center);
          const machineList = item.machines
            .slice(0, 8)
            .map((machine) => `<li>${escapeHtml(displayMachineCode(machine))} - ${escapeHtml(machine.client || "Cliente não informado")}</li>`)
            .join("");

          leaflet.circleMarker(center, {
            radius: Math.min(28, 9 + item.value * 3),
            color: "#1268d8",
            fillColor: "#1268d8",
            fillOpacity: 0.72,
            weight: 2
          })
            .addTo(stateLayer)
            .bindPopup(`<strong>${escapeHtml(item.state)} - ${item.value} máquina${item.value === 1 ? "" : "s"}</strong><ul>${machineList}</ul>${item.value > 8 ? `<small>+${item.value - 8} máquinas</small>` : ""}`);
        });

        stateLayer.addTo(map);

        const updateGeoLayers = () => {
          const showCities = map.getZoom() >= 7;
          if (showCities) {
            if (map.hasLayer(stateLayer)) map.removeLayer(stateLayer);
            if (!map.hasLayer(cityLayer)) map.addLayer(cityLayer);
          } else {
            if (map.hasLayer(cityLayer)) map.removeLayer(cityLayer);
            if (!map.hasLayer(stateLayer)) map.addLayer(stateLayer);
          }
        };

        Promise.all(overviewData.geoCities.map(async (item) => {
          const center = await geocodeCity(item.city, item.state).catch(() => null);
          if (!center || cancelled) return;
          const machineList = item.machines
            .slice(0, 8)
            .map((machine) => `<li>${escapeHtml(displayMachineCode(machine))} - ${escapeHtml(machine.client || "Cliente não informado")}</li>`)
            .join("");
          leaflet.circleMarker(center, {
            radius: Math.min(22, 7 + item.value * 2),
            color: "#0f9b5f",
            fillColor: "#0f9b5f",
            fillOpacity: 0.72,
            weight: 2
          })
            .addTo(cityLayer)
            .bindPopup(`<strong>${escapeHtml(item.city)} - ${escapeHtml(item.state)}</strong><br/><span>${item.value} máquina${item.value === 1 ? "" : "s"}</span><ul>${machineList}</ul>${item.value > 8 ? `<small>+${item.value - 8} máquinas</small>` : ""}`);
        })).then(() => {
          if (!cancelled) updateGeoLayers();
        });

        map.on("zoomend", updateGeoLayers);
        if (bounds.length > 1) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 6 });
        updateGeoLayers();
        leafletMapRef.current = map;
        setMapMode("leaflet");
      })
      .catch(() => {
        window.clearTimeout(timeout);
        setMapMode("fallback");
        setMessage("Não foi possível carregar o mapa. Verifique a conexão e tente novamente.");
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [overviewData.geoCities, overviewData.geoStates, view]);

  useEffect(() => {
    if (view !== "overview" || !leafletMapRef.current) return;
    const center = focusedMapState ? STATE_CENTERS[focusedMapState] : null;
    if (center) {
      leafletMapRef.current.setView(center, 7);
      return;
    }

    const bounds = overviewData.geoStates
      .map((item) => STATE_CENTERS[item.state])
      .filter(Boolean);
    if (bounds.length > 1) leafletMapRef.current.fitBounds(bounds, { padding: [28, 28], maxZoom: 6 });
    else leafletMapRef.current.setView([-14.235, -51.9253], 4);
  }, [focusedMapState, overviewData.geoStates, view]);

  function focusOverviewMapState(stateName: string) {
    if (stateName === "Sem localização" || !STATE_CENTERS[stateName]) {
      setFocusedMapState("");
      return;
    }

    setFocusedMapState(stateName);
  }

  useEffect(() => {
    if (machineFormSourceIdRef.current === editingMachineId) return;
    if (editingMachineId && !editingMachine) return;

    // Refreshing server data must not overwrite the machine being edited.
    machineFormSourceIdRef.current = editingMachineId;
    setMachineForm(machineFormFromMachine(editingMachine));
  }, [editingMachineId, editingMachine]);

  useEffect(() => {
    const nextServiceType = normalizeServiceType(editingServiceRecord?.service_type);
    setServiceType(nextServiceType);
    setCustomerSignature(nextServiceType === "Visita técnica" ? editingServiceRecord?.customer_signature ?? "" : "");
    setServiceAttachments(editingServiceRecord?.attachments ?? []);
  }, [editingServiceRecord]);

  useEffect(() => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || serviceType !== "Visita técnica") return;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (!customerSignature) return;
    const image = new window.Image();
    image.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
    };
    image.src = customerSignature;
  }, [customerSignature, serviceType, view]);

  function applyAuthorizedSession(userId: string, userEmail: string, authorizedUser: AuthorizedUser) {
    const fallbackName = displayUserName(userEmail);
    setCurrentUserId(userId);
    setCurrentUserEmail(userEmail.toLowerCase());
    setCurrentUserRole(authorizedUser.role);
    setCurrentUserRemoteAccessAllowed(Boolean(authorizedUser.remote_access_allowed));
    setCurrentUserCredentialAccessAllowed(Boolean(authorizedUser.credential_access_allowed));
    setCurrentUserName(authorizedUser.name || fallbackName);
  }

  function applyAppData(payload: AppDataPayload) {
    if (payload.session && payload.user) {
      applyAuthorizedSession(payload.session.userId, payload.session.email, payload.user);
    }

    setMachines(payload.machines ?? []);
    setAuthorizedUsers(payload.authorizedUsers ?? []);
    setTravelSchedules(payload.travelSchedules ?? []);
    setSupportContracts(payload.supportContracts ?? []);
    setChatContacts(payload.chatContacts ?? []);
    setChatConversations(payload.chatConversations ?? []);
    setAdminInfo(payload.adminInfo ?? null);
  }

  async function loadData() {
    try {
      const payload = await apiRequest<AppDataPayload>("/api/app-data");
      applyAppData(payload);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os dados.");
    }
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (authLoading) return;
    const normalizedEmail = email.trim().toLowerCase();

    if (!isCorporateEmail(normalizedEmail)) {
      setMessage(GENERIC_AUTH_MESSAGE);
      return;
    }

    setAuthLoading(true);
    setMessage(DEFAULT_MESSAGE);

    if (!otpSent) {
      try {
        await apiRequest<{ ok: boolean }>("/api/auth/request-code", {
          method: "POST",
          body: JSON.stringify({ email: normalizedEmail })
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") console.error("Erro ao enviar código de acesso", error);
        setMessage(error instanceof Error ? error.message : GENERIC_AUTH_MESSAGE);
        setAuthLoading(false);
        return;
      }

      setEmail(normalizedEmail);
      setOtpSent(true);
      setMessage("Enviamos um código de acesso para o seu e-mail corporativo.");
      setAuthLoading(false);
      return;
    }

    const sanitizedCode = otpCode.trim();
    if (!sanitizedCode) {
      setMessage("Informe o código recebido por e-mail.");
      setAuthLoading(false);
      return;
    }

    let authPayload: AppSessionPayload;
    try {
      authPayload = await apiRequest<AppSessionPayload>("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email: normalizedEmail, code: sanitizedCode })
      });
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Erro ao validar código de acesso", error);
      setMessage(error instanceof Error ? error.message : GENERIC_AUTH_MESSAGE);
      setAuthLoading(false);
      return;
    }

    if (!authPayload.session || !authPayload.user) {
      setMessage(GENERIC_AUTH_MESSAGE);
      setAuthLoading(false);
      return;
    }

    storeAuthConfirmation();
    storeBiometricVerifiedThisOpen(authPayload.session.email);
    setOtpCode("");
    setOtpSent(false);
    setIsAuthenticated(true);
    applyAuthorizedSession(authPayload.session.userId, authPayload.session.email, authPayload.user);
    if (isMobileAuthDeviceState && canUseWebAuthn() && !window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY) && !window.localStorage.getItem(BIOMETRIC_PROMPT_DISMISSED_KEY)) {
      setBiometricPromptOpen(true);
    }
    setMessage("Acesso autorizado.");
    await loadData();
    setAuthLoading(false);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
    clearAuthConfirmation();
    clearBiometricVerifiedThisOpen();
    setIsAuthenticated(false);
    setCurrentUserId("");
    setCurrentUserEmail("");
    setCurrentUserName("");
    setCurrentUserRole(null);
    setCurrentUserRemoteAccessAllowed(false);
    setCurrentUserCredentialAccessAllowed(false);
    setRemoteAccessStatus("Offline");
    setMachines([]);
    setAuthorizedUsers([]);
    setChatContacts([]);
    setTravelSchedules([]);
    setSupportContracts([]);
    setChatConversations([]);
    setAdminInfo(null);
  }

  function updateRemoteAccessStatus(status: RemoteAccessStatus) {
    setRemoteAccessStatus(status);
    if (currentUserEmail) {
      window.localStorage.setItem(`${REMOTE_ACCESS_STATUS_KEY}:${currentUserEmail.toLowerCase()}`, status);
    }
    setUserMenuOpen(false);
    setMessage(`Status de Acesso Remoto alterado para ${status}.`);
  }

  function toggleTheme() {
    setTheme((current) => current === "dark" ? "light" : "dark");
  }

  function editUser() {
    setUserMenuOpen(false);
    setProfileName(currentUserName || displayUserName(currentUserEmail));
    setProfileModalOpen(true);
  }

  async function enableBiometricAuth() {
    if (!isMobileAuthDeviceState || !canUseWebAuthn() || !currentUserEmail) {
      setMessage("Biometria indisponível neste navegador ou dispositivo.");
      return;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "Assistência Tomasoni" },
          user: {
            id: userId,
            name: currentUserEmail,
            displayName: currentUserName || displayUserName(currentUserEmail)
          },
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          authenticatorSelection: { userVerification: "required" },
          timeout: 60000
        }
      }) as PublicKeyCredential | null;

      if (!credential) throw new Error("Credencial não criada.");
      window.localStorage.setItem(BIOMETRIC_EMAIL_KEY, currentUserEmail);
      window.localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, bufferToBase64Url(credential.rawId));
      window.localStorage.setItem(BIOMETRIC_PROMPT_DISMISSED_KEY, "1");
      setBiometricPromptOpen(false);
      setMessage("Biometria habilitada para este dispositivo.");
    } catch {
      setMessage("Não foi possível habilitar a biometria neste dispositivo.");
    }
  }

  async function confirmBiometricAccess() {
    const credentialId = window.localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
    if (!isMobileAuthDeviceState || !credentialId || !canUseWebAuthn()) {
      setMessage("Biometria indisponível. Acesse novamente com o código enviado ao e-mail.");
      await signOut();
      return;
    }

    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: base64UrlToBuffer(credentialId), type: "public-key" }],
          userVerification: "required",
          timeout: 60000
        }
      });

      if (!credential) throw new Error("Biometria cancelada.");
      const biometricEmail = window.localStorage.getItem(BIOMETRIC_EMAIL_KEY) || currentUserEmail;
      storeBiometricVerifiedThisOpen(biometricEmail);
      setBiometricRequired(false);
      setIsAuthenticated(true);
      setMessage("Acesso liberado por biometria.");
      await loadData();
    } catch {
      setMessage("Biometria não confirmada. Acesse novamente com o código enviado ao e-mail.");
      await signOut();
    }
  }

  async function downloadMachinesBackup() {
    if (!canDownloadBackup) {
      setUserMenuOpen(false);
      setMessage("Backup disponível apenas para usuário autorizado.");
      return;
    }

    setUserMenuOpen(false);
    setMessage("Atualizando backup no SharePoint.");
    try {
      await appAction("backupSharePoint");
      setMessage("Backup atualizado no SharePoint com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o backup no SharePoint.");
    }
  }

  function askConfirm(message: string, options: { title?: string; confirmLabel?: string; destructive?: boolean } = {}) {
    return new Promise<boolean>((resolve) => {
      confirmResolver.current?.(false);
      confirmResolver.current = resolve;
      setConfirmDialog({
        title: options.title ?? "Confirmar ação",
        message,
        confirmLabel: options.confirmLabel ?? "Confirmar",
        destructive: options.destructive ?? false
      });
    });
  }

  function answerConfirm(accepted: boolean) {
    confirmResolver.current?.(accepted);
    confirmResolver.current = null;
    setConfirmDialog(null);
  }

  useEffect(() => {
    if (!confirmDialog) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") answerConfirm(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmDialog]);

  async function resetClientSecretRotation() {
    if (!currentUserCanViewAdmin) {
      setMessage("Seu usuário não tem permissão para atualizar alertas administrativos.");
      return;
    }

    const confirmed = await askConfirm("Confirma que o CLIENT_SECRET foi rotacionado no Azure/Vercel e deseja reiniciar a contagem de 180 dias?", { title: "Reiniciar contagem", confirmLabel: "Reiniciar" });
    if (!confirmed) return;

    setMessage("Atualizando controle de rotação do CLIENT_SECRET.");
    try {
      await appAction("resetClientSecretRotation");
      await loadData();
      setMessage("Contagem de rotação do CLIENT_SECRET reiniciada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o controle de rotação.");
    }
  }

  async function saveUserProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = profileName.trim() || displayUserName(currentUserEmail);

    try {
      const result = await appAction<AuthorizedUser>("saveProfile", { display_name: displayName });
      if (result.data) {
        applyAuthorizedSession(currentUserId, currentUserEmail, result.data);
      } else {
        setCurrentUserName(displayName);
      }
      setProfileModalOpen(false);
      setMessage("Usuário atualizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.");
    }
  }

  function signaturePoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  }

  function shouldExpandSignaturePad() {
    return window.matchMedia("(max-width: 760px)").matches && !signatureExpanded;
  }

  async function openSignaturePad() {
    setSignatureExpanded(true);
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
      const orientation = screen.orientation as ScreenOrientation & { lock?: (orientation: "landscape") => Promise<void> };
      await orientation.lock?.("landscape");
    } catch {}
  }

  async function closeSignaturePad() {
    finishSignature();
    setSignatureExpanded(false);
    try {
      screen.orientation?.unlock?.();
      if (document.fullscreenElement) await document.exitFullscreen?.();
    } catch {}
  }

  function startSignature(event: PointerEvent<HTMLCanvasElement>) {
    if (serviceType !== "Visita técnica") return;
    if (shouldExpandSignaturePad()) {
      event.preventDefault();
      void openSignaturePad();
      return;
    }
    const canvas = signatureCanvasRef.current;
    const point = signaturePoint(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context) return;

    canvas.setPointerCapture(event.pointerId);
    context.strokeStyle = "#111111";
    context.lineWidth = 2.6;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
    setIsSigning(true);
  }

  function drawSignature(event: PointerEvent<HTMLCanvasElement>) {
    if (!isSigning || serviceType !== "Visita técnica") return;
    const canvas = signatureCanvasRef.current;
    const point = signaturePoint(event);
    const context = canvas?.getContext("2d");
    if (!canvas || !point || !context) return;

    context.lineTo(point.x, point.y);
    context.stroke();
  }

  function finishSignature(event?: PointerEvent<HTMLCanvasElement>) {
    if (!isSigning) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    if (event && canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    setIsSigning(false);
    setCustomerSignature(canvas.toDataURL("image/png"));
  }

  function clearSignature() {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    setCustomerSignature("");
    setIsSigning(false);
  }

  function updateServiceType(value: ServiceType) {
    setServiceType(value);
    if (value !== "Visita técnica") {
      setSignatureExpanded(false);
      clearSignature();
    }
  }

  function rememberServiceEmails(emails: string[]) {
    const normalizedEmails = emails
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);
    if (!normalizedEmails.length) return;

    setSavedServiceEmails((current) => {
      const currentEmails = current.map((email) => email.toLowerCase());
      const next = Array.from(new Set([...normalizedEmails, ...currentEmails])).slice(0, 80);
      window.localStorage.setItem(SERVICE_EMAIL_SUGGESTIONS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function selectServiceEmailSuggestion(email: string) {
    const parts = serviceRecipientsInput.split(/([;,\n])/);
    let lastTextIndex = parts.length - 1;
    while (lastTextIndex >= 0 && /[;,\n]/.test(parts[lastTextIndex])) lastTextIndex -= 1;
    if (lastTextIndex < 0) {
      setServiceRecipientsInput(`${email}; `);
    } else {
      parts[lastTextIndex] = ` ${email}`;
      setServiceRecipientsInput(`${parts.join("").replace(/^\s+/, "")}; `);
    }
    setServiceRecipientSuggestionsOpen(false);
  }

  async function imageFileToAttachment(file: File): Promise<ServiceAttachment> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      reader.readAsDataURL(file);
    });

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new window.Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      element.src = dataUrl;
    });

    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Não foi possível preparar a imagem.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: "image/jpeg",
      dataUrl: canvas.toDataURL("image/jpeg", 0.9),
      width: canvas.width,
      height: canvas.height,
      caption: ""
    };
  }

  async function addServiceAttachmentFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    event.target.value = "";
    if (!files.length) return;

    const available = MAX_SERVICE_ATTACHMENTS - serviceAttachments.length;
    if (available <= 0) {
      setMessage(`Limite de ${MAX_SERVICE_ATTACHMENTS} imagens por relatório atingido.`);
      return;
    }

    try {
      const nextAttachments = await Promise.all(files.slice(0, available).map(imageFileToAttachment));
      setServiceAttachments((current) => [...current, ...nextAttachments].slice(0, MAX_SERVICE_ATTACHMENTS));
      setMessage(files.length > available
        ? `Foram anexadas ${available} imagens. O limite por relatório é ${MAX_SERVICE_ATTACHMENTS}.`
        : `${nextAttachments.length} imagem(ns) anexada(s) ao relatório.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível anexar as imagens.");
    }
  }

  function updateServiceAttachmentCaption(id: string, caption: string) {
    setServiceAttachments((current) => current.map((attachment) => (
      attachment.id === id ? { ...attachment, caption } : attachment
    )));
  }

  function removeServiceAttachment(id: string) {
    setServiceAttachments((current) => current.filter((attachment) => attachment.id !== id));
  }

  function startNewService(machine?: Machine | null) {
    if (!currentUserCanEmitReports) {
      setMessage("Seu perfil não tem permissão para emitir relatórios.");
      return;
    }

    const machineLookup = machine ? serviceMachineLookupLabel(machine) : "";
    setSignatureExpanded(false);
    setEditingServiceRecord(null);
    setEditingPreviewRecipients(null);
    setServiceMachineLookupInput(machineLookup);
    setServiceMachineTouched(false);
    setSupportTechniciansInput("");
    setServiceRecipientsInput("");
    setServiceAttachments([]);
    setSelectedServiceRecord(null);
    updateServiceType("Acesso remoto");
    setView("service");
  }

  function closeServicePreview() {
    setServicePreview(null);
  }

  function editServiceFromPreview(record: ServiceRecord) {
    const recipients = servicePreview?.recipients ?? [];
    closeServicePreview();
    startServiceEdit(record, recipients);
  }

  function showFullHistory() {
    setHistoryFilter("");
    window.requestAnimationFrame(() => {
      document.getElementById("full-machine-history")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const filteredMachines = useMemo(() => {
    const term = machineFilter.trim().toLowerCase();
    return [...machines]
      .filter((machine) => {
        if (!term) return true;
        return [machine.code, machine.mechanical_list, machine.software_code, machine.ip_range, machine.vm, machine.model, machine.description, machine.client, machine.unit_city, machine.serial, machine.manufacture_month, machine.software_version, machine.remote_access, machine.access_method]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const direction = machineSort.direction === "asc" ? 1 : -1;
        let result = 0;

        if (machineSort.key === "last_service") result = compareDate(lastServiceDate(a), lastServiceDate(b));
        if (machineSort.key === "code") result = compareText(a.code, b.code);
        if (machineSort.key === "model") result = compareText(a.model, b.model);
        if (machineSort.key === "client") result = compareText(a.client, b.client);
        if (machineSort.key === "unit_city") result = compareText(a.unit_city, b.unit_city);
        if (machineSort.key === "serial") result = compareText(a.serial, b.serial);
        if (machineSort.key === "software_version") result = compareText(a.software_version, b.software_version);
        if (machineSort.key === "manufacture_month") result = monthYearSortValue(a.manufacture_month) - monthYearSortValue(b.manufacture_month);
        if (machineSort.key === "vm") result = compareText(a.vm, b.vm);

        return result * direction;
      });
  }, [machineFilter, machineSort, machines]);

  const registryMachines = useMemo(() => {
    return [...machines].sort((a, b) => {
      const key = registryMachineSort.key;
      const direction = registryMachineSort.direction === "asc" ? 1 : -1;
      let result: number;
      if (key === "manufacture_month") {
        result = monthYearSortValue(a.manufacture_month) - monthYearSortValue(b.manufacture_month);
      } else if (key === "remote_access") {
        result = compareText(a.remote_access || a.access_method || "Sem acesso remoto", b.remote_access || b.access_method || "Sem acesso remoto");
      } else {
        result = compareText(a[key], b[key]);
      }
      return result * direction || compareText(a.code, b.code) || compareText(a.id, b.id);
    });
  }, [machines, registryMachineSort]);

  const filteredHistory = useMemo(() => {
    const term = historyFilter.trim().toLowerCase();
    const records = finalizedServiceRecords(selectedMachine);
    return [...records]
      .filter((record) => {
        if (!term) return true;
        return [record.service_type, record.technician_name, record.equipment, record.issue_summary, record.request, record.diagnosis, record.service_done, record.observations, record.customer_name]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort((a, b) => {
        const direction = historySort.direction === "asc" ? 1 : -1;
        let result = 0;

        if (historySort.key === "service_date") result = compareDate(a.service_date, b.service_date);
        if (historySort.key === "equipment") result = compareText(a.equipment, b.equipment);
        if (historySort.key === "technician_name") result = compareText(a.technician_name, b.technician_name);
        if (historySort.key === "issue_summary") result = compareText(a.issue_summary, b.issue_summary);

        return result * direction;
      });
  }, [historyFilter, historySort, selectedMachine]);

  const sortedUsers = useMemo(() => {
    return [...authorizedUsers].sort((a, b) => {
      const direction = userSort.direction === "asc" ? 1 : -1;
      const result = userSort.key === "name"
        ? compareText(a.name, b.name)
        : userSort.key === "email"
          ? compareText(a.email, b.email)
          : compareText(a.role, b.role);
      return result * direction;
    });
  }, [authorizedUsers, userSort]);

  const sortedChatContacts = useMemo(() => {
    return [...chatContacts].sort((a, b) => {
      const companyCompare = compareText(a.company || "", b.company || "");
      if (companyCompare) return companyCompare;
      const nameCompare = compareText(a.name || "", b.name || "");
      if (nameCompare) return nameCompare;
      return compareText(a.phone, b.phone);
    });
  }, [chatContacts]);

  const clientSuggestions = useMemo(() => {
    return Array.from(new Set(
      machines
        .map((machine) => machine.client?.trim())
        .filter((client): client is string => Boolean(client))
    )).sort((a, b) => compareText(a, b));
  }, [machines]);

  const travelCodeSuggestions = useMemo(() => {
    return Array.from(new Set(
      travelSchedules
        .map((item) => item.code?.trim().toUpperCase())
        .filter((code): code is string => Boolean(code))
    )).sort((a, b) => compareText(a, b));
  }, [travelSchedules]);

  function toggleMachineSort(key: MachineSortKey) {
    setMachineSort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleRegistryMachineSort(key: RegistryMachineSortKey) {
    setRegistryMachineSort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleHistorySort(key: HistorySortKey) {
    setHistorySort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleUserSort(key: UserSortKey) {
    setUserSort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleTravelSort(key: TravelSortKey) {
    setTravelSort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleCompletedTravelSort(key: TravelSortKey) {
    setCompletedTravelSort((current) => ({ key, direction: nextDirection(current.key === key, current.direction) }));
  }

  function toggleActionMenu(id: string, event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (openActionMenu === id) {
      setOpenActionMenu("");
      setActionMenuPosition(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const right = Math.max(12, window.innerWidth - rect.right);
    const top = Math.min(rect.bottom + 6, window.innerHeight - 220);
    setActionMenuPosition({ top: Math.max(12, top), right });
    setOpenActionMenu(id);
  }

  function updateMachineForm<K extends keyof MachineFormState>(key: K, value: MachineFormState[K]) {
    setMachineForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "remote_access") {
        if (value === "Sem acesso remoto") {
          next.vnc_ip = "";
          next.vnc_user = "";
          next.vnc_password = "";
          next.vnc_vm_password = "";
          next.vnc_notes = "";
          next.sinema_url = "";
          next.sinema_user = "";
          next.sinema_password = "";
          next.sinema_notes = "";
        }

        if (value === "SINEMA") {
          next.vnc_ip = "";
          next.vnc_user = "";
          next.vnc_password = "";
          next.vnc_vm_password = "";
          next.vnc_notes = "";
        }

        if (value === "VNC") {
          next.sinema_url = "";
          next.sinema_user = "";
          next.sinema_password = "";
          next.sinema_notes = "";
        }
      }

      return next;
    });
  }

  async function saveMachine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanEditMachine) {
      setMessage("Seu usuário não tem permissão para alterar cadastros de máquinas.");
      return;
    }

    const normalizedCode = formatMachineProjectCodeInput(machineForm.code).trim().toUpperCase();
    if (!normalizedCode) {
      setMessage("Informe o código da máquina para salvar o cadastro.");
      return;
    }
    const normalizedSerial = machineForm.serial.trim().toUpperCase();
    const normalizedMechanicalList = machineForm.mechanical_list.trim().toUpperCase();
    const normalizedSoftwareCode = formatMachineProjectCodeInput(machineForm.software_code).trim().toUpperCase();
    const validationErrors = [
      validateCodePattern(normalizedCode, /^T-665 \d{4}$/, "Código da máquina"),
      validateCodePattern(normalizedSoftwareCode, /^T-665 \d{4}$/, "Código do software"),
      validateCodePattern(normalizedSerial, /^(500-\d{3}|500-\d{3}\/\d{2})$/, "Número de série"),
      validateCodePattern(normalizedMechanicalList, /^(500-\d{3}|T-0\d{3})$/, "Lista mecânica"),
      validateMonthYear(machineForm.manufacture_month, "Fabricação"),
      validateIpv4Like(machineForm.ip_range, "Faixa de IP", { allowWildcard: true }),
      validateIpv4Like(machineForm.vnc_ip, "IP de acesso VNC", { allowPort: true })
    ].filter(Boolean);

    const duplicate = machines.find((machine) => machine.id !== editingMachineId
      && normalizedCode
      && machine.code?.trim().toUpperCase() === normalizedCode
      && (machine.model ?? "").trim().toUpperCase() === machineForm.model.trim().toUpperCase());

    if (duplicate) {
      setMessage(`Já existe uma máquina cadastrada com o mesmo número de projeto e modelo: ${displayMachineCode(duplicate)} - ${duplicate.model || "Sem modelo"}.`);
      return;
    }

    if (validationErrors.length) {
      setMessage(validationErrors[0]);
      return;
    }

    const payload = {
      code: normalizedCode || null,
      model: machineForm.model.trim() || null,
      client: machineForm.client.trim() || null,
      unit_city: machineForm.unit_city.trim() || null,
      serial: normalizedSerial || null,
      description: machineForm.description.trim().slice(0, 160) || null,
      manufacture_month: normalizeMonthYear(machineForm.manufacture_month),
      mechanical_list: normalizedMechanicalList || null,
      software_code: normalizedSoftwareCode || null,
      ip_range: machineForm.ip_range.trim() || null,
      vm: machineForm.vm.trim() || null,
      software_version: machineForm.software_version.trim() || null,
      access_method: null,
      remote_access: machineForm.remote_access
    };

    let data: Machine;
    try {
      const result = await appAction<Machine>("saveMachine", {
        id: editingMachineId || null,
        ...payload,
        vnc_ip: machineForm.vnc_ip,
        vnc_user: machineForm.vnc_user,
        vnc_password: machineForm.vnc_password,
        vnc_vm_password: machineForm.vnc_vm_password,
        vnc_notes: machineForm.vnc_notes,
        sinema_url: machineForm.sinema_url,
        sinema_user: machineForm.sinema_user,
        sinema_password: machineForm.sinema_password,
        sinema_notes: machineForm.sinema_notes
      });
      if (!result.data) throw new Error("Máquina não salva.");
      data = result.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a máquina.");
      return;
    }

    setEditingMachineId("");
    setSelectedMachineId(data.id);
    setMessage(`Máquina ${payload.code || "sem código"} salva com sucesso.`);
    setMachineForm(EMPTY_MACHINE_FORM);
    await loadData();
    setRegistryTab("machines");
    setView("registry");
  }

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanManageUsers) {
      setMessage("Seu usuário não tem permissão para cadastrar ou alterar usuários.");
      return;
    }

    const payload = {
      name: userForm.name.trim(),
      email: userForm.email.trim().toLowerCase(),
      role: userForm.role,
      phone: userForm.phone.replace(/\D/g, ""),
      remote_access_allowed: userForm.remote_access_allowed,
      credential_access_allowed: userForm.credential_access_allowed
    };

    if (!payload.name || !payload.email) {
      setMessage("Informe nome e e-mail do usuário.");
      return;
    }

    if (!isCorporateEmail(payload.email)) {
      setMessage("Cadastre apenas e-mails corporativos da Tomasoni.");
      return;
    }

    let savedUser: AuthorizedUser;
    try {
      const result = await appAction<AuthorizedUser>("saveUser", { id: editingUserId || null, ...payload });
      if (!result.data) throw new Error("Usuário não salvo.");
      savedUser = result.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o usuário.");
      return;
    }
    setEditingUserId("");
    setAuthorizedUsers((current) => {
      const withoutSaved = current.filter((user) => user.id !== savedUser.id);
      return [...withoutSaved, savedUser].sort((a, b) => compareText(a.name, b.name));
    });
    setMessage("Usuário salvo com sucesso.");
    setUserForm(EMPTY_USER_FORM);
    event.currentTarget.reset();
    await loadData();
  }

  function editChatContact(contact: ChatContact) {
    if (!currentUserCanUseRemoteAccess) {
      setMessage("Seu usuário não tem permissão para editar clientes do Acesso Remoto.");
      return;
    }

    setEditingContact(contact);
    setContactForm({
      name: contact.name ?? "",
      company: contact.company ?? "",
      phone: contact.phone
    });
    setOpenActionMenu("");
  }

  async function saveChatContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanUseRemoteAccess || !editingContact) {
      setMessage("Seu usuário não tem permissão para editar clientes do Acesso Remoto.");
      return;
    }

    const payload = {
      name: contactForm.name.trim() || null,
      company: contactForm.company.trim() || null,
      phone: contactForm.phone.replace(/\D/g, ""),
      updated_at: new Date().toISOString()
    };

    if (!payload.phone) {
      setMessage("Informe um telefone válido para o cliente.");
      return;
    }

    try {
      await appAction<ChatContact>("saveChatContact", { id: editingContact.id, ...payload });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar o cliente.");
      return;
    }

    setEditingContact(null);
    setContactForm(EMPTY_CHAT_CONTACT_FORM);
    setMessage("Cliente atualizado com sucesso.");
    await loadData();
  }

  async function saveTravelSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanEditSchedule) {
      setMessage("Seu usuário tem acesso apenas para visualizar o cronograma.");
      return;
    }

    const validationErrors = [
      validateDayMonth(travelForm.start_date, "Data de início"),
      validateDayMonth(travelForm.end_date, "Data de fim"),
      validateCodePattern(travelForm.code, TRAVEL_CODE_PATTERN, "Código do cliente")
    ].filter(Boolean);

    if (validationErrors.length) {
      setMessage(validationErrors[0]);
      return;
    }

    const payload = {
      start_date: travelForm.start_date.trim(),
      end_date: travelForm.end_date.trim(),
      code: travelForm.code.trim().toUpperCase() || null,
      client: travelForm.client.trim() || null,
      technicians: travelForm.technicians.trim() || null,
      status: travelForm.status.trim() || null,
      reason: travelForm.reason.trim() || null
    };

    try {
      await appAction<TravelSchedule>("saveTravel", { id: editingTravelId || null, ...payload });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o cronograma.");
      return;
    }

    setEditingTravelId("");
    setTravelForm(EMPTY_TRAVEL_FORM);
    setMessage("Cronograma salvo com sucesso.");
    await loadData();
  }

  function editTravelSchedule(item: TravelSchedule) {
    setEditingTravelId(item.id);
    setTravelForm({
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      code: item.code ?? "",
      client: item.client ?? "",
      technicians: item.technicians ?? "",
      status: item.status ?? "A definir",
      reason: item.reason ?? ""
    });
    setScheduleTab("travel");
  }

  function updateContractMachine(machineId: string) {
    const machine = machines.find((item) => item.id === machineId);
    setContractForm((current) => ({
      ...current,
      machine_id: machineId,
      code: machine?.code ?? current.code,
      client: machine?.client ?? current.client,
      serial: machine?.serial ?? current.serial
    }));
  }

  function updateContractSerial(serial: string) {
    const matchingMachine = machines.find((machine) => normalizeLookup(machine.serial) === normalizeLookup(serial));
    setContractForm((current) => ({
      ...current,
      serial,
      machine_id: matchingMachine?.id ?? "",
      code: matchingMachine?.code ?? current.code,
      client: matchingMachine?.client ?? current.client
    }));
  }

  async function saveSupportContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanManageContracts) {
      setMessage("Seu usuário não tem permissão para cadastrar ou alterar contratos.");
      return;
    }

    setMessage("Salvando contrato...");
    const contractDateError = validateFullDate(contractForm.support_contract_until, "Final de vigência");
    if (contractDateError) {
      setMessage(contractDateError);
      return;
    }

    const payload = {
      machine_id: contractForm.machine_id || null,
      code: contractForm.code.trim().toUpperCase() || null,
      client: contractForm.client.trim() || null,
      serial: contractForm.serial.trim().toUpperCase() || null,
      contract_type: contractForm.contract_type.trim() || null,
      status: contractForm.status,
      active: contractForm.status === "Ativo",
      support_contract_until: normalizeFullDate(contractForm.support_contract_until) || null
    };

    try {
      await appAction<SupportContract>("saveContract", { id: editingContractId || null, ...payload });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o contrato.");
      return;
    }

    setEditingContractId("");
    setContractForm(EMPTY_CONTRACT_FORM);
    setMessage("Contrato salvo com sucesso.");
    await loadData();
  }

  function editSupportContract(contract: SupportContract) {
    setEditingContractId(contract.id);
    setContractForm({
      machine_id: contract.machine_id ?? "",
      code: contract.code ?? "",
      client: contract.client ?? "",
      serial: contract.serial ?? "",
      contract_type: contract.contract_type ?? "",
      support_contract_until: formatDate(contract.support_contract_until) === "-" ? "" : formatDate(contract.support_contract_until),
      status: contractStatus(contract)
    });
  }

  async function deleteSupportContract(id: string) {
    if (!currentUserCanManageContracts) {
      setMessage("Seu usuario nao tem permissao para excluir contratos.");
      return;
    }
    if (!(await askConfirm("Excluir este contrato?", { title: "Excluir contrato", confirmLabel: "Excluir", destructive: true }))) return;
    try {
      await appAction("delete", { table: "support_contracts", id });
      setMessage("Contrato excluido.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o contrato.");
    }
  }

  async function sendServiceEmail(machine: Machine, record: ServiceRecord, recipients: string[]) {
    const customerRecipients = clientServiceRecipients(recipients, record.technician_email);
    const blindCopyRecipients = serviceReportRecipients([], record.technician_email);
    if (!customerRecipients.length && !blindCopyRecipients.length) {
      return "Atendimento salvo e PDF gerado. Nenhum e-mail foi informado para envio.";
    }

    const pdfRecord = serviceRecordWithTechnicianRole(record, authorizedUsers);
    const pdfBase64 = await servicePdfBase64(machine, pdfRecord);
    const emailMessage = serviceEmailMessage(machine, pdfRecord);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    const response = await fetch("/api/send-service-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: customerRecipients,
        bcc: blindCopyRecipients,
        subject: serviceEmailSubject(machine, pdfRecord),
        text: emailMessage.text,
        html: emailMessage.html,
        filename: servicePdfFileName(machine, pdfRecord),
        machineCode: displayMachineCode(machine),
        pdfBase64
      }),
      signal: controller.signal
    }).finally(() => window.clearTimeout(timeout));

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      return "Atendimento salvo e PDF gerado, mas o e-mail nao foi enviado. Detalhe: " + (result?.error ?? "erro nao informado");
    }

    rememberServiceEmails(clientServiceRecipients(recipients, record.technician_email));
    const deliverySummary = customerRecipients.length
      ? customerRecipients.join("; ") + (blindCopyRecipients.length ? " com CCO para " + blindCopyRecipients.join("; ") : "")
      : "CCO para " + blindCopyRecipients.join("; ");
    if (result?.sharePoint?.error) {
      return "Atendimento salvo e e-mail enviado para " + deliverySummary + ", mas o PDF não foi salvo no SharePoint. Detalhe: " + result.sharePoint.error;
    }

    if (result?.sharePoint?.skipped) {
      return "Atendimento salvo e e-mail enviado para " + deliverySummary + ". Backup do PDF no SharePoint não configurado.";
    }

    return "Atendimento salvo, PDF gerado, e-mail enviado para " + deliverySummary + " e PDF salvo no SharePoint.";
  }

  function pdfReadyServiceRecord(record: ServiceRecord) {
    return serviceRecordWithTechnicianRole(record, authorizedUsers);
  }

  async function syncServiceReportSharePoint(
    mode: "upload" | "archive",
    machine: Machine,
    record: ServiceRecord,
    filename = servicePdfFileName(machine, record)
  ) {
    const payload: Record<string, unknown> = {
      mode,
      recordId: record.id,
      machineCode: displayMachineCode(machine),
      filename
    };

    if (mode === "upload") {
      payload.pdfBase64 = await servicePdfBase64(machine, serviceRecordWithTechnicianRole(record, authorizedUsers));
    }

    const result = await appAction<{
      skipped?: boolean;
      error?: string;
      message?: string;
    }>("syncServiceReportSharePoint", payload);

    if (result.data?.error) {
      throw new Error(result.data.error);
    }

    return result.data;
  }

  async function sendPreviewServiceEmail() {
    if (!servicePreview || !previewMachine || servicePreviewSending) return;

    setServicePreviewSending(true);
    setMessage(servicePreview.recipients.length ? "Enviando e-mail com o relatorio em anexo." : "Finalizando atendimento e salvando PDF.");
    try {
      let resultMessage = "";
      if (servicePreview.finalizeOnSend && !servicePreview.recipients.length) {
        try {
          await syncServiceReportSharePoint("upload", previewMachine, servicePreview.record);
          resultMessage = "Atendimento salvo, PDF gerado e salvo no SharePoint. Nenhum e-mail foi informado para envio.";
        } catch (error) {
          const detail = error instanceof Error ? error.message : "erro nao informado";
          resultMessage = "Atendimento salvo e PDF gerado, mas o PDF não foi salvo no SharePoint. Nenhum e-mail foi informado para envio. Detalhe: " + detail + ".";
        }
      } else {
        resultMessage = await sendServiceEmail(previewMachine, servicePreview.record, servicePreview.recipients);
      }
      if (servicePreview.finalizeOnSend) {
        if (resultMessage.includes("e-mail nao foi enviado")) {
          setMessage(resultMessage + " A prévia continua pendente para nova tentativa.");
          return;
        }
        await appAction<ServiceRecord>("finalizeService", { id: servicePreview.record.id });
        await loadData();
        setMessage(resultMessage + " Atendimento finalizado.");
      } else {
        setMessage(resultMessage);
      }
      closeServicePreview();
    } catch (error) {
      const detail = error instanceof DOMException && error.name === "AbortError"
        ? "tempo limite do envio atingido"
        : error instanceof Error
          ? error.message
          : "erro nao informado";
      setMessage("Atendimento salvo e PDF gerado, mas o e-mail nao foi confirmado. Detalhe: " + detail + ".");
    } finally {
      setServicePreviewSending(false);
    }
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!currentUserCanEmitReports) {
      setMessage("Seu perfil nao tem permissao para emitir relatorios.");
      return;
    }

    const isEditingService = Boolean(editingServiceRecord);
    const previousServiceRecord = editingServiceRecord;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const submitMode = submitter?.value === "draft" ? "draft" : submitter?.value === "finalize" ? "finalize" : "update";
    const isDraftSave = submitMode === "draft";
    const isFinalizeFlow = submitMode === "finalize";
    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const machineLookupValue = String(form.get("machine_lookup") ?? serviceMachineLookupInput);
    const machine = findMachineByLookup(machines, machineLookupValue);
    const typedCustomerRecipients = parseEmails(serviceRecipientsInput || String(form.get("service_recipients") ?? ""));
    const existingCustomerRecipients = clientServiceRecipients(editingServiceRecord?.report_recipients ?? [], editingServiceRecord?.technician_email);
    const customerRecipients = (!editingServiceRecord || isServiceDraft(editingServiceRecord) || editingPreviewRecipients !== null)
      ? typedCustomerRecipients
      : existingCustomerRecipients;
    const serviceRecipients = serviceReportRecipients(customerRecipients, editingServiceRecord?.technician_email ?? currentUserEmail);
    const supportTechnicians = parseServiceTechnicianInput(String(form.get("support_technicians") ?? supportTechniciansInput), authorizedUsers);
    const previewRecipients = isFinalizeFlow || editingPreviewRecipients !== null || !isEditingService ? serviceRecipients : editingPreviewRecipients;
    const shouldOpenPreview = isFinalizeFlow || editingPreviewRecipients !== null;

    if (!machine) {
      setServiceMachineTouched(true);
      setMessage("Máquina não cadastrada. Selecione uma opção válida das sugestões antes de salvar.");
      return;
    }

    if (editingServiceRecord && editingServiceRecord.created_by !== currentUserId) {
      setMessage("Este atendimento so pode ser alterado pelo usuario que lancou o registro.");
      return;
    }

    const selectedServiceType = normalizeServiceType(String(form.get("service_type") ?? serviceType));
    const serviceStart = String(form.get("service_start") ?? "").trim();
    const serviceEnd = String(form.get("service_end") ?? "").trim();
    const serviceDateErrors = [
      validateServiceDateTime(serviceStart, "Inicio de atendimento"),
      validateServiceDateTime(serviceEnd, "Fim de atendimento")
    ].filter(Boolean);

    if (serviceDateErrors.length) {
      setMessage(serviceDateErrors[0]);
      return;
    }

    const serviceDate = extractDateFromServiceDateTime(serviceStart)
      || editingServiceRecord?.service_date
      || new Date().toISOString().slice(0, 10);

    const payload = {
      id: editingServiceRecord?.id ?? null,
      machine_id: machine.id,
      support_technicians: supportTechnicians,
      service_type: selectedServiceType,
      service_date: serviceDate,
      service_start: serviceStart || null,
      service_end: serviceEnd || null,
      equipment: String(form.get("equipment") ?? "").trim() || null,
      issue_summary: String(form.get("issue_summary") ?? "").trim() || null,
      request: String(form.get("request") ?? "").trim(),
      diagnosis: String(form.get("diagnosis") ?? "").trim(),
      service_done: String(form.get("service_done") ?? "").trim(),
      observations: String(form.get("observations") ?? "").trim() || null,
      customer_name: selectedServiceType === "Visita técnica" ? String(form.get("customer_name") ?? "").trim() || null : null,
      customer_signature: selectedServiceType === "Visita técnica" ? customerSignature || null : null,
      attachments: serviceAttachments,
      report_status: isDraftSave ? "Rascunho" : isFinalizeFlow ? "Rascunho" : "Finalizado",
      report_recipients: serviceRecipients
    };

    let record: ServiceRecord;
    try {
      const result = await appAction<ServiceRecord>("saveService", payload);
      if (!result.data) throw new Error("Atendimento nao salvo.");
      record = result.data;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o atendimento.");
      return;
    }

    let sharePointMessage = "";
    if (isEditingService && previousServiceRecord && !isServiceDraft(record)) {
      try {
        const previousFilename = servicePdfFileName(machine, previousServiceRecord);
        const currentFilename = servicePdfFileName(machine, record);
        await syncServiceReportSharePoint("upload", machine, record, currentFilename);
        if (previousFilename !== currentFilename) {
          await syncServiceReportSharePoint("archive", machine, previousServiceRecord, previousFilename);
        }
        sharePointMessage = " Espelho do SharePoint atualizado.";
      } catch (error) {
        const detail = error instanceof Error ? error.message : "erro nao informado";
        sharePointMessage = " O atendimento foi salvo, mas o espelho do SharePoint nao foi atualizado. Detalhe: " + detail + ".";
      }
    }

    setSelectedMachineId(machine.id);
    setMessage(isDraftSave
      ? "Prévia salva. Ela ficará disponível acima do histórico para revisão e finalização."
      : shouldOpenPreview
        ? "Atendimento salvo. Preparando previa do PDF."
        : "Atendimento atualizado com sucesso." + sharePointMessage);
    setSignatureExpanded(false);
    setEditingServiceRecord(null);
    setEditingPreviewRecipients(null);
    setSelectedServiceRecord(null);
    formElement.reset();
    setServiceMachineLookupInput("");
    setServiceMachineTouched(false);
    setSupportTechniciansInput("");
    setServiceRecipientsInput("");
    setServiceAttachments([]);
    updateServiceType("Acesso remoto");
    await loadData();
    setView("machineDetail");

    if (shouldOpenPreview) {
      try {
        const pdfUrl = await servicePdfPreviewUrl(machine, pdfReadyServiceRecord(record));
        setServicePreview({ machineId: machine.id, record, recipients: previewRecipients ?? [], pdfUrl, finalizeOnSend: isFinalizeFlow || isServiceDraft(record) });
        setMessage("Atendimento salvo. Revise a previa do PDF antes do envio.");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "erro nao informado";
        setMessage("Atendimento salvo, mas a previa do PDF nao foi gerada. Detalhe: " + detail + ".");
      }
    }
  }

  async function openServiceRecord(record: ServiceRecord) {
    setSelectedServiceRecord(record);
    if (!needsHeavyFields(record)) return;
    try {
      const fullRecord = await hydrateServiceRecord(record);
      setSelectedServiceRecord((current) => current?.id === record.id ? fullRecord : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os anexos do atendimento.");
    }
  }

  async function startServiceEdit(sourceRecord: ServiceRecord, preservedRecipients: string[] | null = null) {
    if (!currentUserCanEmitReports) {
      setMessage("Seu perfil nao tem permissao para alterar relatorios.");
      return;
    }
    if (sourceRecord.created_by !== currentUserId) {
      setMessage("Este atendimento so pode ser alterado pelo usuario que lancou o registro.");
      return;
    }

    let record = sourceRecord;
    try {
      record = await hydrateServiceRecord(sourceRecord);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os anexos do atendimento.");
      return;
    }

    setSelectedMachineId(record.machine_id);
    setSelectedServiceRecord(null);
    setEditingServiceRecord(record);
    setEditingPreviewRecipients(preservedRecipients);
    setServiceMachineLookupInput(serviceMachineLookupLabel(machines.find((machine) => machine.id === record.machine_id)));
    setServiceMachineTouched(false);
    setSupportTechniciansInput(formatServiceTechniciansInput(record.support_technicians));
    setServiceRecipientsInput(clientServiceRecipients(preservedRecipients ?? (isServiceDraft(record) ? record.report_recipients ?? [] : []), record.technician_email).join("; "));
    setView("service");
  }

  async function openServiceDraftPreview(record: ServiceRecord) {
    const machine = machines.find((item) => item.id === record.machine_id) ?? selectedMachine;
    if (!machine) {
      setMessage("Não foi possível localizar a máquina para gerar a prévia.");
      return;
    }

    try {
      setMessage("Preparando prévia do relatório.");
      const pdfUrl = await servicePdfPreviewUrl(machine, pdfReadyServiceRecord(record));
      setServicePreview({
        machineId: machine.id,
        record,
        recipients: serviceReportRecipients(record.report_recipients ?? [], record.technician_email),
        pdfUrl,
        finalizeOnSend: true
      });
      setMessage("Revise a prévia. Ao finalizar, o PDF será gerado e enviado.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "erro nao informado";
      setMessage("A prévia do relatório não foi gerada. Detalhe: " + detail + ".");
    }
  }

  async function deleteByAction(table: string, id: string, successMessage: string) {
    try {
      await appAction("delete", { table, id });
      setMessage(successMessage);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o registro.");
    }
  }

  async function deleteMachine(id: string) {
    if (!(await askConfirm("Excluir esta máquina e todo o histórico de atendimentos?", { title: "Excluir máquina", confirmLabel: "Excluir", destructive: true }))) return;
    await deleteByAction("machines", id, "Máquina excluída.");
  }

  async function deleteUser(id: string) {
    if (!currentUserCanManageUsers) {
      setMessage("Seu usuario nao tem permissao para excluir usuarios.");
      return;
    }
    if (!(await askConfirm("Excluir este técnico?", { title: "Excluir técnico", confirmLabel: "Excluir", destructive: true }))) return;
    await deleteByAction("authorized_users", id, "Tecnico excluido.");
  }

  async function deleteChatContact(id: string) {
    if (!currentUserCanUseRemoteAccess) {
      setMessage("Seu usuario nao tem permissao para excluir clientes do Acesso Remoto.");
      return;
    }
    if (!confirm("Excluir este cliente do Acesso Remoto? As conversas permanecem no historico, mas perdem o vinculo com o cadastro do cliente.")) return;
    await deleteByAction("chat_contacts", id, "Cliente excluido.");
  }

  async function deleteTravelSchedule(id: string) {
    if (!currentUserCanEditSchedule) {
      setMessage("Seu usuario tem acesso apenas para visualizar o cronograma.");
      return;
    }
    if (!(await askConfirm("Excluir este item do cronograma?", { title: "Excluir item", confirmLabel: "Excluir", destructive: true }))) return;
    await deleteByAction("travel_schedules", id, "Item do cronograma excluido.");
  }

  async function deleteServiceRecord(record: ServiceRecord) {
    if (!currentUserHasFullAccess && (!currentUserCanEmitReports || record.created_by !== currentUserId)) {
      setMessage("Este atendimento so pode ser excluido pelo autor ou por usuario com acesso total.");
      return;
    }
    const deletingDraft = isServiceDraft(record);
    if (!(await askConfirm(deletingDraft ? "Excluir esta prévia não finalizada?" : "Excluir este atendimento?", { title: deletingDraft ? "Excluir prévia" : "Excluir atendimento", confirmLabel: "Excluir", destructive: true }))) return;
    const machine = machines.find((item) => item.id === record.machine_id) ?? selectedMachine;
    const filename = machine ? servicePdfFileName(machine, record) : "";
    try {
      await appAction("delete", { table: "service_records", id: record.id });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o atendimento.");
      return;
    }
    if (deletingDraft) {
      setMessage("Prévia excluída.");
      setSelectedServiceRecord(null);
      return;
    }
    if (machine && filename) {
      try {
        await syncServiceReportSharePoint("archive", machine, record, filename);
        setMessage("Atendimento excluido. PDF movido para Relatórios excluídos no SharePoint.");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "erro nao informado";
        setMessage("Atendimento excluido, mas o PDF não foi arquivado no SharePoint. Detalhe: " + detail + ".");
      }
    } else {
      setMessage("Atendimento excluido. Não foi possível localizar a máquina para arquivar o PDF no SharePoint.");
    }
    setSelectedServiceRecord(null);
  }

  async function assignChat(conversation: ChatConversation, userEmail = currentUserEmail) {
    const normalizedTargetEmail = userEmail.toLowerCase();
    const assigningToSelf = normalizedTargetEmail === currentUserEmail.toLowerCase();

    if (assigningToSelf && remoteAccessStatus !== "Online") {
      setMessage("Seu status precisa estar Online para assumir uma conversa sem atribuicao.");
      return;
    }

    if (!assigningToSelf && !availableTransferUsers.some((user) => user.email.toLowerCase() === normalizedTargetEmail)) {
      setMessage("Transferencia permitida somente para usuarios Online.");
      return;
    }

    const target = authorizedUsers.find((user) => user.email.toLowerCase() === userEmail.toLowerCase());
    const assignedName = target?.name || displayUserName(userEmail);
    try {
      await appAction("assignChat", { conversationId: conversation.id, userEmail: normalizedTargetEmail });
      setMessage("Conversa atribuida para " + assignedName + ".");
      setTransferDialogOpen(false);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atribuir a conversa.");
    }
  }

  async function closeChat(conversation: ChatConversation) {
    if (!confirm("Encerrar esta conversa?")) return;
    try {
      await appAction("closeChat", { conversationId: conversation.id });
      setMessage("Conversa encerrada.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível encerrar a conversa.");
    }
  }

  async function sendChatReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedChat) return;
    if (!canReplySelectedChat) {
      setMessage("Seu status atual nao permite responder esta conversa.");
      return;
    }
    const body = chatReply.trim();
    if (!body) return;

    const response = await fetch("/api/whatsapp/send-message", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: selectedChat.id, body })
    });

    const result = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(result?.error ?? "Não foi possível enviar a mensagem.");
      return;
    }

    setChatReply("");
    setMessage(result?.deliveryMode === "whatsapp" ? "Mensagem enviada pelo WhatsApp." : "Mensagem salva em modo de validacao. Configure a API do WhatsApp para envio externo.");
    await loadData();
  }

  async function openChatMedia(message: ChatMessage) {
    if (!message.media_id) return;

    const response = await fetch("/api/whatsapp/media/" + encodeURIComponent(message.media_id), {
      credentials: "include"
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setMessage(result?.error ?? "Não foi possível abrir a mídia do WhatsApp.");
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
  if (!sessionReady) return <main className="centered">Carregando...</main>;

  if (biometricRequired) {
    return (
      <main className="login-page">
        <section className="login-card">
          <Image className="login-logo" src="/tomasoni-logo-clean.png?v=20260827-transparent" alt="Tomasoni" width={300} height={80} priority />
          <h1>Confirmar acesso</h1>
          <p>Use a biometria deste dispositivo para abrir o app. A renovação de acesso por e-mail continua sendo solicitada a cada 7 dias.</p>
          <button className="button primary" type="button" onClick={() => void confirmBiometricAccess()}>Confirmar por biometria</button>
          <button className="link-button auth-secondary-action" type="button" onClick={() => void signOut()}>Entrar com código</button>
          {message !== DEFAULT_MESSAGE && <span className="form-message">{message}</span>}
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="login-page">
        <form className="login-card" onSubmit={signIn}>
          <Image className="login-logo" src="/tomasoni-logo-clean.png?v=20260827-transparent" alt="Tomasoni" width={300} height={80} priority />
          <label>
            E-mail corporativo
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder={`nome@${ALLOWED_EMAIL_DOMAINS[0]}`} required disabled={otpSent} />
          </label>
          {otpSent && (
            <label>
              Código de acesso
              <input value={otpCode} onChange={(event) => setOtpCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" placeholder="Digite o código recebido" required />
            </label>
          )}
          <button className="button primary" type="submit" disabled={authLoading}>{authLoading ? "Enviando..." : otpSent ? "Confirmar código" : "Enviar código de acesso"}</button>
          {otpSent && <button className="link-button auth-secondary-action" type="button" disabled={authLoading} onClick={() => { setOtpSent(false); setOtpCode(""); setMessage(DEFAULT_MESSAGE); }}>Alterar e-mail</button>}
          {message !== DEFAULT_MESSAGE && <span className="form-message">{message}</span>}
        </form>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><Image src="/tomasoni-logo-clean.png?v=20260827-transparent" alt="Tomasoni" width={220} height={59} priority /></div>
        <nav className="side-nav">
          <button className={`nav-item ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}><NavIcon name="home" /><span>Tela inicial</span></button>
          <button className={`nav-item ${view === "overview" ? "active" : ""}`} onClick={() => setView("overview")}><NavIcon name="overview" /><span>Visão geral</span></button>
          {currentUserCanUseRemoteAccess && <button className={`nav-item ${view === "chat" ? "active" : ""}`} onClick={() => setView("chat")}><NavIcon name="remote" /><span>Acesso Remoto</span></button>}
          <button className={`nav-item ${view === "schedule" ? "active" : ""}`} onClick={() => setView("schedule")}><NavIcon name="schedule" /><span>Cronograma</span></button>
          {(currentUserCanEditMachine || currentUserCanManageUsers || currentUserCanUseRemoteAccess) && <button className={`nav-item ${view === "registry" ? "active" : ""}`} onClick={() => { setRegistryTab(currentUserCanEditMachine ? "machines" : currentUserCanUseRemoteAccess ? "clients" : "users"); setView("registry"); }}><NavIcon name="registry" /><span>Cadastro</span></button>}
          {currentUserCanViewAdmin && <button className={`nav-item ${view === "admin" ? "active" : ""}`} onClick={() => setView("admin")}><NavIcon name="admin" /><span>Administração</span></button>}
        </nav>
        <div className="user-menu">
          <button className="user-menu-trigger" type="button" onClick={() => setUserMenuOpen((open) => !open)} aria-expanded={userMenuOpen}>
            <span className="avatar">{initialsFromEmail(currentUserEmail)}</span>
            <span className="user-meta">
              <strong>{currentUserName || displayUserName(currentUserEmail)}</strong>
              <small>{currentUserRole || "Usuário autorizado"}</small>
              {currentUserCanUseRemoteAccess && (
                <span className="remote-status-line">
                  <span className={`remote-status-dot ${remoteAccessStatusClass(remoteAccessStatus)}`} />
                  {remoteAccessStatus}
                </span>
              )}
            </span>
            <MoreIcon />
          </button>
          {userMenuOpen && (
            <div className="user-menu-content">
              {currentUserCanUseRemoteAccess && (
                <>
                  <button type="button" onClick={() => updateRemoteAccessStatus("Online")}><span className="menu-status-dot online" /> Online</button>
                  <button type="button" onClick={() => updateRemoteAccessStatus("Ocupado")}><span className="menu-status-dot busy" /> Ocupado</button>
                  <button type="button" onClick={() => updateRemoteAccessStatus("Offline")}><span className="menu-status-dot offline" /> Offline</button>
                </>
              )}
              {canDownloadBackup && <button type="button" onClick={downloadMachinesBackup}><PdfDownloadIcon /> Backup SharePoint</button>}
              <button type="button" onClick={signOut}><LogOutIcon /> Sair</button>
            </div>
          )}
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h1>Núcleo de Assistência</h1>
          </div>
          <div className="topbar-actions">
            <button className="icon-button utility-action" type="button" title="Ajuda da tela" aria-label="Ajuda da tela" onClick={() => setHelpOpen(true)}><HelpIcon /></button>
            <button className="icon-button utility-action" type="button" title={theme === "dark" ? "Modo claro" : "Modo escuro"} aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"} onClick={toggleTheme}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
            {currentUserCanEmitReports && <button className="icon-button add-action" type="button" title="Novo atendimento" aria-label="Novo atendimento" onClick={() => startNewService()}><PlusIcon /></button>}
          </div>
        </header>

        <section className="status-band">
          <strong>{screenLegend(view, registryTab, selectedMachine)}</strong>
          {message !== DEFAULT_MESSAGE && <span>{message}</span>}
        </section>

        {view === "chat" && currentUserCanUseRemoteAccess && (
          <section className="view active chat-page">
            <section className="chat-shell">
              <aside className="chat-list-panel">
                <div className="section-header">
                  <h2>Acesso Remoto</h2>
                  <span>{chatConversations.length} registros</span>
                </div>
                <div className="chat-conversation-list">
                  {chatConversations.map((conversation) => {
                    const lastMessage = [...(conversation.chat_messages ?? [])].sort((a, b) => compareDate(b.created_at, a.created_at))[0];
                    return (
                      <button key={conversation.id} className={selectedChat?.id === conversation.id ? "active" : ""} type="button" onClick={() => setSelectedChatId(conversation.id)}>
                        <strong>{conversation.customer_name || conversation.customer_phone}</strong>
                        <span>{lastMessage?.body || "Sem mensagens"}</span>
                        <small>{chatStatusLabel(conversation.status)} · {formatDateTime(conversation.last_message_at)}</small>
                      </button>
                    );
                  })}
                  {!chatConversations.length && <p className="empty-state">Nenhuma conversa recebida ainda.</p>}
                </div>
              </aside>

              <section className="chat-main-panel">
                {selectedChat ? (
                  <>
                    <div className="chat-header">
                      <div>
                        <span className="section-kicker">Cliente</span>
                        <h2>{selectedChat.customer_name || selectedChat.customer_phone}</h2>
                        <p>{selectedChat.customer_phone} · {chatStatusLabel(selectedChat.status)}</p>
                      </div>
                      <div className="chat-actions">
                        {canAssumeSelectedChat && <button className="button ghost" type="button" onClick={() => void assignChat(selectedChat)}>Assumir</button>}
                        {selectedChat.status !== "closed" && <button className="button ghost" type="button" onClick={() => setTransferDialogOpen(true)} disabled={!canTransferSelectedChat}>Transferir</button>}
                        {selectedChat.status !== "closed" && <button className="button danger-button" type="button" onClick={() => void closeChat(selectedChat)}>Encerrar</button>}
                      </div>
                    </div>

                    <div className="chat-meta-strip">
                      <span>Responsável: <strong>{selectedChat.assigned_to_name || "Sem responsável"}</strong></span>
                      <span>Última mensagem: <strong>{formatDateTime(selectedChat.last_message_at)}</strong></span>
                      <span>Empresa: <strong>{selectedChat.customer_company || "-"}</strong></span>
                      <span>Máquina: <strong>{selectedChat.machine_code || selectedChat.machine_serial || "-"}</strong></span>
                    </div>

                    <div className="chat-message-list">
                      {[...(selectedChat.chat_messages ?? [])].sort((a, b) => compareDate(a.created_at, b.created_at)).map((chatMessage) => (
                        <article key={chatMessage.id} className={`chat-message ${chatMessage.direction}`}>
                          <div>
                            <strong>{chatMessage.direction === "inbound" ? (chatMessage.sender_name || selectedChat.customer_name || "Cliente") : chatMessage.direction === "system" ? "Sistema" : (chatMessage.sender_name || "Técnico")}</strong>
                            <small>{formatDateTime(chatMessage.created_at)}</small>
                          </div>
                          <p>{chatMessage.body}</p>
                          {chatMessage.media_id && (
                            <button className="chat-media-button" type="button" onClick={() => void openChatMedia(chatMessage)}>
                              {chatMediaLabel(chatMessage)}
                            </button>
                          )}
                        </article>
                      ))}
                    </div>

                    <form className="chat-reply-form" onSubmit={sendChatReply}>
                      <textarea value={chatReply} onChange={(event) => setChatReply(event.target.value)} placeholder="Digite a resposta ao cliente..." disabled={!canReplySelectedChat} />
                      <button className="button primary" type="submit" disabled={!canReplySelectedChat || !chatReply.trim()}>Enviar resposta</button>
                    </form>
                  </>
                ) : (
                  <div className="chat-empty-panel">
                    <h2>Nenhuma conversa selecionada</h2>
                    <p>Quando o Webhook receber mensagens do WhatsApp, elas aparecerão na fila para validação.</p>
                  </div>
                )}
              </section>

            </section>
          </section>
        )}

        {view === "overview" && (
          <section className="overview-page view active">
            <section className="kpi-grid">
              <article className="kpi-card accent">
                <span>Base instalada</span>
                <strong>{overviewData.totalMachines}</strong>
                <small>{overviewData.totalServices} atendimentos registrados</small>
              </article>
              <article className="kpi-card">
                <span>Atendimentos no mês</span>
                <strong>{overviewData.servicesThisMonth}</strong>
                <small>{overviewData.totalServices ? `${percent(overviewData.servicesThisMonth, overviewData.totalServices)}% do histórico` : "Sem histórico"}</small>
              </article>
              <article className="kpi-card success">
                <span>Contratos ativos</span>
                <strong>{overviewData.activeContracts}</strong>
                <small>{percent(overviewData.activeContracts, overviewData.totalMachines)}% da base</small>
              </article>
              <article className="kpi-card warning">
                <span>Contratos a vencer</span>
                <strong>{overviewData.expiringContracts}</strong>
                <small>Próximos 90 dias</small>
              </article>
              <article className="kpi-card">
                <span>Cobertura remota</span>
                <strong>{overviewData.remoteCoverage}%</strong>
                <small>SINEMA ou VNC cadastrados</small>
              </article>
              <article className="kpi-card danger">
                <span>Atenção operacional</span>
                <strong>{overviewData.staleMachines}</strong>
                <small>Sem atendimento há mais de 180 dias ou sem histórico</small>
              </article>
            </section>

            <section className="overview-grid">
              <article className="dashboard-card chart-card wide-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Tendência de atendimentos</h3></div>
                <div className="trend-chart">
                  {overviewData.serviceTrend.map((item) => {
                    const max = Math.max(...overviewData.serviceTrend.map((entry) => entry.value), 1);
                    return (
                      <div key={item.name} className="trend-bar">
                        <span>{item.value}</span>
                        <div style={{ height: `${Math.max(8, (item.value / max) * 100)}%` }} />
                        <small>{item.name}</small>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="remote" /><h3>Acesso remoto</h3></div>
                <div className="bar-list">
                  {overviewData.byAccess.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="check" /><h3>Contratos</h3></div>
                <div className="contract-summary-list">
                  <div><span>Ativos</span><strong>{overviewData.activeContracts}</strong></div>
                  <div><span>Em negociação</span><strong>{overviewData.negotiatingContracts}</strong></div>
                  <div><span>A vencer em 90 dias</span><strong>{overviewData.expiringContracts}</strong></div>
                  <div><span>Vencidos</span><strong>{overviewData.expiredContracts}</strong></div>
                </div>
                <div className="bar-list compact">
                  {overviewData.byContractType.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.activeContracts)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="software" /><h3>Modelos</h3></div>
                <div className="bar-list">
                  {overviewData.byModel.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="software" /><h3>Softwares por VM</h3></div>
                <div className="bar-list">
                  {overviewData.byVmSoftware.length ? overviewData.byVmSoftware.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, Math.max(...overviewData.byVmSoftware.map((entry) => entry.value), 1))}%` }} /></em>
                    </div>
                  )) : <p className="empty-card-note">Nenhum código de software com VM cadastrada.</p>}
                </div>
              </article>

              <article className="dashboard-card geo-card">
                <div className="card-title"><DetailIcon type="location" /><h3>Geolocalização</h3><span className="soft-pill">Estados / cidades</span></div>
                <div className="geo-panel">
                  <div className={`real-map ${mapMode === "fallback" ? "fallback-map" : ""}`} ref={overviewMapRef} aria-label="Mapa de máquinas por estado e cidade">
                    {mapMode !== "leaflet" && (
                      <div className="map-fallback">
                        <span className="map-label north">Brasil</span>
                        <span className="map-label south">Sul / Sudeste</span>
                        {overviewData.geoStates.map((item) => {
                          const center = STATE_CENTERS[item.state];
                          if (!center) return null;
                          return (
                            <button
                              key={item.state}
                              className={`map-fallback-marker ${focusedMapState === item.state ? "active" : ""}`}
                              style={mapPointPosition(center)}
                              type="button"
                              title={`${item.state}: ${item.value} máquina${item.value === 1 ? "" : "s"}`}
                              onClick={() => focusOverviewMapState(item.state)}
                            >
                              <span>{item.state}</span>
                              <strong>{item.value}</strong>
                            </button>
                          );
                        })}
                        {mapMode === "loading" && <em>Carregando mapa...</em>}
                      </div>
                    )}
                  </div>
                  <div className="state-map-list">
                    {overviewData.byState.map((item) => (
                      <button
                        key={item.name}
                        className={focusedMapState === item.name ? "active" : ""}
                        type="button"
                        onClick={() => focusOverviewMapState(item.name)}
                      >
                        <span>{item.name}</span>
                        <strong>{item.value}</strong>
                      </button>
                    ))}
                  </div>
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="client" /><h3>Clientes com mais máquinas</h3></div>
                <div className="bar-list">
                  {overviewData.byClient.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalMachines)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Clientes mais atendidos</h3></div>
                <div className="bar-list">
                  {overviewData.byClientServices.map((item) => (
                    <div key={item.name}>
                      <span>{item.name}</span><strong>{item.value}</strong>
                      <em><i style={{ width: `${percent(item.value, overviewData.totalServices)}%` }} /></em>
                    </div>
                  ))}
                </div>
              </article>

              <article className="dashboard-card service-type-card">
                <div className="card-title"><DetailIcon type="info" /><h3>Tipo de atendimento</h3></div>
                <div className="donut-panel">
                  <div className="donut" style={{ ["--value" as string]: `${percent(overviewData.byServiceType.find((item) => item.name === "Acesso remoto")?.value ?? 0, overviewData.totalServices)}%` }}>
                    <strong>{percent(overviewData.byServiceType.find((item) => item.name === "Acesso remoto")?.value ?? 0, overviewData.totalServices)}%</strong>
                    <span>Remoto</span>
                  </div>
                  <div className="mini-list">
                    {overviewData.byServiceType.map((item) => <div key={item.name}><span>{item.name}</span><strong>{item.value}</strong></div>)}
                  </div>
                </div>
              </article>

              <article className="dashboard-card overview-table-card service-rank-card">
                <div className="card-title"><DetailIcon type="history" /><h3>Máquinas com mais atendimentos</h3></div>
                <div className="overview-table">
                  {overviewData.topMachinesByService.map(({ machine, value }) => (
                    <button key={machine.id} type="button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>
                      <span>{displayMachineCode(machine)}</span>
                      <em>{machine.client || "-"}</em>
                      <strong>{value}</strong>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-card overview-table-card attention-rank-card">
                <div className="card-title"><DetailIcon type="alert" /><h3>Máquinas para atenção</h3></div>
                <div className="overview-table">
                  {overviewData.machineAttention.map(({ machine, lastDate, days }) => (
                    <button key={machine.id} type="button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>
                      <span>{displayMachineCode(machine)}</span>
                      <em>{lastDate ? `Último: ${formatDate(lastDate)}` : "Sem histórico"}</em>
                      <strong>{days === null ? "-" : `${days}d`}</strong>
                    </button>
                  ))}
                </div>
              </article>

              <article className="dashboard-card overview-table-card recent-rank-card">
                <div className="card-title"><DetailIcon type="detail" /><h3>Últimos atendimentos</h3></div>
                <div className="overview-table">
                  {overviewData.recentServices.map(({ machine, record }) => (
                    <button key={record.id} type="button" onClick={() => { setSelectedMachineId(machine.id); void openServiceRecord(record); }}>
                      <span>{record.issue_summary || record.equipment || "Atendimento"}</span>
                      <em>{displayMachineCode(machine)} - {formatDate(record.service_date)}</em>
                      <strong>{normalizeServiceType(record.service_type).replace("Acesso remoto", "Remoto").replace("Visita técnica", "Visita")}</strong>
                    </button>
                  ))}
                </div>
              </article>
            </section>
          </section>
        )}

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

        {view === "home" && (
          <section className="view active">
            <div className="search-panel">
              <label>Filtrar máquinas<input value={machineFilter} onChange={(event) => setMachineFilter(event.target.value)} placeholder="Código, modelo, cliente..." /></label>
            </div>
            <section className="table-panel">
              <div className="section-header"><h2>Máquinas cadastradas</h2><span>{filteredMachines.length} registros</span></div>
              <div className="table-wrap">
                <table className="home-table">
                  <thead><tr>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("code")}>Código <span>{sortMark(machineSort.key === "code", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("model")}>Modelo <span>{sortMark(machineSort.key === "model", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("serial")}>Número série <span>{sortMark(machineSort.key === "serial", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("client")}>Cliente <span>{sortMark(machineSort.key === "client", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("unit_city")}>Unidade / Cidade <span>{sortMark(machineSort.key === "unit_city", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("vm")}>VM <span>{sortMark(machineSort.key === "vm", machineSort.direction)}</span></button></th>
                    <th><button className="sort-header" type="button" onClick={() => toggleMachineSort("last_service")}>Último atendimento <span>{sortMark(machineSort.key === "last_service", machineSort.direction)}</span></button></th>
                  </tr></thead>
                  <tbody>
                    {filteredMachines.map((machine) => (
                      <tr key={machine.id}>
                        <td><button className="link-button" onClick={() => { setSelectedMachineId(machine.id); setHistoryFilter(""); setView("machineDetail"); }}>{displayMachineCode(machine)}</button></td>
                        <td>{machine.model || "-"}</td>
                        <td>{machine.serial || "-"}</td>
                        <td>{machine.client || "-"}</td>
                        <td>{machine.unit_city || "-"}</td>
                        <td>{machine.vm || "-"}</td>
                        <td>{formatDate(lastServiceDate(machine))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

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
                                  {currentUserCanEmitReports && record.created_by === currentUserId && <button type="button" onClick={() => { startServiceEdit(record); setOpenActionMenu(""); }}><EditIcon /> Editar</button>}
                                  {currentUserCanEmitReports && record.created_by === currentUserId && <button type="button" onClick={() => { void openServiceDraftPreview(record); setOpenActionMenu(""); }}><DetailIcon type="mail" /> Finalizar</button>}
                                  {(currentUserHasFullAccess || (currentUserCanEmitReports && record.created_by === currentUserId)) && <button className="danger" type="button" onClick={() => { void deleteServiceRecord(record); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>}
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
                                {currentUserCanEmitReports && record.created_by === currentUserId && <button type="button" onClick={() => { startServiceEdit(record); setOpenActionMenu(""); }}><EditIcon /> Editar</button>}
                                {(currentUserHasFullAccess || (currentUserCanEmitReports && record.created_by === currentUserId)) && <button className="danger" type="button" onClick={() => { void deleteServiceRecord(record); setOpenActionMenu(""); }}><TrashIcon /> Excluir</button>}
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
              <label>Técnico responsável<input value={currentUserName || displayUserName(currentUserEmail)} readOnly /></label>
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
              <label>Início do atendimento<input name="service_start" placeholder="dd/mm/aa ou dd/mm/aa - hh:mm" maxLength={16} defaultValue={editingServiceRecord?.service_start ?? ""} onChange={(event) => { event.currentTarget.value = formatServiceDateTimeInput(event.currentTarget.value); }} /></label>
              <label>Fim do atendimento<input name="service_end" placeholder="dd/mm/aa ou dd/mm/aa - hh:mm" maxLength={16} defaultValue={editingServiceRecord?.service_end ?? ""} onChange={(event) => { event.currentTarget.value = formatServiceDateTimeInput(event.currentTarget.value); }} /></label>
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

        {transferDialogOpen && selectedChat && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" onClick={() => setTransferDialogOpen(false)}>
            <section className="modal-card transfer-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Acesso Remoto</p>
                  <h2 id="transfer-modal-title">Transferir conversa</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setTransferDialogOpen(false)}>Fechar</button>
              </div>
              <div className="transfer-list">
                {availableTransferUsers.map((user) => (
                  <button key={user.email} type="button" onClick={() => void assignChat(selectedChat, user.email)}>
                    <span className="presence-dot" />
                    <strong>{user.name}</strong>
                    <small>{user.role || "Usuário"}</small>
                  </button>
                ))}
                {!availableTransferUsers.length && <p className="empty-state">Nenhum usuário Online disponível para receber transferência.</p>}
              </div>
            </section>
          </div>
        )}

        {editingContact && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title" onClick={() => setEditingContact(null)}>
            <form className="modal-card profile-card" onSubmit={saveChatContact} onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Acesso Remoto</p>
                  <h2 id="contact-modal-title">Editar cliente</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setEditingContact(null)}>Fechar</button>
              </div>
              <div className="fields-grid">
                <label>Cliente<input value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome do contato" /></label>
                <label>Empresa<input value={contactForm.company} onChange={(event) => setContactForm((current) => ({ ...current, company: event.target.value }))} placeholder="Empresa do cliente" /></label>
                <label className="wide">Telefone<input value={contactForm.phone} onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))} placeholder="5511999999999" /></label>
              </div>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setEditingContact(null)}>Cancelar</button>
                <button className="button primary" type="submit">Salvar cliente</button>
              </div>
            </form>
          </div>
        )}

        {servicePreview && previewMachine && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title" onClick={closeServicePreview}>
            <section className="modal-card pdf-preview-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Pr&eacute;via do relat&oacute;rio</p>
                  <h2 id="pdf-preview-title">Revise antes do envio</h2>
                </div>
                <button className="button ghost" type="button" onClick={closeServicePreview}>Fechar</button>
              </div>
              <div className="pdf-preview-meta">
                <span><strong>M&aacute;quina:</strong> {displayMachineCode(previewMachine)}</span>
                <span><strong>Arquivo:</strong> {servicePdfFileName(previewMachine, pdfReadyServiceRecord(servicePreview.record))}</span>
                <span><strong>Envio:</strong> {servicePreview.recipients.length ? servicePreview.recipients.join("; ") : "Nenhum e-mail informado"}</span>
              </div>
              <iframe className="pdf-preview-frame" src={`${servicePreview.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`} title="Pr&eacute;via do relat&oacute;rio em PDF" />
              <div className="pdf-mobile-preview">
                <strong>PDF pronto para revis&atilde;o</strong>
                <span>Em alguns celulares, a pr&eacute;via embutida do PDF n&atilde;o abre corretamente. Abra a pr&eacute;via em uma nova aba para revisar antes do envio.</span>
                <a className="button ghost" href={servicePreview.pdfUrl} target="_blank" rel="noreferrer">Abrir pr&eacute;via</a>
              </div>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => editServiceFromPreview(servicePreview.record)}>Editar</button>
                <button className="button ghost" type="button" onClick={() => downloadServicePdf(previewMachine, pdfReadyServiceRecord(servicePreview.record))}>Baixar PDF</button>
                <button className="button primary" type="button" disabled={servicePreviewSending} onClick={() => void sendPreviewServiceEmail()}>{servicePreviewSending ? "Enviando..." : servicePreview.finalizeOnSend ? servicePreview.recipients.length ? "Finalizar e enviar e-mail" : "Finalizar atendimento" : "Enviar e-mail"}</button>
              </div>
            </section>
          </div>
        )}

        {selectedServiceRecord && selectedMachine && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="service-modal-title" onClick={() => setSelectedServiceRecord(null)}>
            <section className="modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">{formatDate(selectedServiceRecord.service_date)}</p>
                  <h2 id="service-modal-title">Atendimento - {displayMachineCode(selectedMachine)}</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setSelectedServiceRecord(null)}>Fechar</button>
              </div>
              <div className="record-details">
                <div><span>Tipo de atendimento</span><strong>{normalizeServiceType(selectedServiceRecord.service_type)}</strong></div>
                <div><span>Equipamento</span><strong>{selectedServiceRecord.equipment || "-"}</strong></div>
                <div><span>Início</span><strong>{selectedServiceRecord.service_start || formatDate(selectedServiceRecord.service_date)}</strong></div>
                <div><span>Fim</span><strong>{selectedServiceRecord.service_end || "-"}</strong></div>
                <div><span>Técnico</span><strong>{selectedServiceRecord.technician_name}</strong></div>
                <div><span>Motivo breve</span><strong>{selectedServiceRecord.issue_summary || "-"}</strong></div>
                {normalizeServiceType(selectedServiceRecord.service_type) === "Visita técnica" && (
                  <>
                    <div><span>Cliente / representante</span><strong>{selectedServiceRecord.customer_name || "-"}</strong></div>
                    <div className="signature-detail"><span>Assinatura do cliente</span>{selectedServiceRecord.customer_signature ? <img src={selectedServiceRecord.customer_signature} alt="Assinatura do cliente" /> : <strong>-</strong>}</div>
                  </>
                )}
                <div><span>Solicitação do cliente / problema relatado</span><p>{selectedServiceRecord.request}</p></div>
                <div><span>Diagnóstico</span><p>{selectedServiceRecord.diagnosis}</p></div>
                <div><span>Serviço realizado</span><p>{selectedServiceRecord.service_done}</p></div>
                <div><span>Observações</span><p>{selectedServiceRecord.observations || "-"}</p></div>
                {(selectedServiceRecord.attachments?.length ?? 0) > 0 && (
                  <div className="record-attachments">
                    <span>Imagens do relatório</span>
                    <div className="record-attachment-grid">
                      {selectedServiceRecord.attachments?.map((attachment, index) => (
                        <figure key={attachment.id || `${attachment.name}-${index}`}>
                          <img src={attachment.dataUrl} alt={`Imagem ${index + 1} do atendimento`} />
                          <figcaption>{attachment.caption || attachment.name || `Imagem ${index + 1}`}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button className="icon-button download" type="button" title="Baixar PDF" aria-label="Baixar PDF" onClick={() => downloadServicePdf(selectedMachine, pdfReadyServiceRecord(selectedServiceRecord))}><PdfDownloadIcon /></button>
                {currentUserCanEmitReports && selectedServiceRecord.created_by === currentUserId && (
                  <button className="button primary" type="button" onClick={() => startServiceEdit(selectedServiceRecord)}>Editar atendimento</button>
                )}
                {(currentUserHasFullAccess || (currentUserCanEmitReports && selectedServiceRecord.created_by === currentUserId)) && (
                  <button className="button danger" type="button" onClick={() => void deleteServiceRecord(selectedServiceRecord)}>Excluir atendimento</button>
                )}
              </div>
            </section>
          </div>
        )}

        {profileModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={() => setProfileModalOpen(false)}>
            <form className="modal-card profile-card" onSubmit={saveUserProfile} onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Usuário</p>
                  <h2 id="profile-modal-title">Editar Usuário</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setProfileModalOpen(false)}>Fechar</button>
              </div>
              <div className="fields-grid">
                <label className="wide">Nome exibido<input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder={displayUserName(currentUserEmail)} autoFocus /></label>
                <label className="wide">E-mail corporativo<input value={currentUserEmail} readOnly /></label>
              </div>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setProfileModalOpen(false)}>Cancelar</button>
                <button className="button primary" type="submit">Salvar</button>
              </div>
            </form>
          </div>
        )}

        {confirmDialog && (
          <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" onClick={() => answerConfirm(false)}>
            <div className="modal-card confirm-card" onClick={(event) => event.stopPropagation()}>
              <h2 id="confirm-dialog-title">{confirmDialog.title}</h2>
              <p id="confirm-dialog-message">{confirmDialog.message}</p>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => answerConfirm(false)}>Cancelar</button>
                <button className={confirmDialog.destructive ? "button danger-button" : "button primary"} type="button" autoFocus onClick={() => answerConfirm(true)}>{confirmDialog.confirmLabel}</button>
              </div>
            </div>
          </div>
        )}

        {helpOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-modal-title" onClick={() => setHelpOpen(false)}>
            <section className="modal-card help-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Ajuda</p>
                  <h2 id="help-modal-title">Como usar esta tela</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setHelpOpen(false)}>Fechar</button>
              </div>
              <p>{helpText(view, registryTab)}</p>
              <div className="help-topic-list">
                {helpSections(view, registryTab).map(([title, body]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {biometricPromptOpen && isMobileAuthDeviceState && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="biometric-modal-title" onClick={() => setBiometricPromptOpen(false)}>
            <section className="modal-card profile-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Segurança do dispositivo</p>
                  <h2 id="biometric-modal-title">Habilitar biometria</h2>
                </div>
              </div>
              <p>Depois de habilitar, este dispositivo pedirá biometria sempre que o app for aberto. A confirmação por e-mail continuará sendo renovada a cada 7 dias.</p>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => { window.localStorage.setItem(BIOMETRIC_PROMPT_DISMISSED_KEY, "1"); setBiometricPromptOpen(false); }}>Agora não</button>
                <button className="button primary" type="button" onClick={() => void enableBiometricAuth()}>Habilitar biometria</button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
