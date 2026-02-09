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

function dirty() {
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
        p.currency = get('fCur') !== undefined ? get('fCur') : p.currency;

        // Payment Terms - save from EditorJS
        if (typeof paymentTermsEditor !== 'undefined' && paymentTermsEditor && typeof paymentTermsEditor.save === 'function') {
            try {
                const data = await paymentTermsEditor.save();
                p.paymentTerms = data;
            } catch (err) { console.warn('Error saving payment terms', err); }
        }

        p.discount = parseFloat(get('fDiscount')) || 0;
        p.taxRate = parseFloat(get('fTaxRate')) || 0;

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

                // Try getting from EditorJS
                if (typeof sectionEditors !== 'undefined' && sectionEditors[i] && typeof sectionEditors[i].save === 'function') {
                    try {
                        content = await sectionEditors[i].save();
                    } catch (err) {
                        console.warn('Error saving section ' + i, err);
                        // Fallback to existing content if save fails to avoid data loss?
                        // But existing content might be stale. 
                        // If save fails, content remains null.
                    }
                }

                // If content is still null (e.g. editor not ready or failed), try to keep existing?
                if (!content && p.sections && p.sections[i]) {
                    content = p.sections[i].content;
                }
                // Or if it was initialized as empty object
                if (!content) content = { blocks: [] };

                newSections.push({ title, content });
            }
            p.sections = newSections;
        }

        // Lines
        const liEls = document.querySelectorAll('.li-row');
        if (liEls.length || document.getElementById('liBody')) {
            p.lineItems = [];
            liEls.forEach(row => {
                p.lineItems.push({
                    desc: row.querySelector('.ld')?.value || '',
                    detail: row.querySelector('.ld-sub')?.value || '',
                    qty: parseFloat(row.querySelector('.lq')?.value) || 0,
                    rate: parseFloat(row.querySelector('.lr')?.value) || 0
                });
            });
        }

        // Phase 2 data collectors
        if (typeof collectPackagesData === 'function') collectPackagesData(p);
        if (typeof collectAddOnsData === 'function') collectAddOnsData(p);
        if (typeof collectPaymentScheduleData === 'function') collectPaymentScheduleData(p);

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
