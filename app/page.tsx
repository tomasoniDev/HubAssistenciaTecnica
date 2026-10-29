"use client";

import { ChangeEvent, FormEvent, MouseEvent as ReactMouseEvent, PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { downloadServicePdf, servicePdfBase64, servicePdfFileName, servicePdfPreviewUrl } from "@/lib/pdf";
import { hydrateServiceRecord, needsHeavyFields } from "@/lib/service-record-client";
import { ToastStack, useToasts } from "@/components/toasts";
import { isWindowedApp } from "@/lib/display-mode";
import { UserMenu } from "@/components/user-menu";
import { AdminView } from "@/components/views/AdminView";
import { ConfirmDialog } from "@/components/views/ConfirmDialog";
import { HelpModal } from "@/components/views/HelpModal";
import { HomeView } from "@/components/views/HomeView";
import { MachineDetailView } from "@/components/views/MachineDetailView";
import { OverviewView } from "@/components/views/OverviewView";
import { ProfileModal } from "@/components/views/ProfileModal";
import { RegistryView } from "@/components/views/RegistryView";
import { ScheduleView } from "@/components/views/ScheduleView";
import { ServiceFormView } from "@/components/views/ServiceFormView";
import { ServiceDateTimeField } from "@/components/service-datetime-field";
import { ALLOWED_EMAIL_DOMAINS, FINALIZED_REPORT_LOCK_MESSAGE, canDeleteServiceRecord, canModifyServiceRecord, isFinalizedServiceRecord, canEditMachine, canEditSchedule, canEmitReports, canManageContracts, canManageUsers, hasFullAccess, isCorporateEmail } from "@/lib/permissions";
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
  useEffect(() => { authenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
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
  const [message, setMessageText] = useState(DEFAULT_MESSAGE);
  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();
  const authenticatedRef = useRef(false);
  // Toda mensagem do app também aparece como aviso flutuante (só com o usuário logado).
  const setMessage = useCallback((text: string) => {
    setMessageText(text);
    if (authenticatedRef.current && text && text !== DEFAULT_MESSAGE && text !== "Acesso autorizado.") pushToast(text);
  }, [pushToast]);
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
    const installed = window.matchMedia("(display-mode: standalone), (display-mode: minimal-ui), (display-mode: window-controls-overlay)");
    function updateWindowedApp() {
      const windowed = isWindowedApp({ installedApp: installed.matches, innerWidth: window.innerWidth, availWidth: window.screen.availWidth });
      document.documentElement.classList.toggle("windowed-app", windowed);
    }
    updateWindowedApp();
    window.addEventListener("resize", updateWindowedApp);
    installed.addEventListener("change", updateWindowedApp);
    return () => {
      window.removeEventListener("resize", updateWindowedApp);
      installed.removeEventListener("change", updateWindowedApp);
      document.documentElement.classList.remove("windowed-app");
    };
  }, []);

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
  const recordActor = { id: currentUserId, role: currentUserRole };
  const canModifyRecord = (record: ServiceRecord) => canModifyServiceRecord(record, recordActor);
  const canDeleteRecord = (record: ServiceRecord) => canDeleteServiceRecord(record, recordActor);
  const lockMessage = (record: ServiceRecord, fallback: string) => isFinalizedServiceRecord(record) ? FINALIZED_REPORT_LOCK_MESSAGE : fallback;
  const currentUserCanEditSchedule = canEditSchedule(currentUserRole);
  const currentUserCanViewMachineDetailCards = !isAssemblyRole(currentUserRole) && currentUserRole !== "Controladoria" && currentUserRole !== "Comercial";
  const adminDeployment = adminInfo?.deployment;
  const adminMigrations = adminInfo?.migrations ?? [];
  const adminAuditLogs = adminInfo?.auditLogs ?? [];
  const adminSecretRotation = adminInfo?.secretRotation ?? null;
  const adminCredentialEncryption = adminInfo?.credentialEncryption ?? null;
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

  async function encryptStoredCredentials() {
    if (currentUserRole !== "Admin") {
      setMessage("Somente Admin pode criptografar as senhas armazenadas.");
      return;
    }
    const confirmed = await askConfirm("As senhas de acesso remoto que ainda estão em texto serão criptografadas. Guarde uma cópia da chave CREDENTIAL_ENCRYPTION_KEY: sem ela as senhas não podem ser recuperadas.", { title: "Criptografar senhas", confirmLabel: "Criptografar" });
    if (!confirmed) return;

    setMessage("Criptografando senhas armazenadas.");
    try {
      const result = await appAction<{ encrypted: number }>("encryptStoredCredentials");
      await loadData();
      setMessage(`Senhas criptografadas: ${result.data?.encrypted ?? 0}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível criptografar as senhas.");
    }
  }

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

    if (editingServiceRecord && !canModifyRecord(editingServiceRecord)) {
      setMessage(lockMessage(editingServiceRecord, "Este atendimento so pode ser alterado pelo usuario que lancou o registro."));
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
    if (!canModifyRecord(sourceRecord)) {
      setMessage(lockMessage(sourceRecord, "Este atendimento so pode ser alterado pelo usuario que lancou o registro."));
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
    if (!canDeleteRecord(record)) {
      setMessage(lockMessage(record, "Este atendimento so pode ser excluido pelo autor ou por usuario com acesso total."));
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
        <UserMenu
          variant="side"
          open={userMenuOpen}
          onToggle={() => setUserMenuOpen((open) => !open)}
          email={currentUserEmail}
          name={currentUserName}
          role={currentUserRole}
          canUseRemoteAccess={currentUserCanUseRemoteAccess}
          remoteAccessStatus={remoteAccessStatus}
          onStatusChange={updateRemoteAccessStatus}
          canDownloadBackup={canDownloadBackup}
          onBackup={downloadMachinesBackup}
          onSignOut={signOut}
        />
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
            <UserMenu
              variant="top"
              open={userMenuOpen}
              onToggle={() => setUserMenuOpen((open) => !open)}
              email={currentUserEmail}
              name={currentUserName}
              role={currentUserRole}
              canUseRemoteAccess={currentUserCanUseRemoteAccess}
              remoteAccessStatus={remoteAccessStatus}
              onStatusChange={updateRemoteAccessStatus}
              canDownloadBackup={canDownloadBackup}
              onBackup={downloadMachinesBackup}
              onSignOut={signOut}
            />
          </div>
        </header>

        <section className="status-band">
          <strong>{screenLegend(view, registryTab, selectedMachine)}</strong>

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

        <OverviewView focusedMapState={focusedMapState} focusOverviewMapState={focusOverviewMapState} mapMode={mapMode} openServiceRecord={openServiceRecord} overviewData={overviewData} overviewMapRef={overviewMapRef} setHistoryFilter={setHistoryFilter} setSelectedMachineId={setSelectedMachineId} setView={setView} view={view} />

        <AdminView adminAuditLogs={adminAuditLogs} adminCredentialEncryption={adminCredentialEncryption} adminDeployment={adminDeployment} adminMigrations={adminMigrations} adminSecretDaysRemaining={adminSecretDaysRemaining} adminSecretNextRotation={adminSecretNextRotation} adminSecretRotation={adminSecretRotation} adminSecretStatus={adminSecretStatus} authorizedUsers={authorizedUsers} chatContacts={chatContacts} chatConversations={chatConversations} currentUserCanViewAdmin={currentUserCanViewAdmin} currentUserRole={currentUserRole} encryptStoredCredentials={encryptStoredCredentials} machines={machines} overviewData={overviewData} resetClientSecretRotation={resetClientSecretRotation} supportContracts={supportContracts} view={view} />

        <HomeView filteredMachines={filteredMachines} machineFilter={machineFilter} machineSort={machineSort} setHistoryFilter={setHistoryFilter} setMachineFilter={setMachineFilter} setSelectedMachineId={setSelectedMachineId} setView={setView} toggleMachineSort={toggleMachineSort} view={view} />

        <ScheduleView actionMenuPosition={actionMenuPosition} completedTravelSchedules={completedTravelSchedules} completedTravelSort={completedTravelSort} contractForm={contractForm} currentUserCanEditSchedule={currentUserCanEditSchedule} currentUserCanManageContracts={currentUserCanManageContracts} deleteSupportContract={deleteSupportContract} deleteTravelSchedule={deleteTravelSchedule} editingContractId={editingContractId} editingTravelId={editingTravelId} editSupportContract={editSupportContract} editTravelSchedule={editTravelSchedule} machines={machines} openActionMenu={openActionMenu} openTravelSchedules={openTravelSchedules} saveSupportContract={saveSupportContract} saveTravelSchedule={saveTravelSchedule} scheduleTab={scheduleTab} setContractForm={setContractForm} setEditingContractId={setEditingContractId} setEditingTravelId={setEditingTravelId} setOpenActionMenu={setOpenActionMenu} setScheduleTab={setScheduleTab} setTravelForm={setTravelForm} supportContracts={supportContracts} toggleActionMenu={toggleActionMenu} toggleCompletedTravelSort={toggleCompletedTravelSort} toggleTravelSort={toggleTravelSort} travelCodeSuggestions={travelCodeSuggestions} travelForm={travelForm} travelSort={travelSort} updateContractMachine={updateContractMachine} updateContractSerial={updateContractSerial} view={view} />

        <MachineDetailView actionMenuPosition={actionMenuPosition} canDeleteRecord={canDeleteRecord} canModifyRecord={canModifyRecord} currentUserCanAccessCredentials={currentUserCanAccessCredentials} currentUserCanEditMachine={currentUserCanEditMachine} currentUserCanEmitReports={currentUserCanEmitReports} currentUserCanViewMachineDetailCards={currentUserCanViewMachineDetailCards} currentUserId={currentUserId} deleteServiceRecord={deleteServiceRecord} filteredHistory={filteredHistory} historyFilter={historyFilter} historySort={historySort} openActionMenu={openActionMenu} openServiceDraftPreview={openServiceDraftPreview} openServiceRecord={openServiceRecord} pdfReadyServiceRecord={pdfReadyServiceRecord} selectedMachine={selectedMachine} selectedMachineAccess={selectedMachineAccess} selectedMachineContract={selectedMachineContract} selectedMachineContractDays={selectedMachineContractDays} selectedMachineContractStatus={selectedMachineContractStatus} selectedMachineDraftReports={selectedMachineDraftReports} selectedMachineHasContractInfo={selectedMachineHasContractInfo} selectedMachineRecentHistory={selectedMachineRecentHistory} setEditingMachineId={setEditingMachineId} setHistoryFilter={setHistoryFilter} setOpenActionMenu={setOpenActionMenu} setRegistryTab={setRegistryTab} setView={setView} showFullHistory={showFullHistory} startNewService={startNewService} startServiceEdit={startServiceEdit} toggleActionMenu={toggleActionMenu} toggleHistorySort={toggleHistorySort} view={view} />

        <ServiceFormView addServiceAttachmentFiles={addServiceAttachmentFiles} authorizedUsers={authorizedUsers} clearSignature={clearSignature} closeSignaturePad={closeSignaturePad} currentUserEmail={currentUserEmail} currentUserId={currentUserId} currentUserName={currentUserName} drawSignature={drawSignature} editingServiceRecord={editingServiceRecord} finishSignature={finishSignature} machines={machines} openSignaturePad={openSignaturePad} removeServiceAttachment={removeServiceAttachment} saveService={saveService} selectServiceEmailSuggestion={selectServiceEmailSuggestion} serviceAttachments={serviceAttachments} serviceEmailSuggestions={serviceEmailSuggestions} serviceMachineLookupInput={serviceMachineLookupInput} serviceMachineLookupInvalid={serviceMachineLookupInvalid} serviceRecipientsInput={serviceRecipientsInput} serviceRecipientSuggestionsOpen={serviceRecipientSuggestionsOpen} serviceType={serviceType} setServiceMachineLookupInput={setServiceMachineLookupInput} setServiceMachineTouched={setServiceMachineTouched} setServiceRecipientsInput={setServiceRecipientsInput} setServiceRecipientSuggestionsOpen={setServiceRecipientSuggestionsOpen} setSupportTechniciansInput={setSupportTechniciansInput} signatureCanvasRef={signatureCanvasRef} signatureExpanded={signatureExpanded} startNewService={startNewService} startSignature={startSignature} supportTechniciansInput={supportTechniciansInput} updateServiceAttachmentCaption={updateServiceAttachmentCaption} updateServiceType={updateServiceType} view={view} />

        <RegistryView actionMenuPosition={actionMenuPosition} citySuggestions={citySuggestions} clientSuggestions={clientSuggestions} currentUserCanAccessCredentials={currentUserCanAccessCredentials} currentUserCanEditMachine={currentUserCanEditMachine} currentUserCanManageUsers={currentUserCanManageUsers} currentUserCanUseRemoteAccess={currentUserCanUseRemoteAccess} deleteChatContact={deleteChatContact} deleteMachine={deleteMachine} deleteUser={deleteUser} editChatContact={editChatContact} editingMachineId={editingMachineId} editingUserId={editingUserId} machineForm={machineForm} machineMainFieldsDisabled={machineMainFieldsDisabled} openActionMenu={openActionMenu} registryMachines={registryMachines} registryMachineSort={registryMachineSort} registryTab={registryTab} saveMachine={saveMachine} saveUser={saveUser} setEditingMachineId={setEditingMachineId} setEditingUserId={setEditingUserId} setOpenActionMenu={setOpenActionMenu} setRegistryTab={setRegistryTab} setUserForm={setUserForm} showRemoteAccess={showRemoteAccess} sortedChatContacts={sortedChatContacts} sortedUsers={sortedUsers} toggleActionMenu={toggleActionMenu} toggleRegistryMachineSort={toggleRegistryMachineSort} toggleUserSort={toggleUserSort} updateMachineForm={updateMachineForm} userForm={userForm} userSort={userSort} view={view} />

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
                {canModifyRecord(selectedServiceRecord) && (
                  <button className="button primary" type="button" onClick={() => startServiceEdit(selectedServiceRecord)}>Editar atendimento</button>
                )}
                {canDeleteRecord(selectedServiceRecord) && (
                  <button className="button danger" type="button" onClick={() => void deleteServiceRecord(selectedServiceRecord)}>Excluir atendimento</button>
                )}
              </div>
            </section>
          </div>
        )}

        <ProfileModal currentUserEmail={currentUserEmail} profileModalOpen={profileModalOpen} profileName={profileName} saveUserProfile={saveUserProfile} setProfileModalOpen={setProfileModalOpen} setProfileName={setProfileName} />

        <ToastStack toasts={toasts} onDismiss={dismissToast} />

        <ConfirmDialog answerConfirm={answerConfirm} confirmDialog={confirmDialog} />

        <HelpModal helpOpen={helpOpen} registryTab={registryTab} setHelpOpen={setHelpOpen} view={view} />

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
