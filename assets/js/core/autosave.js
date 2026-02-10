// ════════════════════════════════════════
// AUTOSAVE + SAVE INDICATOR
// ════════════════════════════════════════

function showSaveIndicator(state) {
    const el = document.getElementById('saveIndicator');
    if (!el) return;
    el.style.display = 'inline-flex';
    if (state === 'saving') {
        el.classList.add('saving');
        el.querySelector('.save-text').textContent = 'Saving...';
    } else {
        el.classList.remove('saving');
        lastSaveTime = Date.now();
        updateSaveText();
        lucide.createIcons();
    }
}

function updateSaveText() {
    const el = document.getElementById('saveIndicator');
    if (!el || !lastSaveTime) return;
    const diff = Math.floor((Date.now() - lastSaveTime) / 1000);
    let text = 'Saved just now';
    if (diff >= 60) text = `Saved ${Math.floor(diff / 60)}m ago`;
    else if (diff >= 10) text = `Saved ${diff}s ago`;
    el.querySelector('.save-text').textContent = text;
}

// Update relative time every 10 seconds
setInterval(updateSaveText, 10000);

// Push undo snapshot before saving
function pushUndo() {
    const p = cur();
    if (!p) return;
    const snapshot = JSON.parse(JSON.stringify(p));
    undoStack.push(snapshot);
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack = [];
}

let _viewerWarned = false;
function dirty() {
    if (typeof canEdit === 'function' && !canEdit()) { if (!_viewerWarned) { toast('Viewers cannot edit proposals', 'warning'); _viewerWarned = true; setTimeout(() => { _viewerWarned = false; }, 5000); } return; }
    clearTimeout(saveTimer);
    showSaveIndicator('saving');
    // Immediate UI updates (no debounce)
    const titleEl = document.getElementById('fTitle');
    const topTitle = document.getElementById('topTitle');
    if (titleEl && topTitle) topTitle.textContent = titleEl.value || 'Untitled';
    if (typeof refreshStatsBar === 'function') refreshStatsBar();
    saveTimer = setTimeout(async () => {
        const p = cur(); if (!p) return;

        // Push undo state before applying changes
        pushUndo();

        const get = (id) => { const el = document.getElementById(id); return el ? el.value : undefined; };
        const getDate = (id) => { const el = document.getElementById(id); return el ? (el.dataset.value || '') : undefined; };
        p.title = get('fTitle') !== undefined ? get('fTitle') : p.title;
        p.number = get('fNumber') !== undefined ? get('fNumber') : p.number;
        p.date = getDate('fDate') !== undefined ? getDate('fDate') : p.date;
        p.validUntil = getDate('fValid') !== undefined ? getDate('fValid') : p.validUntil;
        p.sender = {
            company: get('fSCo') !== undefined ? get('fSCo') : p.sender.company,
            email: get('fSEm') !== undefined ? get('fSEm') : p.sender.email,
            address: get('fSAd') !== undefined ? get('fSAd') : p.sender.address
        };
        p.client = {
            name: get('fCNa') !== undefined ? get('fCNa') : p.client.name,
            contact: get('fCCo') !== undefined ? get('fCCo') : p.client.contact,
            email: get('fCEm') !== undefined ? get('fCEm') : p.client.email,
            phone: get('fCPh') !== undefined ? get('fCPh') : p.client.phone
        };
        const curEl = document.getElementById('fCur');
        p.currency = curEl ? (cselGetValue(curEl) || p.currency) : p.currency;

        // Payment Terms - save from EditorJS
        if (typeof paymentTermsEditor !== 'undefined' && paymentTermsEditor && typeof paymentTermsEditor.save === 'function') {
            try {
                const data = await paymentTermsEditor.save();
                p.paymentTerms = data;
            } catch (err) { console.warn('Error saving payment terms', err); }
        }



        p.discount = Math.max(0, parseFloat(get('fDiscount')) || 0);
        p.taxRate = Math.min(100, Math.max(0, parseFloat(get('fTaxRate')) || 0));

        // Sections - save from EditorJS or structured forms
        const secEls = document.querySelectorAll('.sec-b');
        if (secEls.length) {
            const newSections = [];
            for (let i = 0; i < secEls.length; i++) {
                const b = secEls[i];
                const secType = b.dataset.type;

                // Structured sections (Testimonial, Case Study)
                if (secType && typeof collectStructuredSection === 'function') {
                    const structured = collectStructuredSection(b);
                    if (structured) { newSections.push(structured); continue; }
                }

                // Standard Content Sections
                const title = b.querySelector('.sec-ti')?.value || '';
                let content = null;

                // Try getting from EditorJS — use the editor keyed to this DOM element's holder
                const editorHolder = b.querySelector('.editorjs-container');
                const editorIdx = editorHolder ? parseInt(editorHolder.id?.replace('sec-editor-', '')) : i;
                const editorKey = !isNaN(editorIdx) ? editorIdx : i;
                if (typeof sectionEditors !== 'undefined' && sectionEditors[editorKey] && typeof sectionEditors[editorKey].save === 'function') {
                    try {
                        content = await sectionEditors[editorKey].save();
                    } catch (err) {
                        console.warn('Error saving section ' + i, err);
                        // Keep existing content on save failure (fallback below)
                    }
                }

                // If content is still null (e.g. editor not ready or failed), try to keep existing
                const origIdx = parseInt(b.dataset.idx);
                if (!content && p.sections && p.sections[!isNaN(origIdx) ? origIdx : i]) {
                    content = p.sections[!isNaN(origIdx) ? origIdx : i].content;
                }
                // Or if it was initialized as empty object
                if (!content) content = { blocks: [] };

                newSections.push({ title, content });
            }
            p.sections = newSections;
        }

        // Line Items - save from inputs and EditorJS
        const liEls = document.querySelectorAll('.li-row');
        if (liEls.length || document.getElementById('liBody')) {
            const newLineItems = [];
            for (const row of liEls) {
                const desc = row.querySelector('.ld')?.value || '';
                const qty = parseFloat(row.querySelector('.lq')?.value) || 0;
                const rate = parseFloat(row.querySelector('.lr')?.value) || 0;

                let detail = null;
                const editorEl = row.querySelector('.li-desc-editor');
                if (editorEl && editorEl._editor && typeof editorEl._editor.save === 'function') {
                    try {
                        detail = await editorEl._editor.save();
                    } catch (e) { console.warn('LI editor save failed', e); }
                }
                if (!detail) detail = { blocks: [] };

                newLineItems.push({ desc, detail, qty, rate });
            }
            p.lineItems = newLineItems;
        }

        // Phase 2 data collectors
        if (typeof collectPackagesData === 'function') collectPackagesData(p);
        if (typeof collectAddOnsData === 'function') collectAddOnsData(p);
        if (typeof collectPaymentScheduleData === 'function') collectPaymentScheduleData(p);

        p.updatedAt = Date.now();
        p.lastEditedBy = CONFIG?.activeUserId || null;
        persist();
        showSaveIndicator('saved');
        document.getElementById('topTitle').textContent = p.title || 'Untitled';
        if (typeof refreshStatsBar === 'function') refreshStatsBar();
        refreshSide();
    }, 350);
}

// Undo/Redo
function undo() {
    if (!undoStack.length) return;
    const p = cur();
    if (!p) return;
    redoStack.push(JSON.parse(JSON.stringify(p)));
    const prev = undoStack.pop();
    const idx = DB.findIndex(x => x.id === CUR);
    if (idx >= 0) DB[idx] = prev;
    persist();
    loadEditor(CUR);
    toast('Undone');
}

function redo() {
    if (!redoStack.length) return;
    const p = cur();
    if (!p) return;
    undoStack.push(JSON.parse(JSON.stringify(p)));
    const next = redoStack.pop();
    const idx = DB.findIndex(x => x.id === CUR);
    if (idx >= 0) DB[idx] = next;
    persist();
    loadEditor(CUR);
    toast('Redone');
}
