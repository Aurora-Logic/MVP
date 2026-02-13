// ════════════════════════════════════════
// ADMIN-CONFIG — Feature Flags + Danger Zone
// ════════════════════════════════════════

/* exported renderAdminConfig */

var FEATURE_FLAGS = [
    { key: 'teamEnabled',        label: 'Team / multi-user',     desc: 'Multiple team members with roles' },
    { key: 'aiEnabled',          label: 'AI writing assistant',   desc: 'Claude API for section improvement' },
    { key: 'packagesEnabled',    label: 'Package pricing',       desc: 'Tiered package comparison' },
    { key: 'addonsEnabled',      label: 'Add-ons',               desc: 'Optional add-on items' },
    { key: 'scheduleEnabled',    label: 'Payment schedule',      desc: 'Milestone-based payments' },
    { key: 'kanbanEnabled',      label: 'Kanban board',          desc: 'Visual pipeline view' },
    { key: 'derivativesEnabled', label: 'Derivatives',           desc: 'SOW / Contract / Receipt' },
    { key: 'diffEnabled',        label: 'Version diff',          desc: 'Compare proposal versions' },
    { key: 'focusModeEnabled',   label: 'Focus mode',            desc: 'Distraction-free writing' },
    { key: 'completenessEnabled',label: 'Completeness scoring',  desc: 'Proposal quality checks' }
];

function renderAdminConfig() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = buildFeatureFlags() + buildApiKeysSection() + buildOverridesSection() + buildDangerZone();
    lucide.createIcons();
}

// ─── Feature Flags ───
function buildFeatureFlags() {
    var adminCfg = safeGet('pk_admin_config', {});
    var flags = adminCfg.flags || {};
    var rows = FEATURE_FLAGS.map(function(f) {
        var on = flags[f.key] !== false; // Default ON
        return '<div class="admin-flag-row">' +
            '<div class="admin-flag-info"><div class="admin-flag-label">' + esc(f.label) + '</div>' +
            '<div class="admin-flag-desc">' + esc(f.desc) + '</div></div>' +
            '<button class="admin-toggle' + (on ? ' on' : '') + '" onclick="toggleFeature(\'' + f.key + '\')"></button></div>';
    }).join('');

    return '<div class="admin-section"><div class="admin-section-head">' +
        '<div class="admin-section-title">Feature Flags</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn-sm-outline" onclick="enableAllFlags()">Enable all</button>' +
        '<button class="btn-sm-outline" onclick="disableAllFlags()">Disable all</button></div></div>' +
        '<div class="admin-table-wrap" style="overflow:hidden">' + rows + '</div></div>';
}

function toggleFeature(key) {
    var adminCfg = safeGet('pk_admin_config', {});
    if (!adminCfg.flags) adminCfg.flags = {};
    var current = adminCfg.flags[key] !== false;
    adminCfg.flags[key] = !current;
    safePut('pk_admin_config', adminCfg);
    auditLog('toggle_feature', key, key + ': ' + (current ? 'ON \u2192 OFF' : 'OFF \u2192 ON'));
    adminToast(key + ' ' + (!current ? 'enabled' : 'disabled'));
    renderAdminConfig();
}

function enableAllFlags() {
    var adminCfg = safeGet('pk_admin_config', {});
    adminCfg.flags = {};
    FEATURE_FLAGS.forEach(function(f) { adminCfg.flags[f.key] = true; });
    safePut('pk_admin_config', adminCfg);
    auditLog('toggle_feature', 'all', 'All features enabled');
    adminToast('All features enabled');
    renderAdminConfig();
}

function disableAllFlags() {
    var adminCfg = safeGet('pk_admin_config', {});
    adminCfg.flags = {};
    FEATURE_FLAGS.forEach(function(f) { adminCfg.flags[f.key] = false; });
    safePut('pk_admin_config', adminCfg);
    auditLog('toggle_feature', 'all', 'All features disabled');
    adminToast('All features disabled');
    renderAdminConfig();
}

// ─── API Keys ───
function buildApiKeysSection() {
    var key = A_CONFIG.aiApiKey || '';
    var masked = key ? '\u2022'.repeat(12) + key.slice(-4) : 'Not set';
    var model = A_CONFIG.aiModel || 'sonnet';
    var webhook = A_CONFIG.webhookUrl || '';

    return '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">API Keys & Integrations</div>' +
        '<div class="admin-table-wrap" style="overflow:hidden">' +
        '<div class="admin-flag-row"><div class="admin-flag-info">' +
        '<div class="admin-flag-label">AI API Key</div>' +
        '<div class="admin-flag-desc" style="font-family:var(--mono)">' + esc(masked) + '</div></div>' +
        '<button class="btn-sm-outline" onclick="editApiKey()">Edit</button></div>' +
        '<div class="admin-flag-row"><div class="admin-flag-info">' +
        '<div class="admin-flag-label">AI Model</div>' +
        '<div class="admin-flag-desc">' + esc(model) + '</div></div>' +
        '<button class="btn-sm-outline" onclick="editAiModel()">Change</button></div>' +
        '<div class="admin-flag-row"><div class="admin-flag-info">' +
        '<div class="admin-flag-label">Webhook URL</div>' +
        '<div class="admin-flag-desc" style="font-family:var(--mono);font-size:11px">' + esc(webhook || 'Not configured') + '</div></div>' +
        '<div style="display:flex;gap:4px">' +
        '<button class="btn-sm-outline" onclick="editWebhook()">Edit</button>' +
        (webhook ? '<button class="btn-sm-outline" onclick="testWebhook()">Test</button>' : '') +
        '</div></div></div></div>';
}

function editApiKey() {
    var modalId = adminModal('Edit AI API Key',
        '<div class="fg"><label class="fl">API Key</label>' +
        '<input type="password" id="adminApiKeyInput" value="' + esc(A_CONFIG.aiApiKey || '') + '" placeholder="sk-ant-..."></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn" onclick="saveApiKey(\'' + modalId + '\')">Save</button></div>', { width: '450px' });
}

function saveApiKey(modalId) {
    var val = document.getElementById('adminApiKeyInput');
    if (!val) return;
    A_CONFIG.aiApiKey = val.value.trim();
    adminSave('pk_config', A_CONFIG);
    closeAdminModal(modalId);
    adminToast('API key updated');
    auditLog('edit_api_key', 'config', 'API key changed');
    renderAdminConfig();
}

function editAiModel() {
    var modalId = adminModal('Change AI Model',
        '<div class="fg"><label class="fl">Model</label>' +
        '<select id="adminModelSelect" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--r);background:var(--background);color:var(--text)">' +
        '<option value="sonnet"' + (A_CONFIG.aiModel === 'sonnet' ? ' selected' : '') + '>Claude Sonnet (fast)</option>' +
        '<option value="opus"' + (A_CONFIG.aiModel === 'opus' ? ' selected' : '') + '>Claude Opus (powerful)</option>' +
        '<option value="haiku"' + (A_CONFIG.aiModel === 'haiku' ? ' selected' : '') + '>Claude Haiku (quick)</option>' +
        '</select></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn" onclick="saveAiModel(\'' + modalId + '\')">Save</button></div>', { width: '400px' });
}

function saveAiModel(modalId) {
    var sel = document.getElementById('adminModelSelect');
    if (!sel) return;
    A_CONFIG.aiModel = sel.value;
    adminSave('pk_config', A_CONFIG);
    closeAdminModal(modalId);
    adminToast('AI model changed to ' + sel.value);
    auditLog('edit_ai_model', 'config', 'Model: ' + sel.value);
    renderAdminConfig();
}

function editWebhook() {
    var modalId = adminModal('Edit Webhook URL',
        '<div class="fg"><label class="fl">Webhook URL</label>' +
        '<input type="url" id="adminWebhookInput" value="' + esc(A_CONFIG.webhookUrl || '') + '" placeholder="https://..."></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn" onclick="saveWebhook(\'' + modalId + '\')">Save</button></div>', { width: '450px' });
}

function saveWebhook(modalId) {
    var val = document.getElementById('adminWebhookInput');
    if (!val) return;
    A_CONFIG.webhookUrl = val.value.trim();
    adminSave('pk_config', A_CONFIG);
    closeAdminModal(modalId);
    adminToast('Webhook updated');
    auditLog('edit_webhook', 'config', 'Webhook: ' + (A_CONFIG.webhookUrl || 'cleared'));
    renderAdminConfig();
}

function testWebhook() {
    if (!A_CONFIG.webhookUrl) { adminToast('No webhook URL', 'error'); return; }
    adminToast('Testing webhook...');
    fetch(A_CONFIG.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test', source: 'ProposalKit Admin', ts: Date.now() })
    }).then(function(r) {
        adminToast('Webhook responded: ' + r.status + ' ' + r.statusText, r.ok ? 'info' : 'error');
    }).catch(function(e) {
        adminToast('Webhook failed: ' + e.message, 'error');
    });
}

// ─── Overrides (read-only config overview) ───
function buildOverridesSection() {
    var rows = [
        ['Currency', A_CONFIG.currency || '\u20B9'],
        ['Tax Rate', (A_CONFIG.taxRate != null ? A_CONFIG.taxRate + '%' : 'Not set')],
        ['Default Validity', (A_CONFIG.proposalValidity || 30) + ' days'],
        ['Company', A_CONFIG.company || 'Not set'],
        ['Country', A_CONFIG.country || 'Not set'],
        ['Logo', A_CONFIG.logo ? 'Uploaded' : 'Not set'],
        ['Brand Color', A_CONFIG.brandColor || '#800020']
    ];
    var html = '<div class="admin-section"><div class="admin-section-title" style="margin-bottom:12px">Configuration Overview</div>' +
        '<div class="admin-table-wrap"><table class="admin-info-table">';
    rows.forEach(function(r) { html += '<tr><td>' + r[0] + '</td><td>' + esc(String(r[1])) + '</td></tr>'; });
    html += '</table></div></div>';
    return html;
}

// ─── Danger Zone ───
function buildDangerZone() {
    var keyOpts = Object.keys(STORAGE_KEYS).map(function(k) {
        return '<option value="' + k + '">' + esc(STORAGE_KEYS[k]) + ' (' + k + ')</option>';
    }).join('');

    return '<div class="admin-section"><div class="admin-danger">' +
        '<div class="admin-danger-title"><i data-lucide="alert-triangle" style="width:16px;height:16px"></i> Danger Zone</div>' +
        '<div class="admin-danger-row"><div><strong>Clear specific key</strong><br><span style="font-size:12px;color:var(--text3)">Remove one localStorage key</span></div>' +
        '<div style="display:flex;gap:8px;align-items:center">' +
        '<select id="dangerKeySelect" style="font-size:12px;padding:4px 8px;border-radius:var(--r);border:1px solid var(--border);background:var(--background);color:var(--text)">' + keyOpts + '</select>' +
        '<button class="btn-sm-destructive" onclick="clearSpecificKey()">Clear</button></div></div>' +
        '<div class="admin-danger-row"><div><strong>Clear version histories</strong><br><span style="font-size:12px;color:var(--text3)">Remove all version snapshots to save space</span></div>' +
        '<button class="btn-sm-destructive" onclick="clearVersionHistories()">Clear</button></div>' +
        '<div class="admin-danger-row"><div><strong>Regenerate share tokens</strong><br><span style="font-size:12px;color:var(--text3)">Fix cloned tokens from duplicate bug</span></div>' +
        '<button class="btn-sm-destructive" onclick="regenShareTokens()">Regenerate</button></div>' +
        '<div class="admin-danger-row"><div><strong style="color:var(--red)">Factory Reset</strong><br><span style="font-size:12px;color:var(--text3)">Delete ALL data and start fresh</span></div>' +
        '<button class="btn-sm-destructive" onclick="factoryReset()">Reset Everything</button></div>' +
        '</div></div>';
}

function clearSpecificKey() {
    var sel = document.getElementById('dangerKeySelect');
    if (!sel) return;
    var key = sel.value;
    adminConfirm('Clear "' + (STORAGE_KEYS[key] || key) + '"? This will delete all data for this key.', function() {
        localStorage.removeItem(key);
        adminLoad();
        adminToast(key + ' cleared');
        auditLog('clear_key', key, 'Cleared ' + (STORAGE_KEYS[key] || key));
        renderAdminConfig();
    }, { title: 'Clear ' + key, confirmText: 'Clear', destructive: true });
}

function clearVersionHistories() {
    var count = 0;
    A_DB.forEach(function(p) {
        if (p.versionHistory && p.versionHistory.length) {
            count += p.versionHistory.length;
            delete p.versionHistory;
            p.version = 1;
        }
    });
    if (count === 0) { adminToast('No version histories found'); return; }
    adminSave('pk_db', A_DB);
    adminToast(count + ' version snapshots cleared');
    auditLog('clear_versions', 'proposals', count + ' snapshots cleared');
}

function regenShareTokens() {
    var count = 0;
    A_DB.forEach(function(p) {
        if (p.shareToken) {
            var arr = new Uint8Array(16);
            crypto.getRandomValues(arr);
            p.shareToken = Array.from(arr).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
            count++;
        }
    });
    if (count === 0) { adminToast('No share tokens found'); return; }
    adminSave('pk_db', A_DB);
    adminToast(count + ' tokens regenerated');
    auditLog('regen_tokens', 'proposals', count + ' tokens regenerated');
}

function factoryReset() {
    var modalId = adminModal('Factory Reset',
        '<p style="color:var(--red);font-weight:600;margin-bottom:12px">This will delete ALL application data permanently.</p>' +
        '<p style="font-size:13px;color:var(--text3);margin-bottom:16px">Type <strong>RESET</strong> below to confirm:</p>' +
        '<input type="text" id="factoryResetConfirm" placeholder="Type RESET" style="width:100%;margin-bottom:16px">' +
        '<div style="display:flex;gap:8px;justify-content:flex-end">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn-sm-destructive" onclick="executeFactoryReset(\'' + modalId + '\')">Reset Everything</button></div>',
        { width: '420px' });
}

function executeFactoryReset(modalId) {
    var input = document.getElementById('factoryResetConfirm');
    if (!input || input.value.trim() !== 'RESET') {
        adminToast('Type RESET to confirm', 'error');
        return;
    }
    auditLog('factory_reset', 'all', 'Factory reset executed');
    Object.keys(STORAGE_KEYS).forEach(function(k) { localStorage.removeItem(k); });
    localStorage.removeItem('pk_admin_config');
    localStorage.removeItem('pk_admin_audit');
    localStorage.removeItem('pk_admin_errors');
    localStorage.removeItem('pk_theme');
    closeAdminModal(modalId);
    adminToast('All data cleared. Redirecting...');
    setTimeout(function() { window.location.href = 'index.html'; }, 1500);
}
