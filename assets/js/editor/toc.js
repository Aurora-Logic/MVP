// ════════════════════════════════════════
// TABLE OF CONTENTS — Floating outline panel
// ════════════════════════════════════════

/* exported tocGoSection */
function renderTOC() {
    const p = cur(); if (!p) { hideTOC(); return; }
    let existing = document.getElementById('tocPanel');
    if (!existing) {
        existing = document.createElement('div');
        existing.id = 'tocPanel';
        existing.className = 'toc-panel';
        document.body.appendChild(existing);
    }

    const tabs = [
        { label: 'Details', tab: 'details', icon: 'file-text' },
        { label: 'Sections', tab: 'sections', icon: 'layers' },
        { label: 'Pricing', tab: 'pricing', icon: 'banknote' },
        { label: 'Notes', tab: 'notes', icon: 'sticky-note' }
    ];

    const activeTab = document.querySelector('#edTabs .tab.on')?.textContent?.trim().toLowerCase() || 'details';

    let html = '<div class="toc-head">Outline</div>';
    tabs.forEach(t => {
        html += `<div class="toc-item ${t.tab === activeTab ? 'on' : ''}" role="button" tabindex="0" onclick="tocGoTab('${t.tab}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="${t.icon}"></i> ${t.label}</div>`;
    });

    // Section titles
    const secs = p.sections || [];
    if (secs.length) {
        html += '<div class="toc-divider"></div>';
        secs.forEach((s, i) => {
            const title = s.title || 'Untitled';
            html += `<div class="toc-item toc-sub" role="button" tabindex="0" onclick="tocGoSection(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click()}"><i data-lucide="text"></i> ${esc(title)}</div>`;
        });
    }

    existing.innerHTML = html;
    existing.style.display = '';
    document.getElementById('bodyScroll')?.classList.add('has-toc');
    lucide.createIcons();
}

function hideTOC() {
    const el = document.getElementById('tocPanel');
    if (el) el.style.display = 'none';
    document.getElementById('bodyScroll')?.classList.remove('has-toc');
}

function tocGoTab(tab) {
    const tabBtn = [...document.querySelectorAll('#edTabs .tab')].find(b => b.textContent.trim().toLowerCase() === tab);
    if (tabBtn) tabBtn.click();
    renderTOC();
}

function tocGoSection(idx) {
    // Switch to sections tab first
    tocGoTab('sections');
    setTimeout(() => {
        const secEl = document.querySelector(`.sec-b[data-idx="${idx}"]`);
        if (secEl) {
            secEl.classList.add('open');
            secEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 50);
}
