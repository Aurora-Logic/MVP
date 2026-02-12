// ════════════════════════════════════════
// STORE — Data Layer (no dependencies)
// ════════════════════════════════════════

/* exported saveTimer, ctxTarget, currentFilter, currentSort, lastSaveTime, saveIndicatorTimer, docTemplate, sectionEditors, paymentTermsEditor, focusMode, viewMode, undoStack, redoStack, MAX_UNDO, saveConfig, saveClients, uid, activeDB, safeGetStorage, escAttr, safeLsSet, sanitizeHtml, sanitizeDataUrl, isValidId, validateTaxId, fmtCur, fmtNum, fmtDate, timeAgo, rgbToHex, defaultCurrency, proposalValue, capitalize, nextPropNumber, taxLabel, COLORS, COLOR_NAMES, logoutApp */
/** @typedef {{ desc: string, detail?: string, qty: number, rate: number }} LineItem */
/** @typedef {{ title: string, content?: string, type?: string, testimonial?: Object, caseStudy?: Object }} Section */
/** @typedef {{ id: string, title: string, number: string, status: string, date: string, validUntil: string, currency: string, sender: {company: string, email: string, address: string}, client: {name: string, contact: string, email: string, phone: string}, lineItems: LineItem[], sections: Section[], discount: number, taxRate: number, coverPage?: boolean, shareToken?: string, version?: number, versionHistory?: Object[], createdAt: number, updatedAt: number, archived?: boolean, clientResponse?: Object, paymentTerms?: string, addOns?: Object[], paymentSchedule?: Object[], packages?: Object[], packagesEnabled?: boolean, lastEditedBy?: string }} Proposal */
/** @typedef {{ name?: string, company?: string, email?: string, phone?: string, address?: string, country?: string, color?: string, logo?: string, bank?: Object, gstin?: string, pan?: string, udyam?: string, lut?: string, ein?: string, vatNumber?: string, abn?: string, aiApiKey?: string, aiModel?: string, signature?: string, activeUserId?: string, team?: Object[], webhookUrl?: string, font?: string, whiteLabel?: boolean }} AppConfig */
/** @typedef {{ id: string, name: string, contact?: string, email?: string, phone?: string, company?: string, address?: string, notes?: string }} Client */

/** @type {Proposal[]} */
let DB;
/** @type {AppConfig|null} */
let CONFIG;
/** @type {Client[]} */
let CLIENTS;
try { DB = JSON.parse(localStorage.getItem('pk_db') || '[]'); } catch (e) { DB = []; console.error('pk_db corrupted, reset to empty:', e); }
try { CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null'); } catch (e) { CONFIG = null; console.error('pk_config corrupted, reset:', e); }
try { CLIENTS = JSON.parse(localStorage.getItem('pk_clients') || '[]'); } catch (e) { CLIENTS = []; console.error('pk_clients corrupted, reset:', e); }
/* eslint-disable prefer-const -- These are reassigned in other files */
let CUR = null;
let saveTimer = null;
let ctxTarget = null;
let currentFilter = 'all';
let currentSort = 'date';
let lastSaveTime = null;
let saveIndicatorTimer = null;
let docTemplate = 'modern';
let sectionEditors = {};
let paymentTermsEditor = null;
let focusMode = false;
let viewMode = localStorage.getItem('pk_viewMode') || 'table';

// Undo/Redo state stack
let undoStack = [];
let redoStack = [];
/* eslint-enable prefer-const */
const MAX_UNDO = 20;

/** @returns {boolean} true if saved successfully */
function persist() {
    try {
        localStorage.setItem('pk_db', JSON.stringify(DB));
        if (typeof syncAfterPersist === 'function') syncAfterPersist();
        return true;
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            toast('Storage limit reached! Please export your data and clear some proposals.', 'error');
        } else {
            toast('Error saving data. Please check your browser settings.', 'error');
        }
        console.error('localStorage error:', e);
        return false;
    }
}

function saveConfig() {
    try {
        localStorage.setItem('pk_config', JSON.stringify(CONFIG));
        if (typeof syncAfterSaveConfig === 'function') syncAfterSaveConfig();
        return true;
    } catch (e) {
        toast('Error saving settings', 'error');
        console.error('localStorage error:', e);
        return false;
    }
}

function saveClients() {
    try {
        localStorage.setItem('pk_clients', JSON.stringify(CLIENTS));
        if (typeof syncAfterSaveClients === 'function') syncAfterSaveClients();
    }
    catch (e) { toast('Error saving clients', 'error'); console.error('localStorage error:', e); }
}

/** @returns {Proposal|undefined} */
function cur() { return DB.find(p => p.id === CUR); }
function uid() { return 'p' + Date.now() + Math.random().toString(36).slice(2, 7); }
function activeDB() { return DB.filter(p => !p.archived); }

function safeGetStorage(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch (e) { console.warn('Corrupted ' + key + ', resetting'); return fallback; }
}

// Merge client responses from client.html (stored in pk_client_responses)
(function mergeClientResponses() {
    try {
        const responses = JSON.parse(localStorage.getItem('pk_client_responses') || '[]');
        if (!responses.length) return;
        let merged = 0;
        responses.forEach(r => {
            const p = DB.find(x => x.id === r.proposalId && x.shareToken === r.token);
            if (p && !p.clientResponse) {
                p.clientResponse = { status: r.status, respondedAt: r.respondedAt, comment: r.comment };
                if (r.clientName) p.clientResponse.clientName = r.clientName;
                if (r.clientSignature) p.clientResponse.clientSignature = r.clientSignature;
                p.status = r.status;
                merged++;
            }
        });
        localStorage.removeItem('pk_client_responses');
        if (merged) persist();
    } catch (e) { console.warn('Client response merge error:', e); }
})();

// Multi-tab sync: reload data when another tab writes to localStorage
window.addEventListener('storage', (e) => {
    if (e.key === 'pk_db' && e.newValue) {
        try {
            const remote = JSON.parse(e.newValue);
            if (CUR) {
                const local = cur();
                const remoteCur = remote.find(p => p.id === CUR);
                if (local && remoteCur && (remoteCur.updatedAt || 0) > (local.updatedAt || 0)) {
                    DB = remote;
                    loadEditor(CUR);
                    toast('Updated from another tab', 'info');
                    return;
                }
            }
            DB = remote;
            if (typeof refreshSide === 'function') refreshSide();
        } catch (err) { console.warn('Storage sync error', err); }
    }
    if (e.key === 'pk_config' && e.newValue) {
        try { CONFIG = JSON.parse(e.newValue); } catch (err) { /* ignore */ }
    }
    if (e.key === 'pk_clients' && e.newValue) {
        try { CLIENTS = JSON.parse(e.newValue); } catch (err) { /* ignore */ }
    }
});

/** @param {string} s @returns {string} HTML-escaped string */
function esc(s) {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Escape for safe use inside onclick="fn('${escAttr(val)}')" attributes
function escAttr(s) { return esc(s).replace(/\\/g, '\\\\'); }

// Safe localStorage.setItem with try-catch
function safeLsSet(key, val) {
    try { localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val)); return true; }
    catch (e) { console.error('localStorage write error:', key, e); toast('Storage error', 'error'); return false; }
}

// Sanitize HTML — allow safe inline formatting tags from EditorJS, strip everything else
/** @param {string} html @returns {string} sanitized HTML */
function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return '';
    const div = document.createElement('div');
    div.innerHTML = html;
    // Remove all script, iframe, object, embed, form, style elements
    div.querySelectorAll('script,iframe,object,embed,form,style,link,meta,base,svg').forEach(el => el.remove());
    // Remove event handler attributes and dangerous attrs from all elements
    div.querySelectorAll('*').forEach(el => {
        [...el.attributes].forEach(attr => {
            const name = attr.name.toLowerCase();
            if (name.startsWith('on') || name === 'srcdoc' || name === 'formaction' || name === 'xlink:href') {
                el.removeAttribute(attr.name);
            }
            if (name === 'href' || name === 'src' || name === 'action') {
                const val = (attr.value || '').trim().toLowerCase();
                if (val.startsWith('javascript:') || val.startsWith('data:text') || val.startsWith('data:image/svg') || val.startsWith('vbscript:')) {
                    el.removeAttribute(attr.name);
                }
            }
        });
    });
    return div.innerHTML;
}

// Sanitize data URLs — reject SVGs with embedded scripts/handlers
function sanitizeDataUrl(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
    if (!dataUrl.startsWith('data:image/svg')) return dataUrl;
    const decoded = atob(dataUrl.split(',')[1] || '');
    if (/<script/i.test(decoded) || /on\w+\s*=/i.test(decoded) || /<iframe/i.test(decoded) || /<object/i.test(decoded) || /javascript:/i.test(decoded)) {
        toast('SVG rejected — contains unsafe content', 'error');
        return null;
    }
    return dataUrl;
}

// Validate ID format — alphanumeric + underscore only (matches uid() output)
function isValidId(id) { return typeof id === 'string' && /^[\w-]+$/.test(id); }

// Tax ID format validators — return true if empty (optional) or valid format
const TAX_VALIDATORS = {
    gstin: { re: /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/i, label: 'GSTIN', hint: 'Format: 22AAAAA0000A1Z5' },
    pan: { re: /^[A-Z]{5}\d{4}[A-Z]$/i, label: 'PAN', hint: 'Format: AAAAA0000A' },
    udyam: { re: /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i, label: 'UDYAM', hint: 'Format: UDYAM-MH-00-0000000' },
    lut: { re: /^[A-Z0-9]{10,20}$/i, label: 'LUT', hint: 'LUT Number from GST portal' },
    ein: { re: /^\d{2}-?\d{7}$/, label: 'EIN', hint: 'Format: 12-3456789' },
    abn: { re: /^\d{2}\s?\d{3}\s?\d{3}\s?\d{3}$/, label: 'ABN', hint: '11 digits' }
};
function validateTaxId(type, value) {
    if (!value || !value.trim()) return true; // optional fields
    const v = TAX_VALIDATORS[type];
    return v ? v.re.test(value.trim()) : true;
}

/** @param {number} n @param {string} [c] currency symbol @returns {string} formatted currency */
function fmtCur(n, c) {
    const currency = c || '₹';
    const displayCurrency = currency === '¥CN' ? '¥' : currency;
    const val = (typeof n === 'number' && isFinite(n)) ? n : 0;
    const locale = (currency === '₹') ? 'en-IN' : 'en-US';
    return displayCurrency + val.toLocaleString(locale);
}

function fmtNum(n, c) {
    const val = (typeof n === 'number' && isFinite(n)) ? n : 0;
    const locale = (c === '₹') ? 'en-IN' : 'en-US';
    return val.toLocaleString(locale);
}

/** @param {string|number} d date string or timestamp @returns {string} */
function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    const isIN = CONFIG?.country === 'IN';
    return dt.toLocaleDateString(isIN ? 'en-IN' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return rgb;
    return '#' + m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}

const COUNTRY_CURRENCY = { IN: '₹', US: '$', GB: '£', CA: 'C$', AU: 'A$', DE: '€', FR: '€', SG: 'S$', AE: 'د.إ', JP: '¥', NL: '€', SE: 'kr', CH: 'CHF', NZ: 'NZ$', IE: '€' };
function defaultCurrency() { return COUNTRY_CURRENCY[CONFIG?.country] || '₹'; }

// Shared utility: calculate proposal line-item value
function proposalValue(p) {
    return (p.lineItems || []).reduce((a, i) => a + (i.qty || 0) * (i.rate || 0), 0);
}

// Shared utility: capitalize first letter
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

// Shared utility: generate next proposal number
function nextPropNumber() {
    const nums = DB.map(p => { const m = (p.number || '').match(/PROP-(\d+)/); return m ? parseInt(m[1]) : 0; });
    return 'PROP-' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}

// Shared utility: get tax label for current country
function taxLabel() {
    const c = CONFIG?.country;
    if (c === 'IN') return 'GST';
    if (c === 'AU') return 'GST';
    if (c === 'US' || c === 'CA') return 'Tax';
    if (c === 'GB' || c === 'DE' || c === 'FR' || c === 'NL' || c === 'IE' || c === 'SE') return 'VAT';
    if (c === 'JP') return 'CT';
    if (c === 'SG') return 'GST';
    if (c === 'AE') return 'VAT';
    if (c === 'CH') return 'VAT';
    return 'Tax';
}

const COLORS = ['#800020', '#2563eb', '#7c3aed', '#dc2626', '#d97706', '#16a34a', '#0891b2', '#be185d'];
const COLOR_NAMES = { '#800020': '#5c0017', '#2563eb': '#1e40af', '#7c3aed': '#5b21b6', '#dc2626': '#991b1b', '#d97706': '#92400e', '#16a34a': '#166534', '#0891b2': '#155e75', '#be185d': '#9d174d' };

function logoutApp() {
    const isCloud = typeof isLoggedIn === 'function' && isLoggedIn();
    const msg = isCloud
        ? 'Sign out? Your data is saved in the cloud and will sync when you sign back in.'
        : 'Log out and clear all data? This will remove all proposals, settings, and clients. Make sure to export your data first.';
    const btnText = isCloud ? 'Sign Out' : 'Logout & Clear';
    confirmDialog(msg, async () => {
        if (typeof doLogout === 'function') await doLogout();
        ['pk_db', 'pk_config', 'pk_clients', 'pk_email_tpl', 'pk_seclib', 'pk_tclib', 'pk_templates', 'pk_dismissed', 'pk_theme'].forEach(k => localStorage.removeItem(k));
        location.reload();
    }, { title: isCloud ? 'Sign Out' : 'Logout', confirmText: btnText, destructive: !isCloud });
}
