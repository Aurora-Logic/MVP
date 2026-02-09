// ════════════════════════════════════════
// STORE — Data Layer (no dependencies)
// ════════════════════════════════════════

let DB, CONFIG, CLIENTS;
try { DB = JSON.parse(localStorage.getItem('pk_db') || '[]'); } catch (e) { DB = []; console.error('pk_db corrupted, reset to empty:', e); }
try { CONFIG = JSON.parse(localStorage.getItem('pk_config') || 'null'); } catch (e) { CONFIG = null; console.error('pk_config corrupted, reset:', e); }
try { CLIENTS = JSON.parse(localStorage.getItem('pk_clients') || '[]'); } catch (e) { CLIENTS = []; console.error('pk_clients corrupted, reset:', e); }
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
let pricingDescEditor = null;

// Undo/Redo state stack
let undoStack = [];
let redoStack = [];
const MAX_UNDO = 20;

function persist() {
    try {
        localStorage.setItem('pk_db', JSON.stringify(DB));
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
        return true;
    } catch (e) {
        toast('Error saving settings', 'error');
        console.error('localStorage error:', e);
        return false;
    }
}

function saveClients() {
    try { localStorage.setItem('pk_clients', JSON.stringify(CLIENTS)); }
    catch (e) { toast('Error saving clients', 'error'); console.error('localStorage error:', e); }
}

function cur() { return DB.find(p => p.id === CUR); }
function uid() { return 'p' + Date.now() + Math.random().toString(36).slice(2, 7); }
function activeDB() { return DB.filter(p => !p.archived); }

function esc(s) {
    return (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function fmtCur(n, c) {
    const currency = c || '₹';
    const displayCurrency = currency === '¥CN' ? '¥' : currency;
    const val = (typeof n === 'number' && isFinite(n)) ? n : 0;
    const locale = (currency === '₹') ? 'en-IN' : 'en-US';
    return displayCurrency + val.toLocaleString(locale);
}

function fmtDate(d) {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
}

const COLORS = ['#18181b', '#2563eb', '#7c3aed', '#dc2626', '#d97706', '#16a34a', '#0891b2', '#be185d'];
const COLOR_NAMES = { '#18181b': '#09090b', '#2563eb': '#1e40af', '#7c3aed': '#5b21b6', '#dc2626': '#991b1b', '#d97706': '#92400e', '#16a34a': '#166534', '#0891b2': '#155e75', '#be185d': '#9d174d' };
