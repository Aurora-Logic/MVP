// ════════════════════════════════════════
// ADMIN-DEBUG — Storage Inspector + SW + Errors
// ════════════════════════════════════════

/* exported renderAdminDebug */

function renderAdminDebug() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = buildStorageInspector() + buildRawJsonEditor() + buildErrorLog() + buildSwControls() + buildPerfSection();
    lucide.createIcons();
    var rawKeyItems = Object.keys(STORAGE_KEYS).map(function(k) { return { value: k, label: STORAGE_KEYS[k] + ' (' + k + ')' }; });
    _adminCselBind('rawEditorKey', rawKeyItems, rawKeyItems[0].value, function() { loadRawEditor(); });
}

// ─── Storage Inspector ───
function buildStorageInspector() {
    var total = getTotalStorageSize();
    var maxStorage = 5 * 1024 * 1024;
    var pct = ((total / maxStorage) * 100).toFixed(1);
    var fillClass = pct > 80 ? 'danger' : (pct > 50 ? 'warn' : '');

    var rows = '';
    var allKeys = Object.keys(STORAGE_KEYS);
    allKeys.forEach(function(key) {
        var size = getStorageKeySize(key);
        var keyPct = total > 0 ? ((size / total) * 100).toFixed(1) : '0';
        var raw = localStorage.getItem(key);
        var itemCount = '-';
        try {
            var parsed = raw ? JSON.parse(raw) : null;
            if (Array.isArray(parsed)) itemCount = parsed.length + '';
            else if (parsed && typeof parsed === 'object') itemCount = 'Object';
        } catch (e) { itemCount = 'CORRUPT'; }

        rows += '<tr>' +
            '<td style="font-family:var(--mono);font-size:12px">' + key + '</td>' +
            '<td style="font-size:12px">' + esc(STORAGE_KEYS[key]) + '</td>' +
            '<td style="font-size:12px">' + itemCount + '</td>' +
            '<td style="font-family:var(--mono);font-size:12px">' + fmtBytes(size) + '</td>' +
            '<td style="font-size:12px">' + keyPct + '%</td>' +
            '<td style="white-space:nowrap"><div style="display:flex;gap:2px">' +
            '<button class="btn-sm-icon-ghost" onclick="viewStorageKey(\'' + key + '\')" data-tooltip="View"><i data-lucide="eye"></i></button>' +
            '<button class="btn-sm-icon-ghost" onclick="exportStorageKey(\'' + key + '\')" data-tooltip="Export"><i data-lucide="download"></i></button>' +
            '</div></td></tr>';
    });

    // Admin-only keys
    ['pk_admin_config', 'pk_admin_audit', 'pk_admin_errors'].forEach(function(key) {
        var size = getStorageKeySize(key);
        if (size > 0) {
            rows += '<tr><td style="font-family:var(--mono);font-size:12px;color:var(--text4)">' + key + '</td>' +
                '<td style="font-size:12px;color:var(--text4)">Admin</td><td>-</td>' +
                '<td style="font-family:var(--mono);font-size:12px">' + fmtBytes(size) + '</td><td>-</td>' +
                '<td><button class="btn-sm-icon-ghost" onclick="viewStorageKey(\'' + key + '\')" data-tooltip="View"><i data-lucide="eye"></i></button></td></tr>';
        }
    });

    return '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">Storage Inspector</div>' +
        '<div style="margin-bottom:12px"><strong>' + fmtBytes(total) + '</strong> of ~5 MB (' + pct + '%)' +
        '<div class="admin-storage-bar"><div class="admin-storage-fill ' + fillClass + '" style="width:' + Math.min(100, pct) + '%"></div></div></div>' +
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Key</th><th>Type</th><th>Items</th><th>Size</th><th>%</th><th>Actions</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

function viewStorageKey(key) {
    var raw = localStorage.getItem(key) || 'null';
    var formatted = raw;
    try { formatted = JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { /* keep raw */ }
    adminModal('Storage: ' + key, '<pre class="admin-json">' + esc(formatted) + '</pre>', { width: '700px' });
}

function exportStorageKey(key) {
    var raw = localStorage.getItem(key) || '';
    downloadBlob(raw, key + '.json', 'application/json');
    adminToast(key + ' exported');
}

// ─── Raw JSON Editor ───
function buildRawJsonEditor() {
    var _rawKeyItems = Object.keys(STORAGE_KEYS).map(function(k) {
        return { value: k, label: esc(STORAGE_KEYS[k]) + ' (' + k + ')' };
    });

    return '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">Raw JSON Editor</div>' +
        '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">' +
        _adminCsel('rawEditorKey') +
        '<button class="btn-sm-outline" onclick="formatRawEditor()"><i data-lucide="align-left"></i> Format</button>' +
        '<button class="btn-sm-outline" onclick="minifyRawEditor()"><i data-lucide="minus"></i> Minify</button>' +
        '<button class="btn-sm-outline" onclick="revertRawEditor()"><i data-lucide="undo-2"></i> Revert</button>' +
        '<button class="btn" onclick="saveRawEditor()">Save</button></div>' +
        '<textarea class="admin-json-editor" id="rawJsonEditor" style="min-height:250px" oninput="validateRawEditor()"></textarea>' +
        '<div id="rawEditorStatus" style="margin-top:4px;font-size:12px"></div></div>';
}

function _getRawKey() {
    var el2 = document.getElementById('rawEditorKey');
    return (typeof cselGetValue === 'function' ? cselGetValue(el2) : (el2 ? el2.value : '')) || 'pk_db';
}

function loadRawEditor() {
    var key = _getRawKey();
    var raw = localStorage.getItem(key) || '';
    var ed = document.getElementById('rawJsonEditor');
    if (!ed) return;
    try { ed.value = JSON.stringify(JSON.parse(raw), null, 2); } catch (e) { ed.value = raw; }
    validateRawEditor();
}

function validateRawEditor() {
    var ed = document.getElementById('rawJsonEditor');
    var status = document.getElementById('rawEditorStatus');
    if (!ed || !status) return;
    try {
        JSON.parse(ed.value);
        ed.classList.remove('invalid');
        status.innerHTML = '<span style="color:var(--green)">\u2713 Valid JSON</span>';
    } catch (e) {
        ed.classList.add('invalid');
        status.innerHTML = '<span style="color:var(--red)">\u2717 ' + esc(e.message) + '</span>';
    }
}

function formatRawEditor() {
    var ed = document.getElementById('rawJsonEditor');
    if (!ed) return;
    try { ed.value = JSON.stringify(JSON.parse(ed.value), null, 2); } catch (e) { adminToast('Cannot format: invalid JSON', 'error'); }
}

function minifyRawEditor() {
    var ed = document.getElementById('rawJsonEditor');
    if (!ed) return;
    try { ed.value = JSON.stringify(JSON.parse(ed.value)); } catch (e) { adminToast('Cannot minify: invalid JSON', 'error'); }
}

function revertRawEditor() {
    loadRawEditor();
    adminToast('Reverted');
}

function saveRawEditor() {
    var key = _getRawKey();
    var ed = document.getElementById('rawJsonEditor');
    if (!ed) return;
    try {
        var parsed = JSON.parse(ed.value);
        adminConfirm('Save changes to ' + key + '? This modifies live data.', function() {
            if (adminSave(key, parsed)) {
                adminToast(key + ' saved');
                renderAdminDebug();
            }
        }, { title: 'Save ' + key, confirmText: 'Save' });
    } catch (e) { adminToast('Invalid JSON', 'error'); }
}

// ─── Error Log ───
function buildErrorLog() {
    var errors = safeGet('pk_admin_errors', []).slice().reverse();
    var rows = errors.slice(0, 50).map(function(e) {
        var d = new Date(e.ts);
        var time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        return '<tr>' +
            '<td style="font-size:11px;color:var(--text4);white-space:nowrap">' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + time + '</td>' +
            '<td style="font-size:12px;color:var(--red);max-width:300px">' + esc(e.msg || '') + '</td>' +
            '<td style="font-size:11px;font-family:var(--mono);color:var(--text4)">' + esc(e.src || '') + (e.line ? ':' + e.line : '') + '</td>' +
            '</tr>';
    }).join('');

    return '<div class="admin-section"><div class="admin-section-head">' +
        '<div class="admin-section-title">Error Log (' + errors.length + ')</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn-sm-outline" onclick="exportErrorLog()"><i data-lucide="download"></i> Export</button>' +
        '<button class="btn-sm-destructive" onclick="clearErrorLog()"><i data-lucide="trash-2"></i> Clear</button></div></div>' +
        '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
        '<th>Time</th><th>Message</th><th>Source</th>' +
        '</tr></thead><tbody>' + (rows || '<tr><td colspan="3" style="text-align:center;color:var(--text4);padding:24px">No errors captured</td></tr>') +
        '</tbody></table></div></div>';
}

function exportErrorLog() {
    var errors = safeGet('pk_admin_errors', []);
    downloadBlob(JSON.stringify(errors, null, 2), 'pk-errors.json', 'application/json');
    adminToast('Error log exported');
}

function clearErrorLog() {
    safePut('pk_admin_errors', []);
    adminToast('Error log cleared');
    renderAdminDebug();
}

// ─── Service Worker Controls ───
function buildSwControls() {
    var swActive = !!(navigator.serviceWorker && navigator.serviceWorker.controller);
    var swUrl = (navigator.serviceWorker && navigator.serviceWorker.controller) ? navigator.serviceWorker.controller.scriptURL : 'Not registered';

    return '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">Service Worker</div>' +
        '<div class="admin-table-wrap"><table class="admin-info-table">' +
        '<tr><td>Status</td><td><span class="admin-badge ' + (swActive ? 'admin-badge-accepted' : 'admin-badge-declined') + '">' + (swActive ? 'Active' : 'Not active') + '</span></td></tr>' +
        '<tr><td>Script</td><td style="font-family:var(--mono);font-size:11px">' + esc(swUrl) + '</td></tr>' +
        '</table></div>' +
        '<div style="display:flex;gap:8px;margin-top:8px">' +
        '<button class="btn-sm-outline" onclick="swForceUpdate()"><i data-lucide="refresh-cw"></i> Force Update</button>' +
        '<button class="btn-sm-outline" onclick="swClearCache()"><i data-lucide="trash-2"></i> Clear Cache</button>' +
        '<button class="btn-sm-destructive" onclick="swUnregister()"><i data-lucide="power-off"></i> Unregister</button>' +
        '</div></div>';
}

function swForceUpdate() {
    if (!navigator.serviceWorker) { adminToast('No SW support', 'error'); return; }
    navigator.serviceWorker.getRegistration().then(function(reg) {
        if (reg) { reg.update(); adminToast('SW update triggered'); auditLog('sw_update', 'sw', 'Force update'); }
        else adminToast('No SW registered', 'error');
    });
}

function swClearCache() {
    if (!('caches' in window)) { adminToast('No cache API', 'error'); return; }
    caches.keys().then(function(names) {
        return Promise.all(names.map(function(n) { return caches.delete(n); }));
    }).then(function() {
        adminToast('All caches cleared');
        auditLog('sw_clear', 'sw', 'Caches cleared');
    });
}

function swUnregister() {
    adminConfirm('Unregister service worker? The app will lose offline capability.', function() {
        navigator.serviceWorker.getRegistration().then(function(reg) {
            if (reg) { reg.unregister(); adminToast('SW unregistered'); auditLog('sw_unregister', 'sw', 'Unregistered'); }
            else adminToast('No SW registered');
        });
    }, { title: 'Unregister SW', confirmText: 'Unregister', destructive: true });
}

// ─── Performance ───
function buildPerfSection() {
    var perf = performance.timing || {};
    var pageLoad = perf.loadEventEnd && perf.navigationStart ? (perf.loadEventEnd - perf.navigationStart) : 0;
    var domReady = perf.domContentLoadedEventEnd && perf.navigationStart ? (perf.domContentLoadedEventEnd - perf.navigationStart) : 0;

    var largestP = { title: 'none', size: 0 };
    A_DB.forEach(function(p) {
        var s = JSON.stringify(p).length;
        if (s > largestP.size) largestP = { title: p.title || p.id, size: s };
    });

    var snapshots = A_DB.reduce(function(sum, p) { return sum + (p.versionHistory ? p.versionHistory.length : 0); }, 0);

    var rows = [
        ['Page Load', pageLoad ? pageLoad + 'ms' : 'N/A'],
        ['DOM Ready', domReady ? domReady + 'ms' : 'N/A'],
        ['Largest Proposal', esc(largestP.title) + ' (' + fmtBytes(largestP.size) + ')'],
        ['Version Snapshots', snapshots + ' total across ' + A_DB.length + ' proposals'],
        ['localStorage Keys', localStorage.length + '']
    ];

    if (performance.memory) {
        rows.push(['JS Heap', fmtBytes(performance.memory.usedJSHeapSize) + ' / ' + fmtBytes(performance.memory.jsHeapSizeLimit)]);
    }

    var html = '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">Performance</div>' +
        '<div class="admin-table-wrap"><table class="admin-info-table">';
    rows.forEach(function(r) { html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td></tr>'; });
    html += '</table></div></div>';
    return html;
}
