// Global type declarations for ProposalKit
// These allow TypeScript/jsconfig checkJs to see cross-file globals

// ── Types ──
interface LineItem { desc: string; detail?: string; qty: number; rate: number; }
interface Section { title: string; content?: string; type?: string; testimonial?: object; caseStudy?: object; }
interface Proposal {
    id: string; title: string; number: string; status: string; date: string; validUntil: string;
    currency: string; sender: { company: string; email: string; address: string };
    client: { name: string; contact: string; email: string; phone: string };
    lineItems: LineItem[]; sections: Section[]; discount: number; taxRate: number;
    coverPage?: boolean; shareToken?: string; version?: number; versionHistory?: object[];
    createdAt: number; updatedAt: number; archived?: boolean; clientResponse?: object;
    paymentTerms?: string; addOns?: object[]; paymentSchedule?: object[]; packages?: object[];
    packagesEnabled?: boolean; lastEditedBy?: string; notes?: object[]; owner?: string;
    clientId?: string; template?: string;
}
interface AppConfig {
    name?: string; company?: string; email?: string; phone?: string; address?: string;
    country?: string; color?: string; logo?: string; bank?: object; currency?: string;
    gstin?: string; pan?: string; udyam?: string; lut?: string; ein?: string;
    vatNumber?: string; abn?: string; aiApiKey?: string; aiModel?: string;
    signature?: string; activeUserId?: string; team?: object[]; webhookUrl?: string;
    font?: string; whiteLabel?: boolean;
}
interface Client {
    id: string; name: string; contact?: string; email?: string; phone?: string;
    company?: string; address?: string; notes?: string;
}

// ── Core State (store.js) ──
declare var DB: Proposal[];
declare var CONFIG: AppConfig | null;
declare var CLIENTS: Client[];
declare var CUR: string | null;
declare var saveTimer: number | null;
declare var ctxTarget: string | null;
declare var currentFilter: string;
declare var currentSort: string;
declare var lastSaveTime: number | null;
declare var saveIndicatorTimer: number | null;
declare var docTemplate: string;
declare var sectionEditors: Record<string, any>;
declare var paymentTermsEditor: any;
declare var focusMode: boolean;
declare var viewMode: string;
declare var undoStack: Proposal[];
declare var redoStack: Proposal[];
declare const MAX_UNDO: number;
declare const COLORS: string[];
declare const COLOR_NAMES: Record<string, string>;

// ── Store Functions ──
declare function persist(): boolean;
declare function saveConfig(): boolean;
declare function saveClients(): void;
declare function cur(): Proposal | undefined;
declare function uid(): string;
declare function activeDB(): Proposal[];
declare function safeGetStorage(key: string, fallback: any): any;
declare function safeLsSet(key: string, val: any): boolean;
declare function esc(s: string): string;
declare function escAttr(s: string): string;
declare function sanitizeHtml(html: string): string;
declare function sanitizeDataUrl(dataUrl: string): string | null;
declare function isValidId(id: string): boolean;
declare function validateTaxId(type: string, value: string): boolean;
declare function fmtCur(n: number, c?: string): string;
declare function fmtNum(n: number, c?: string): string;
declare function fmtDate(d: string | number): string;
declare function timeAgo(ts: number): string;
declare function rgbToHex(rgb: string): string;
declare function defaultCurrency(): string;
declare function proposalValue(p: Proposal): number;
declare function capitalize(s: string): string;
declare function nextPropNumber(): string;
declare function taxLabel(): string;
declare function logoutApp(): void;

// ── Modals ──
declare function openNewModal(): void;
declare function pickNewModalColor(c: string): void;
declare function closeNewModal(e?: Event): void;
declare function toast(msg: string, type?: string): void;
declare function showLoading(text?: string): void;
declare function hideLoading(): void;
declare function confirmDialog(message: string, onConfirm: Function, opts?: object): void;

// ── Autosave ──
declare function dirty(): void;
declare function pushUndo(): void;
declare function undo(): void;
declare function redo(): void;

// ── Theme ──
declare function toggleTheme(): void;
declare function getCurrentTheme(): string;
declare function applyFont(fontName: string): void;

// ── Navigation ──
declare function goNav(view: string): void;
declare function toggleMobileSidebar(): void;
declare function closeMobileSidebar(): void;
declare function toggleSidebar(): void;
declare function initSidebarState(): void;
declare function initKeyboardShortcuts(): void;

// ── Editor ──
declare function createEditor(holder: any, opts?: any): any;
declare function migrateEditorContent(data: any): string;
declare function loadEditor(propId: string): void;
declare function refreshStatsBar(): void;
declare function edTab(el: any, tab: string): void;

// ── Pricing ──
declare function deleteLineItem(idx: number): void;
declare function addLine(): void;
declare function reRow(idx: number, dir: number): void;
declare function reTotal(): void;
declare function collectPaymentScheduleData(): any;

// ── Details ──
declare function updateExpiryWarning(): void;
declare function toggleStatusMenu(el: HTMLElement): void;
declare function setStatus(status: string): void;
declare function handleCoverPhoto(e: Event): void;
declare function changeCoverPhoto(): void;
declare function removeCoverPhoto(): void;

// ── Sections ──
declare function addSec(type?: string): void;
declare function showAddSectionMenu(el: HTMLElement): void;
declare function togSec(idx: number): void;
declare function updSecName(idx: number): void;
declare function delSec(idx: number): void;
declare function saveSectionToLib(): void;
declare function openLibrary(): void;
declare function setLibCat(cat: string): void;
declare function setLibTab(tab: string): void;
declare function insertFromLib(idx: number): void;

// ── Packages / Add-ons / Payment Schedule ──
declare function togglePackages(): void;
declare function setRecommended(idx: number): void;
declare function addPackageFeature(idx: number): void;
declare function removePackageFeature(pkgIdx: number, featIdx: number): void;
declare function setFeatureTier(pkgIdx: number, featIdx: number, tier: string): void;
declare function collectPackagesData(p: Proposal): void;
declare function buildPackagesPdfHtml(p: Proposal, c: string, bc: string): string;
declare function addAddOn(): void;
declare function removeAddOn(idx: number): void;
declare function toggleAddOn(idx: number): void;
declare function calcAddOnsTotal(): number;
declare function collectAddOnsData(p: Proposal): void;
declare function buildAddOnsPdfHtml(p: Proposal, c: string, bc: string): string;
declare function addMilestone(): void;
declare function removeMilestone(idx: number): void;
declare function toggleScheduleMode(): void;
declare function updateScheduleBar(): void;
declare function buildSchedulePdfHtml(p: Proposal, c: string, bc: string): string;

// ── Payments ──
declare function addPayment(): void;
declare function removePayment(idx: number): void;
declare function updatePaymentSummary(): void;
declare function paymentStatusBadge(p: Proposal): string;
declare function buildPaymentsReceiptHtml(p: Proposal, c: string, bc: string): string;
declare function quickRecordPayment(propId: string): void;
declare function saveQuickPayment(): void;
declare function showPaymentPickerMenu(el: HTMLElement): void;

// ── Preview / Export ──
declare function openPreview(): void;
declare function closePreview(): void;
declare function setDocTpl(tpl: string, btn?: HTMLElement): void;
declare function buildPreview(mode?: string): void;
declare function calcTotals(p: Proposal): any;
declare function editorJsToHtml(content: any, p?: Proposal): string;
declare function doExport(mode?: string): void;
declare function toggleBulkCheck(id: string, checkbox: HTMLInputElement): void;
declare function toggleSelectAll(): void;
declare function bulkExport(): void;

// ── PDF Templates ──
declare function buildCoverHtml(p: Proposal, bc: string): string;
declare function buildModernTpl(...args: any[]): string;
declare function buildClassicTpl(...args: any[]): string;
declare function buildMinimalTpl(...args: any[]): string;
declare function buildTabularTpl(...args: any[]): string;
declare function buildExecutiveTpl(...args: any[]): string;
declare function buildCompactTpl(...args: any[]): string;
declare function buildBoldTpl(...args: any[]): string;
declare function buildSidebarTpl(...args: any[]): string;
declare function buildStripeTpl(...args: any[]): string;
declare function buildFormalTpl(...args: any[]): string;
declare function buildCleanTpl(...args: any[]): string;
declare function buildNordTpl(...args: any[]): string;
declare function buildAmericanTpl(...args: any[]): string;
declare function buildSenderDetails(): string;
declare function buildSenderTaxLine(): string;
declare const TPLS: Record<string, any>;
declare const TPL_CATEGORIES: any[];

// ── Create / Sharing / Integrations ──
declare function doDupWithClient(id: string, clientIdx: number): void;
declare function fromTpl(key: string): void;
declare function fromSavedTpl(idx: number): void;
declare function saveAsTemplate(): void;
declare function doSaveAsTemplate(): void;
declare function deleteSavedTpl(idx: number, e?: Event): void;
declare function bumpVersion(): void;
declare function toggleCover(): void;
declare function ctxAction(action: string): void;
declare function archiveProp(id: string): void;
declare function unarchiveProp(id: string): void;
declare function refreshSide(): void;
declare function showCtx(e: Event, id: string): void;
declare function hideCtx(): void;
declare function shareProposal(): void;
declare function copyShareLink(): void;
declare function recordProposalView(token: string): Proposal | null;
declare function respondToProposal(token: string, status: string, comment?: string, opts?: any): boolean;
declare function exportMarkdown(): void;
declare function exportCsv(): void;
declare function exportStandaloneHtml(): void;
declare function sendWebhook(): void;
declare function showExportMenu(el?: HTMLElement): void;
declare function downloadBlob(blob: Blob, filename: string): void;
declare function slugify(s: string): string;

// ── Derivatives / Diff ──
declare function generateDerivative(type: string): void;
declare function openDerivativesMenu(el?: HTMLElement): void;
declare function buildSowHtml(...args: any[]): string;
declare function buildContractHtml(...args: any[]): string;
declare function buildReceiptHtml(...args: any[]): string;
declare function buildSignatureBlock(): string;
declare function openDiffView(): void;

// ── Signature / Email ──
declare function clearSigCanvas(): void;
declare function saveSignature(): void;
declare function editSignature(): void;
declare function clearSignature(): void;
declare function emailProposal(propId: string): void;
declare function sendWithTemplate(tplId: string): void;

// ── Structured Sections / Packs / AI / TC Library ──
declare const STRUCTURED_SECTION_DEFAULTS: any;
declare function structuredSecBlockHtml(type: string, data?: any): string;
declare function setRating(idx: number, rating: number): void;
declare function collectStructuredSection(el: HTMLElement): any;
declare function buildStructuredSectionPdf(p: Proposal, c: string, bc: string): string;
declare function renderPacksTab(): void;
declare function previewPack(packName: string): void;
declare function insertPack(packName: string): void;
declare function showAiPanel(): void;
declare function runAi(action: string): void;
declare function runAiCustom(): void;
declare function acceptAiResult(): void;
declare function renderAiSettingsCard(): string;
declare function openTCLib(): void;
declare function filterTCLib(q: string): void;
declare function insertTC(idx: number): void;

// ── CSV Import ──
declare function buildPricingInsights(): string;
declare function openCsvImport(): void;
declare function handleCsvFile(e: Event): void;
declare function updateCsvMap(colIdx: number, field: string): void;
declare function confirmCsvImport(): void;

// ── Notes / Focus / TOC ──
declare function addNote(): void;
declare function deleteNote(idx: number): void;
declare function toggleFocusMode(): void;
declare function exitFocusMode(): void;
declare function hideTOC(): void;
declare function tocGoSection(secIdx: number): void;

// ── Views ──
declare function renderDashboard(): void;
declare function dismissExpiry(id: string): void;
declare function toggleSort(): void;
declare function sortProposals(list: Proposal[]): Proposal[];
declare function renderProposals(): void;
declare function renderClients(): void;
declare function renderSettings(): void;
declare function computeTotal(p: Proposal): number;
declare function doQuickExport(id: string): void;
declare function quickPreview(id: string): void;
declare function showStatusMenu(e: Event, propId: string): void;
declare function setProposalStatus(status: string): void;
declare function setFilter(filter: string): void;
declare function filterList(): void;
declare function goPage(page: number): void;
declare function toggleSortProposals(): void;
declare function saveClient(idx: number): void;
declare function editClient(idx: number): void;
declare function delClient(idx: number): void;
declare function showClientPicker(): void;
declare function pickClient(idx: number): void;
declare function showClientInsight(idx: number): void;
declare function createProposalForClient(clientIdx: number): void;
declare function buildAnalyticsWidget(): string;
declare function setAnalyticsFilter(f: string): void;
declare function computeAnalytics(proposals: Proposal[]): any;
declare function openAnalyticsBreakdowns(): void;
declare function setBreakdownTab(tab: string): void;
declare function exportAnalyticsReport(): void;
declare function setViewMode(mode: string): void;
declare function addEmailTemplate(): void;
declare function editEmailTemplate(id: string): void;
declare function deleteEmailTemplate(id: string): void;
declare function saveEmailTemplate(existingId?: string): void;
declare function exportData(): void;
declare function importData(): void;
declare function applyWhiteLabel(): void;

// ── Auth / Supabase / Sync ──
declare function initAuth(): Promise<void>;
declare function onSignedIn(): void;
declare function doLogin(): void;
declare function doSignup(): void;
declare function doGoogleLogin(): void;
declare function doPasswordReset(): void;
declare function skipAuth(): void;
declare function doLogout(): Promise<void>;
declare var authMode: string;
declare function initSupabase(): any;
declare function sb(): any;
declare function isLoggedIn(): boolean;
declare function getValidToken(): Promise<string | null>;
declare function generateCsrfToken(): string;
declare function validateCsrfToken(token: string): boolean;
declare function getUserPlan(): Promise<any>;
declare function setSyncStatus(status: string): void;
declare function syncAfterPersist(): void;
declare function syncAfterSaveConfig(): void;
declare function syncAfterSaveClients(): void;
declare function pullFromCloud(): Promise<void>;

// ── Team / Onboarding ──
declare function initTeam(): void;
declare function switchUser(userId: string): void;
declare function removeTeamMember(userId: string): void;
declare function canEdit(): boolean;
declare function showUserSwitcher(): void;
declare function renderTeamSettings(): void;
declare function showAddMemberModal(): void;
declare function doAddMember(): void;
declare function obNext(): void;
declare function obPrev(): void;
declare function finishOb(): void;
declare function handleLogo(e: Event): void;
declare function renderOnboarding(): void;
declare const OB_COUNTRIES: string[];

// ── Command Palette / Shortcuts ──
declare function openCommandPalette(): void;
declare function closeCommandPalette(): void;
declare function cmdRun(fn: Function): void;
declare function openShortcutsPanel(): void;

// ── Completeness / Variables / Custom Select ──
declare function buildCompletenessHtml(p: Proposal): string;
declare function buildScoreBadge(p: Proposal): string;
declare function showCompletenessDetail(): void;
declare function navigateToTab(tabName: string): void;
declare function replaceVariables(text: string, p: Proposal): string;
declare function showInsertVariableDropdown(): void;
declare function csel(el: HTMLElement, opts: any): void;
declare function cselToggle(el: HTMLElement): void;
declare function cselFilter(input: HTMLElement): void;
declare function cselGetValue(el: HTMLElement): string;

// ── Utils ──
declare function autoResizeTextarea(el: HTMLElement): void;
declare function initDatePickers(): void;
declare var datePickers: Record<string, any>;

// ── Boot ──
declare const APP_VERSION: string;
declare const APP_BUILD: string;
declare const WHATS_NEW_ITEMS: any[];
declare function initApp(): void;
declare function bootApp(): void;
declare function checkWhatsNew(): void;
declare function showWhatsNew(): void;
declare function dismissWhatsNew(): void;
declare function appName(): string;

// ── CDN Libraries ──
declare var lucide: { createIcons(): void; };
declare var html2pdf: any;
declare var QRCode: any;
declare var qrcode: any;

// ── Tiptap (window globals) ──
interface Window {
    TiptapEditor: any;
    TiptapStarterKit: any;
    TiptapPlaceholder: any;
    TiptapLink: any;
    TiptapUnderline: any;
    TiptapHighlight: any;
    TiptapTable: any;
    TiptapTableRow: any;
    TiptapTableCell: any;
    TiptapTableHeader: any;
    TiptapTaskList: any;
    TiptapTaskItem: any;
    TiptapBubbleMenu: any;
    tiptapReady: boolean;
}
