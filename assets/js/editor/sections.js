// ════════════════════════════════════════
// SECTIONS TAB
// ════════════════════════════════════════

function renderSections(p) {
    const el = document.getElementById('edSections');
    const secs = p.sections || [];
    let html = `<div class="sec-header">
    <div><div class="sec-header-t">Content Sections</div><div class="sec-header-d">Drag to reorder</div></div>
    <div class="sec-header-actions">
      <button class="btn-sm-outline" onclick="openLibrary()"><i data-lucide="bookmark"></i> Library</button>
      <button class="btn-sm-outline" onclick="showAddSectionMenu(this)"><i data-lucide="plus"></i> Add Section</button>
    </div>
  </div>
  <div id="secList">`;
    secs.forEach((s, i) => {
        if (s.type === 'testimonial' || s.type === 'case-study') html += structuredSecBlockHtml(s, i);
        else html += secBlockHtml(s, i);
    });
    html += '</div>';
    if (!secs.length) html += `<div id="secEmpty" class="empty empty-sm"><div class="empty-icon"><i data-lucide="text"></i></div><div class="empty-t">No sections yet</div><div class="empty-d">Add content sections like Scope, Timeline, and Terms to tell your story.</div><button class="btn-sm-outline" onclick="addSec()"><i data-lucide="plus"></i> Add Section</button></div>`;
    el.innerHTML = html;

    // Initialize EditorJS
    setTimeout(() => initSectionEditors(secs), 10);

    initDrag();
    lucide.createIcons();
}

function initSectionEditors(sections) {
    // Destroy existing
    Object.values(sectionEditors).forEach(e => {
        if (e && typeof e.destroy === 'function') try { e.destroy(); } catch (err) { }
    });
    sectionEditors = {};

    // Resolve CDN globals with fallbacks (matches reference pattern)
    const EditorHeader = window.Header || window.EditorjsHeader;
    const EditorList = window.List || window.EditorjsList || window.NestedList;
    const EditorQuote = window.Quote;
    const EditorMarker = window.Marker;
    const EditorDelimiter = window.Delimiter;

    sections.forEach((s, i) => {
        if (s.type === 'testimonial' || s.type === 'case-study') return;

        let data;
        // Convert plain text to blocks if needed
        if (typeof s.content === 'string') {
            if (s.content.trim()) {
                data = { blocks: s.content.split('\n\n').map(t => ({ type: 'paragraph', data: { text: t } })) };
            } else {
                data = { blocks: [] };
            }
        } else {
            data = s.content || { blocks: [] };
        }

        const holderEl = document.getElementById(`sec-editor-${i}`);
        if (holderEl) holderEl.classList.add('editor-loading');

        try {
            sectionEditors[i] = new EditorJS({
                holder: `sec-editor-${i}`,
                data: data,
                tools: {
                    header: { class: EditorHeader, inlineToolbar: true, config: { placeholder: 'Heading', levels: [2, 3, 4], defaultLevel: 2 } },
                    list: { class: EditorList, inlineToolbar: true },
                    quote: { class: EditorQuote, inlineToolbar: true },
                    marker: EditorMarker,
                    delimiter: EditorDelimiter
                },
                placeholder: 'Write section content... (use / for blocks)',
                minHeight: 60,
                onReady: () => { if (holderEl) { holderEl.classList.remove('editor-loading'); holderEl.classList.add('editor-loaded'); } },
                onChange: () => dirty()
            });
        } catch (e) { console.error('EditorJS init error', e); }
    });
}


function secBlockHtml(s, i) {
    return `<div class="sec-b open" draggable="true" data-idx="${i}">
    <div class="sec-hd" onclick="togSec(this)">
      <span class="sec-grip" onmousedown="event.stopPropagation()"><i data-lucide="grip-vertical"></i></span>
      <span class="sec-nm">${esc(s.title) || 'New Section'}</span>
      <span class="sec-chv"><i data-lucide="chevron-down"></i></span>
      <div class="sec-acts" onclick="event.stopPropagation()">
        <button class="btn-sm-icon-ghost" onclick="showInsertVariableDropdown(sectionEditors[${i}],this)" data-tooltip="Insert Variable" data-side="bottom" data-align="center"><i data-lucide="braces"></i></button>
        <button class="btn-sm-icon-ghost" onclick="saveSectionToLib(this)" data-tooltip="Save to Library" data-side="bottom" data-align="center"><i data-lucide="bookmark"></i></button>
        <button class="btn-sm-icon-ghost" onclick="delSec(this)" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="sec-bd">
      <div class="fg"><label class="fl">Title</label><input type="text" class="sec-ti" value="${esc(s.title)}" placeholder="e.g. Executive Summary" oninput="updSecName(this);dirty()"></div>
      <div class="fg fg-flush"><label class="fl">Content</label>
        <div class="editorjs-container" id="sec-editor-${i}"></div>
      </div>
    </div>
  </div>`;
}

function addSec(type) {
    const p = cur(); if (!p) return;
    if (type === 'testimonial') p.sections.push({ type: 'testimonial', title: 'Client Testimonial', testimonial: { quote: '', author: '', company: '', rating: 5 } });
    else if (type === 'case-study') p.sections.push({ type: 'case-study', title: 'Case Study', caseStudy: { challenge: '', solution: '', result: '' } });
    else p.sections.push({ title: '', content: { blocks: [] } }); // Start with empty object for block editor
    persist(); renderSections(p); refreshStatsBar(); lucide.createIcons();
}

function showAddSectionMenu(btn) {
    const existing = document.querySelector('.sec-type-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'sec-type-menu';
    menu.innerHTML = `
        <div class="sec-type-opt" onclick="this.parentElement.remove();addSec()"><i data-lucide="text"></i> Text Section</div>
        <div class="sec-type-opt" onclick="this.parentElement.remove();addSec('testimonial')"><i data-lucide="quote"></i> Testimonial</div>
        <div class="sec-type-opt" onclick="this.parentElement.remove();addSec('case-study')"><i data-lucide="lightbulb"></i> Case Study</div>`;
    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(menu);
    lucide.createIcons();
    const close = (e) => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 10);
}
function togSec(h) { h.closest('.sec-b').classList.toggle('open'); }
function updSecName(inp) { inp.closest('.sec-b').querySelector('.sec-nm').textContent = inp.value || 'New Section'; }

function delSec(btn) {
    const block = btn.closest('.sec-b');
    const idx = parseInt(block.dataset.idx);
    const p = cur();
    if (!p) return;

    // Destroy editor
    if (sectionEditors[idx] && typeof sectionEditors[idx].destroy === 'function') {
        try { sectionEditors[idx].destroy(); } catch (e) { }
        delete sectionEditors[idx];
    }

    p.sections.splice(idx, 1);
    persist();
    renderSections(p);
    refreshStatsBar();
    lucide.createIcons();
}

function initDrag() {
    const list = document.getElementById('secList');
    if (!list) return;
    let dragEl = null;
    list.querySelectorAll('.sec-b').forEach(b => {
        b.addEventListener('dragstart', (e) => {
            dragEl = b; b.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });
        b.addEventListener('dragend', () => {
            b.classList.remove('dragging');
            list.querySelectorAll('.sec-b').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            const p = cur(); if (!p) return;
            const secEls = list.querySelectorAll('.sec-b');
            const newOrder = [...secEls].map(el => parseInt(el.dataset.idx));
            if (newOrder.every((v, i) => v === i)) return; // no change
            const newSections = newOrder.map(i => JSON.parse(JSON.stringify(p.sections[i])));
            p.sections = newSections;
            persist();
            renderSections(p);
        });
        b.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!dragEl || dragEl === b) return;
            list.querySelectorAll('.sec-b').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            const mid = b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2;
            b.classList.add(e.clientY < mid ? 'drag-over' : 'drag-over-bottom');
        });
        b.addEventListener('dragleave', () => { b.classList.remove('drag-over', 'drag-over-bottom'); });
        b.addEventListener('drop', (e) => {
            e.preventDefault();
            list.querySelectorAll('.sec-b').forEach(x => { x.classList.remove('drag-over', 'drag-over-bottom'); });
            if (!dragEl || dragEl === b) return;
            const mid = b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2;
            if (e.clientY < mid) list.insertBefore(dragEl, b);
            else list.insertBefore(dragEl, b.nextSibling);
        });
    });
}

async function saveSectionToLib(btn) {
    const block = btn.closest('.sec-b');
    const idx = parseInt(block.dataset.idx);
    const title = block.querySelector('.sec-ti').value;
    if (!title) { toast('Add a title first'); return; }
    let content = { blocks: [] };
    if (sectionEditors[idx] && typeof sectionEditors[idx].save === 'function') {
        try { content = await sectionEditors[idx].save(); } catch (e) { console.warn('Save to lib: editor save failed', e); }
    }
    let lib = safeGetStorage('pk_seclib', []);
    lib.push({ title, content, savedAt: Date.now() });
    safeLsSet('pk_seclib', lib);
    toast('Saved to library');
}

const DEFAULT_SECTIONS = [
    { title: 'Executive Summary', category: 'intro', content: 'We are pleased to present this proposal outlining our approach, timeline, and investment for the project described herein.' },
    { title: 'Project Overview', category: 'intro', content: 'This section provides a high-level overview of the project objectives, scope, and expected outcomes.' },
    { title: 'Scope of Work', category: 'scope', content: 'The following deliverables are included in this proposal:\n\n• Project planning and requirements gathering\n• Design and development\n• Testing and quality assurance\n• Deployment and training' },
    { title: 'Timeline & Milestones', category: 'scope', content: 'Phase 1: Discovery (Week 1-2)\nPhase 2: Development (Week 3-6)\nPhase 3: Review & Refinement (Week 7-8)\nPhase 4: Launch (Week 9)' },
    { title: 'Terms & Conditions', category: 'terms', content: 'All intellectual property transfers to the client upon final payment.\n\nEither party may terminate with 15 days written notice.\n\nConfidential information will not be disclosed to third parties.' },
    { title: 'Payment Terms', category: 'pricing', content: '50% deposit upon acceptance\n25% at project midpoint\n25% upon completion\n\nPayment due within 15 days of invoice.' },
    { title: 'About Us', category: 'intro', content: 'We are a team of experienced professionals dedicated to delivering high-quality solutions that drive business results.' },
    { title: 'Next Steps', category: 'general', content: '1. Review and accept this proposal\n2. Sign the attached agreement\n3. Submit initial deposit\n4. Schedule kickoff meeting' }
];

function openLibrary() {
    const lib = safeGetStorage('pk_seclib', []);
    const defaultLib = [...DEFAULT_SECTIONS, ...(typeof STRUCTURED_SECTION_DEFAULTS !== 'undefined' ? STRUCTURED_SECTION_DEFAULTS : [])];
    const all = [...defaultLib.map(s => ({ ...s, source: 'default' })), ...lib.map(s => ({ ...s, category: s.category || 'general', source: 'saved' }))];
    window._libData = all;
    window._libFilter = { search: '', category: 'all' };
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap'; wrap.id = 'libModal';
    wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
    wrap.innerHTML = `<div class="modal modal-sec-lib" onclick="event.stopPropagation()">
        <div class="modal-t">Section Library</div>
        <div class="modal-d">Click to insert into your proposal</div>
        <div class="lib-tabs lib-tabs-bar">
            <button class="filter-tab on" id="libTabSections" onclick="setLibTab('sections',this)">Sections</button>
            ${typeof renderPacksTab === 'function' ? '<button class="filter-tab" id="libTabPacks" onclick="setLibTab(\'packs\',this)">Packs</button>' : ''}
        </div>
        <div id="libSectionsView">
            <div class="lib-search"><input type="text" id="libSearch" placeholder="Search sections..." oninput="filterLibrary()"></div>
            <div class="lib-cats">
                <span class="lib-cat active" data-cat="all" onclick="setLibCat(this)">All</span>
                <span class="lib-cat" data-cat="intro" onclick="setLibCat(this)">Intro</span>
                <span class="lib-cat" data-cat="scope" onclick="setLibCat(this)">Scope</span>
                <span class="lib-cat" data-cat="terms" onclick="setLibCat(this)">Terms</span>
                <span class="lib-cat" data-cat="pricing" onclick="setLibCat(this)">Pricing</span>
                <span class="lib-cat" data-cat="general" onclick="setLibCat(this)">General</span>
            </div>
            <div id="libList" class="lib-list-scroll"></div>
        </div>
        <div id="libPacksView" class="lib-packs-view" style="display:none"></div>
        <div class="modal-foot"><button class="btn-sm-outline" onclick="document.getElementById('libModal').remove()">Close</button></div>
    </div>`;
    document.body.appendChild(wrap);
    requestAnimationFrame(() => wrap.classList.add('show'));
    filterLibrary();
    lucide.createIcons();
}

function setLibCat(el) {
    document.querySelectorAll('.lib-cat').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    window._libFilter.category = el.dataset.cat;
    filterLibrary();
}

function setLibTab(tab, el) {
    document.querySelectorAll('.lib-tabs .filter-tab').forEach(t => t.classList.remove('on'));
    if (el) el.classList.add('on');
    const secView = document.getElementById('libSectionsView');
    const packView = document.getElementById('libPacksView');
    if (secView) secView.style.display = tab === 'sections' ? '' : 'none';
    if (packView) {
        packView.style.display = tab === 'packs' ? '' : 'none';
        if (tab === 'packs' && typeof renderPacksTab === 'function') renderPacksTab();
    }
}

function filterLibrary() {
    const search = (document.getElementById('libSearch')?.value || '').toLowerCase();
    const cat = window._libFilter.category;
    const list = document.getElementById('libList');
    if (!list) return;
    const filtered = window._libData.filter(s => s.title.toLowerCase().includes(search) && (cat === 'all' || s.category === cat));
    if (!filtered.length) { list.innerHTML = '<div class="lib-empty">No matching sections found</div>'; return; }
    const cc = { intro: 'cat-intro', scope: 'cat-scope', terms: 'cat-terms', pricing: 'cat-pricing', general: 'cat-general' };
    list.innerHTML = filtered.map(s => {
        const idx = window._libData.indexOf(s);
        return `<div class="lib-item" onclick="insertFromLib(${idx})"><i data-lucide="file-text"></i><span class="lib-item-t">${esc(s.title)}</span><span class="lib-item-cat ${cc[s.category] || 'cat-general'}">${s.category}</span><span class="lib-item-d">${s.source === 'default' ? 'Default' : 'Saved'}</span></div>`;
    }).join('');
    lucide.createIcons();
}

function insertFromLib(i) {
    const s = window._libData[i]; const p = cur(); if (!p) return;
    const sec = { title: s.title, content: s.content };
    if (s.type) sec.type = s.type;
    if (s.testimonial) sec.testimonial = JSON.parse(JSON.stringify(s.testimonial));
    if (s.caseStudy) sec.caseStudy = JSON.parse(JSON.stringify(s.caseStudy));
    p.sections.push(sec); persist(); document.getElementById('libModal')?.remove();
    renderSections(p); refreshStatsBar(); lucide.createIcons(); toast('Section added');
}
