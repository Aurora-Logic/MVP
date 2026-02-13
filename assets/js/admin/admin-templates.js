// ════════════════════════════════════════
// ADMIN-TEMPLATES — Template/Library Mgmt
// ════════════════════════════════════════

/* exported renderAdminTemplates */

var TPL_TABS = [
    { id: 'seclib',   key: 'pk_seclib',     label: 'Sections',   dataRef: function() { return A_SECLIB; } },
    { id: 'tclib',    key: 'pk_tclib',      label: 'T&C',        dataRef: function() { return A_TCLIB; } },
    { id: 'email',    key: 'pk_email_tpl',  label: 'Email',      dataRef: function() { return A_EMAIL_TPL; } },
    { id: 'pdf',      key: 'pk_templates',  label: 'PDF',        dataRef: function() { return A_TEMPLATES; } }
];
var _tplTab = 'seclib';

function renderAdminTemplates() {
    var el = document.getElementById('adminContent');
    if (!el) return;
    el.innerHTML = '<div class="admin-section">' +
        '<div class="admin-section-title" style="margin-bottom:16px">Templates & Libraries</div>' +
        buildTemplateTabs() +
        '<div id="tplContent"></div></div>';
    switchTemplateTab(_tplTab);
    lucide.createIcons();
}

function buildTemplateTabs() {
    return '<div class="admin-tabs">' +
        TPL_TABS.map(function(t) {
            var count = t.dataRef().length;
            return '<button class="admin-tab' + (t.id === _tplTab ? ' on' : '') + '" onclick="switchTemplateTab(\'' + t.id + '\')">' +
                t.label + ' (' + count + ')</button>';
        }).join('') + '</div>';
}

function switchTemplateTab(tabId) {
    _tplTab = tabId;
    document.querySelectorAll('.admin-tab').forEach(function(btn) {
        btn.classList.toggle('on', btn.textContent.toLowerCase().startsWith(tabId.substring(0, 3)));
    });
    renderTemplateContent();
}

function renderTemplateContent() {
    var tab = TPL_TABS.find(function(t) { return t.id === _tplTab; });
    if (!tab) return;
    var items = tab.dataRef();
    var el = document.getElementById('tplContent');
    if (!el) return;

    var toolbar = '<div class="admin-toolbar" style="margin-bottom:12px">' +
        '<button class="btn-sm-outline" onclick="importTemplates(\'' + _tplTab + '\')"><i data-lucide="upload"></i> Import</button>' +
        '<button class="btn-sm-outline" onclick="exportTemplates(\'' + _tplTab + '\')"><i data-lucide="download"></i> Export</button>' +
        (items.length > 0 ? '<button class="btn-sm-destructive" onclick="deleteAllTemplates(\'' + _tplTab + '\')"><i data-lucide="trash-2"></i> Delete All</button>' : '') +
        '</div>';

    if (!items.length) {
        el.innerHTML = toolbar + '<p style="color:var(--text4);font-size:13px;padding:24px 0;text-align:center">No items in this library.</p>';
        lucide.createIcons();
        return;
    }

    var cards = items.map(function(item, i) { return buildTemplateCard(item, i); }).join('');
    el.innerHTML = toolbar + '<div class="admin-tpl-grid">' + cards + '</div>';
    lucide.createIcons();
}

function buildTemplateCard(item, idx) {
    var title = item.title || item.name || item.subject || 'Untitled';
    var preview = item.content || item.body || item.description || item.terms || '';
    if (typeof preview === 'object') preview = JSON.stringify(preview).substring(0, 100);
    preview = String(preview).replace(/<[^>]*>/g, '').substring(0, 120);
    var cat = item.category || item.type || '';

    return '<div class="admin-tpl-card">' +
        '<div class="admin-tpl-card-head">' +
        '<div class="admin-tpl-card-title">' + esc(title) + '</div>' +
        (cat ? '<span class="admin-badge admin-badge-draft" style="font-size:10px">' + esc(cat) + '</span>' : '') +
        '</div>' +
        '<div class="admin-tpl-card-preview">' + esc(preview || 'No preview') + '</div>' +
        '<div class="admin-tpl-card-foot">' +
        '<button class="btn-sm-icon-ghost" onclick="viewTplJson(\'' + _tplTab + '\',' + idx + ')" data-tooltip="View"><i data-lucide="eye"></i></button>' +
        '<button class="btn-sm-icon-ghost" onclick="editTplJson(\'' + _tplTab + '\',' + idx + ')" data-tooltip="Edit"><i data-lucide="pencil"></i></button>' +
        '<button class="btn-sm-icon-ghost" onclick="duplicateTpl(\'' + _tplTab + '\',' + idx + ')" data-tooltip="Duplicate"><i data-lucide="copy"></i></button>' +
        '<button class="btn-sm-icon-ghost" onclick="deleteTpl(\'' + _tplTab + '\',' + idx + ')" data-tooltip="Delete" style="color:var(--red)"><i data-lucide="trash-2"></i></button>' +
        '</div></div>';
}

function getTabData(tabId) {
    var tab = TPL_TABS.find(function(t) { return t.id === tabId; });
    return tab ? tab.dataRef() : [];
}

function getTabKey(tabId) {
    var tab = TPL_TABS.find(function(t) { return t.id === tabId; });
    return tab ? tab.key : '';
}

function viewTplJson(tabId, idx) {
    var items = getTabData(tabId);
    var item = items[idx];
    if (!item) return;
    adminModal('Template JSON', '<pre class="admin-json">' + esc(JSON.stringify(item, null, 2)) + '</pre>');
}

function editTplJson(tabId, idx) {
    var items = getTabData(tabId);
    var item = items[idx];
    if (!item) return;
    var modalId = adminModal('Edit Template JSON',
        '<textarea class="admin-json-editor" id="tplJsonEditor">' + esc(JSON.stringify(item, null, 2)) + '</textarea>' +
        '<div id="tplJsonErrors" style="margin-top:8px;font-size:12px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px">' +
        '<button class="btn-outline" onclick="closeAdminModal(\'' + modalId + '\')">Cancel</button>' +
        '<button class="btn" onclick="saveTplJson(\'' + tabId + '\',' + idx + ',\'' + modalId + '\')">Save</button></div>');
}

function saveTplJson(tabId, idx, modalId) {
    var ed = document.getElementById('tplJsonEditor');
    if (!ed) return;
    try {
        var obj = JSON.parse(ed.value);
        var key = getTabKey(tabId);
        var items = getTabData(tabId).slice();
        items[idx] = obj;
        if (adminSave(key, items)) {
            closeAdminModal(modalId);
            adminToast('Template updated');
            auditLog('edit_json', key, 'Edited template at index ' + idx);
            renderTemplateContent();
        }
    } catch (e) { adminToast('Invalid JSON: ' + e.message, 'error'); }
}

function duplicateTpl(tabId, idx) {
    var items = getTabData(tabId).slice();
    var item = items[idx];
    if (!item) return;
    var dup = JSON.parse(JSON.stringify(item));
    dup.id = uid();
    if (dup.title) dup.title += ' (Copy)';
    else if (dup.name) dup.name += ' (Copy)';
    items.push(dup);
    var key = getTabKey(tabId);
    if (adminSave(key, items)) {
        adminToast('Template duplicated');
        auditLog('duplicate', key, 'Duplicated template');
        renderTemplateContent();
    }
}

function deleteTpl(tabId, idx) {
    var items = getTabData(tabId);
    var item = items[idx];
    if (!item) return;
    adminConfirm('Delete this template?', function() {
        var updated = items.slice();
        updated.splice(idx, 1);
        var key = getTabKey(tabId);
        if (adminSave(key, updated)) {
            adminToast('Template deleted');
            auditLog('delete_template', key, 'Deleted template at index ' + idx);
            renderTemplateContent();
        }
    }, { title: 'Delete template', confirmText: 'Delete', destructive: true });
}

function deleteAllTemplates(tabId) {
    var items = getTabData(tabId);
    adminConfirm('Delete all ' + items.length + ' items in this library?', function() {
        var key = getTabKey(tabId);
        if (adminSave(key, [])) {
            adminToast('All templates deleted');
            auditLog('delete_all_templates', key, items.length + ' deleted');
            renderTemplateContent();
        }
    }, { title: 'Delete all', confirmText: 'Delete All', destructive: true });
}

function importTemplates(tabId) {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = function() {
        var file = input.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function() {
            try {
                var data = JSON.parse(reader.result);
                if (!Array.isArray(data)) { adminToast('Expected a JSON array', 'error'); return; }
                var key = getTabKey(tabId);
                var existing = getTabData(tabId).slice();
                var merged = existing.concat(data);
                if (adminSave(key, merged)) {
                    adminToast(data.length + ' items imported');
                    auditLog('import_templates', key, data.length + ' imported');
                    renderTemplateContent();
                }
            } catch (e) { adminToast('Invalid JSON file: ' + e.message, 'error'); }
        };
        reader.readAsText(file);
    };
    input.click();
}

function exportTemplates(tabId) {
    var items = getTabData(tabId);
    var tab = TPL_TABS.find(function(t) { return t.id === tabId; });
    downloadBlob(JSON.stringify(items, null, 2), 'pk-' + tabId + '.json', 'application/json');
    adminToast((tab ? tab.label : tabId) + ' exported');
    auditLog('export_templates', tabId, items.length + ' exported');
}
