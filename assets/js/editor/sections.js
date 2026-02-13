// ════════════════════════════════════════
// SECTIONS TAB
// ════════════════════════════════════════

/* global destroyTiptapMenus */
/* exported addSec, showAddSectionMenu, togSec, updSecName, delSec, saveSectionToLib, openLibrary, setLibCat, setLibTab, insertFromLib */
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

function destroyAllEditors() {
    Object.values(sectionEditors).forEach(e => {
        if (typeof destroyTiptapMenus === 'function') try { destroyTiptapMenus(e); } catch (_) { }
        if (e && typeof e.destroy === 'function') try { e.destroy(); } catch (err) { }
    });
    sectionEditors = {};
}

// PERFORMANCE FIX: Lazy load section editors using IntersectionObserver
let sectionObserver = null;

function initSectionEditors(sections) {
    destroyAllEditors();

    // Clean up previous observer
    if (sectionObserver) {
        sectionObserver.disconnect();
        sectionObserver = null;
    }

    // Immediately initialize first 3 sections (above-the-fold)
    sections.forEach((s, i) => {
        if (s.type === 'testimonial' || s.type === 'case-study') return;
        const holderEl = document.getElementById(`sec-editor-${i}`);
        if (!holderEl) return;

        if (i < 3) {
            // Load immediately
            holderEl.classList.add('editor-loading');
            const html = migrateEditorContent(s.content);
            initSingleSectionEditor(i, holderEl, html);
        } else {
            // Mark as pending lazy load
            holderEl.classList.add('editor-pending');
            holderEl.innerHTML = '<div class="editor-lazy-placeholder">Editor will load when scrolled into view...</div>';
        }
    });

    // Set up IntersectionObserver for lazy loading
    sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const holderEl = entry.target;
            if (!holderEl.classList.contains('editor-pending')) return;

            // Extract index from element ID
            const match = holderEl.id.match(/sec-editor-(\d+)/);
            if (!match) return;
            const i = parseInt(match[1]);
            const s = sections[i];
            if (!s || s.type === 'testimonial' || s.type === 'case-study') return;

            // Initialize editor on demand
            holderEl.classList.remove('editor-pending');
            holderEl.classList.add('editor-loading');
            holderEl.innerHTML = '';
            const html = migrateEditorContent(s.content);
            initSingleSectionEditor(i, holderEl, html);

            // Stop observing this element
            sectionObserver.unobserve(holderEl);
        });
    }, { rootMargin: '200px' }); // Start loading 200px before visible

    // Observe all pending editors
    sections.forEach((s, i) => {
        if (i < 3) return; // Skip already-loaded
        if (s.type === 'testimonial' || s.type === 'case-study') return;
        const holderEl = document.getElementById(`sec-editor-${i}`);
        if (holderEl && holderEl.classList.contains('editor-pending')) {
            sectionObserver.observe(holderEl);
        }
    });

    // Safety: force fallback for any editor still stuck after 2s
    setTimeout(() => sections.forEach((s, i) => {
        if (s.type === 'testimonial' || s.type === 'case-study') return;
        const h = document.getElementById(`sec-editor-${i}`);
        if (!h || !h.classList.contains('editor-loading')) return;
        h.classList.remove('editor-loading'); h.classList.add('editor-loaded');
        if (!h.querySelector('[contenteditable]') && !h.querySelector('.sec-fallback-ta'))
            showFallbackEditor(h, migrateEditorContent(s.content), i);
    }), 2000);
}

function initSingleSectionEditor(i, holderEl, html) {
    try {
        const editor = createEditor(holderEl, { content: html, placeholder: 'Write section content...', onChange: () => dirty() });
        if (!editor) { showFallbackEditor(holderEl, html, i); return; }
        sectionEditors[i] = editor;
        holderEl.classList.remove('editor-loading'); holderEl.classList.add('editor-loaded');
        // Verify Tiptap rendered a contenteditable
        setTimeout(() => {
            if (!holderEl.querySelector('[contenteditable]')) {
                try { editor.destroy(); } catch (_e) { /* ignore */ }
                delete sectionEditors[i];
                showFallbackEditor(holderEl, html, i);
            }
        }, 150);
    } catch (e) { console.error('Tiptap init error', e); showFallbackEditor(holderEl, html, i); }
}

function showFallbackEditor(holderEl, html, idx) {
    if (!holderEl || holderEl.querySelector('.sec-fallback-ta')) return;
    const tmp = document.createElement('div'); tmp.innerHTML = html || '';
    const plain = tmp.textContent || tmp.innerText || '';
    holderEl.innerHTML = `<textarea class="sec-fallback-ta" rows="6" placeholder="Write section content..." oninput="dirty()">${esc(plain)}</textarea>`;
    holderEl.classList.remove('editor-loading'); holderEl.classList.add('editor-loaded');
    sectionEditors[idx] = {
        getHTML: () => { const ta = holderEl.querySelector('.sec-fallback-ta'); return ta ? '<p>' + esc(ta.value).replace(/\n/g, '</p><p>') + '</p>' : ''; },
        destroy: () => { holderEl.innerHTML = ''; }
    };
}

function secBlockHtml(s, i) {
    return `<div class="sec-b open" draggable="false" data-idx="${i}">
    <div class="sec-hd" onclick="togSec(this)" role="button" tabindex="0" aria-expanded="true" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();togSec(this)}">
      <span class="sec-grip" onmousedown="this.closest('.sec-b').draggable=true" onmouseup="this.closest('.sec-b').draggable=false"><i data-lucide="grip-vertical"></i></span>
      <span class="sec-nm">${esc(s.title) || 'New Section'}</span>
      <span class="sec-chv"><i data-lucide="chevron-down"></i></span>
      <div class="sec-acts" onclick="event.stopPropagation()">
        <button class="btn-sm-icon-ghost" onclick="showInsertVariableDropdown(sectionEditors[${i}],this)" data-tooltip="Insert Variable" data-side="bottom" data-align="center"><i data-lucide="braces"></i></button>
        ${typeof showAiPanel === 'function' ? `<button class="btn-sm-icon-ghost" onclick="showAiPanel(${i})" data-tooltip="AI Assistant" data-side="bottom"><i data-lucide="sparkles"></i></button>` : ''}
        <button class="btn-sm-icon-ghost" onclick="saveSectionToLib(this)" data-tooltip="Save to Library" data-side="bottom" data-align="center"><i data-lucide="bookmark"></i></button>
        <button class="btn-sm-icon-ghost" onclick="delSec(this)" data-tooltip="Delete" data-side="bottom" data-align="center"><i data-lucide="trash-2"></i></button>
      </div>
    </div>
    <div class="sec-bd">
      <div class="fg"><label class="fl">Title</label><input type="text" class="sec-ti" value="${esc(s.title)}" placeholder="e.g. Executive Summary" oninput="updSecName(this);dirty()"></div>
      <div class="fg fg-flush"><label class="fl">Content</label>
        <div class="tiptap-wrap" id="sec-editor-${i}"></div>
      </div>
    </div>
  </div>`;
}

function addSec(type) {
    if (typeof canEdit === 'function' && !canEdit()) { toast('Viewers cannot edit proposals', 'warning'); return; }
    const p = cur(); if (!p) return;
    if (type === 'testimonial') p.sections.push({ type: 'testimonial', title: 'Client Testimonial', testimonial: { quote: '', author: '', company: '', rating: 5 } });
    else if (type === 'case-study') p.sections.push({ type: 'case-study', title: 'Case Study', caseStudy: { challenge: '', solution: '', result: '' } });
    else p.sections.push({ title: '', content: '' });
    persist(); renderSections(p); refreshStatsBar(); lucide.createIcons();
}

function showAddSectionMenu(btn) {
    const existing = document.querySelector('.sec-type-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.className = 'sec-type-menu';
    menu.innerHTML = `
        <div class="sec-type-opt" role="button" tabindex="0" onclick="this.parentElement.remove();addSec()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="text"></i> Text Section</div>
        <div class="sec-type-opt" role="button" tabindex="0" onclick="this.parentElement.remove();addSec('testimonial')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="quote"></i> Testimonial</div>
        <div class="sec-type-opt" role="button" tabindex="0" onclick="this.parentElement.remove();addSec('case-study')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="lightbulb"></i> Case Study</div>`;
    btn.parentElement.style.position = 'relative';
    btn.parentElement.appendChild(menu);
    lucide.createIcons();
    const close = (e) => { if (!menu.contains(e.target) && e.target !== btn) { menu.remove(); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 10);
}
function togSec(h) { const block = h.closest('.sec-b'); block.classList.toggle('open'); h.setAttribute('aria-expanded', block.classList.contains('open')); }
function updSecName(inp) { inp.closest('.sec-b').querySelector('.sec-nm').textContent = inp.value || 'New Section'; }

function delSec(btn) {
    if (typeof canEdit === 'function' && !canEdit()) { toast('Viewers cannot edit proposals', 'warning'); return; }
    const block = btn.closest('.sec-b');
    const idx = parseInt(block.dataset.idx);
    const p = cur();
    if (!p) return;

    // Destroy Tiptap editor
    if (sectionEditors[idx]) {
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
            b.draggable = false;
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

function saveSectionToLib(btn) {
    const block = btn.closest('.sec-b');
    const idx = parseInt(block.dataset.idx);
    const title = block.querySelector('.sec-ti').value;
    if (!title) { toast('Add a title first'); return; }
    let content = '';
    if (sectionEditors[idx] && typeof sectionEditors[idx].getHTML === 'function') {
        try { content = sectionEditors[idx].getHTML(); } catch (e) { }
    }
    const lib = safeGetStorage('pk_seclib', []);
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
        <div class="modal-t">Section library</div>
        <div class="modal-d">Click to insert into your proposal</div>
        <div class="lib-tabs lib-tabs-bar">
            <button class="filter-tab on" id="libTabSections" onclick="setLibTab('sections',this)">Sections</button>
            ${typeof renderPacksTab === 'function' ? '<button class="filter-tab" id="libTabPacks" onclick="setLibTab(\'packs\',this)">Packs</button>' : ''}
        </div>
        <div id="libSectionsView">
            <div class="lib-search"><input type="text" id="libSearch" placeholder="Search sections..." oninput="filterLibrary()"></div>
            <div class="lib-cats">
                <span class="lib-cat active" data-cat="all" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">All</span>
                <span class="lib-cat" data-cat="intro" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">Intro</span>
                <span class="lib-cat" data-cat="scope" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">Scope</span>
                <span class="lib-cat" data-cat="terms" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">Terms</span>
                <span class="lib-cat" data-cat="pricing" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">Pricing</span>
                <span class="lib-cat" data-cat="general" role="tab" tabindex="0" onclick="setLibCat(this)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}">General</span>
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
        return `<div class="lib-item" role="button" tabindex="0" onclick="insertFromLib(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="file-text"></i><span class="lib-item-t">${esc(s.title)}</span><span class="lib-item-cat ${cc[s.category] || 'cat-general'}">${s.category}</span><span class="lib-item-d">${s.source === 'default' ? 'Default' : 'Saved'}</span></div>`;
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
