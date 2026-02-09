// ════════════════════════════════════════
// DETAILS TAB
// ════════════════════════════════════════

function renderDetails(p) {
    let expiryHtml = '';
    if (p.validUntil && (p.status === 'draft' || p.status === 'sent')) {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
        const diff = Math.ceil((exp - now) / 86400000);
        if (diff < 0) {
            expiryHtml = '<div class="expiry-warn warn-expired"><i data-lucide="alert-triangle"></i> This proposal expired ' + Math.abs(diff) + ' days ago. Consider updating the valid-until date or marking as declined.</div>';
            if (p.status !== 'expired') { p.status = 'expired'; persist(); }
        } else if (diff <= 7) {
            expiryHtml = '<div class="expiry-warn warn-soon"><i data-lucide="clock"></i> Expires in ' + diff + ' day' + (diff !== 1 ? 's' : '') + '. ' + (p.status === 'sent' ? 'Follow up with the client.' : 'Send it before it expires.') + '</div>';
        }
    }
    document.getElementById('edDetails').innerHTML = `
    ${expiryHtml}
    <div class="card card-p" style="margin-bottom:14px">
      <div class="card-head">
        <div><div class="card-t">Proposal Info</div><div class="card-d">Basic details</div></div>
        <div class="status-dd">
          <span class="badge badge-${p.status}" onclick="toggleStatusMenu(event)" id="statusBadge"><span class="badge-dot"></span> ${p.status.charAt(0).toUpperCase() + p.status.slice(1)} <i data-lucide="chevron-down" style="width:12px;height:12px;margin-left:2px"></i></span>
          <div class="status-menu" id="statusMenu">
            <div class="status-opt" onclick="setStatus('draft')"><span class="so-dot" style="background:var(--text4)"></span> Draft</div>
            <div class="status-opt" onclick="setStatus('sent')"><span class="so-dot" style="background:var(--blue)"></span> Sent</div>
            <div class="status-opt" onclick="setStatus('accepted')"><span class="so-dot" style="background:var(--green)"></span> Accepted</div>
            <div class="status-opt" onclick="setStatus('declined')"><span class="so-dot" style="background:var(--red)"></span> Declined</div>
          </div>
        </div>
      </div>
      <div class="fr">
        <div class="fg"><label class="fl">Title</label><input type="text" id="fTitle" value="${esc(p.title)}" placeholder="e.g. Website Redesign Proposal" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Proposal #</label><input type="text" id="fNumber" value="${esc(p.number)}" oninput="dirty()"></div>
      </div>
      <div class="fr">
        <div class="fg"><label class="fl">Date</label><input type="text" id="fDate" data-datepicker data-value="${p.date || ''}" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Valid Until</label><input type="text" id="fValid" data-datepicker data-value="${p.validUntil || ''}" oninput="dirty()"></div>
      </div>
    </div>
    <div class="card card-p" style="margin-bottom:14px">
      <div class="card-head">
        <div><div class="card-t">Cover Photo</div><div class="card-d">Optional hero image for your proposal</div></div>
      </div>
      <div class="cover-wrap" id="coverWrap">
        ${p.coverPhoto ?
            `<div class="cover-preview">
            <img src="${p.coverPhoto}" alt="Cover photo">
            <div class="cover-actions">
              <button class="btn-sm-ghost" onclick="changeCoverPhoto()"><i data-lucide="edit-3"></i> Change</button>
              <button class="btn-sm-destructive" onclick="removeCoverPhoto()"><i data-lucide="trash-2"></i> Remove</button>
            </div>
          </div>` :
            `<div class="cover-upload" onclick="document.getElementById('coverInput').click()">
            <i data-lucide="image-plus" style="width:32px;height:32px;color:var(--text4)"></i>
            <div style="margin-top:8px;color:var(--text3);font-size:13px">Click to upload a cover photo</div>
            <div style="color:var(--text4);font-size:11px">Recommended: 1200x400px</div>
          </div>`}
        <input type="file" id="coverInput" accept="image/*" style="display:none" onchange="handleCoverPhoto(this)">
      </div>
    </div>
    <div class="card card-p" style="margin-bottom:14px">
      <div class="card-head"><div><div class="card-t">From (Your Company)</div><div class="card-d">Auto-filled from settings</div></div></div>
      <div class="fr">
        <div class="fg"><label class="fl">Company</label><input type="text" id="fSCo" value="${esc(p.sender.company)}" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Email</label><input type="email" id="fSEm" value="${esc(p.sender.email)}" oninput="dirty()"></div>
      </div>
      <div class="fg"><label class="fl">Address</label><input type="text" id="fSAd" value="${esc(p.sender.address)}" oninput="dirty()"></div>
    </div>
    <div class="card card-p">
      <div class="card-head"><div><div class="card-t">To (Client)</div></div><button class="btn-sm-outline" onclick="showClientPicker()"><i data-lucide="users"></i> Pick Client</button></div>
      <div class="fr">
        <div class="fg"><label class="fl">Company / Name</label><input type="text" id="fCNa" value="${esc(p.client.name)}" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Contact Person</label><input type="text" id="fCCo" value="${esc(p.client.contact)}" oninput="dirty()"></div>
      </div>
      <div class="fr">
        <div class="fg"><label class="fl">Email</label><input type="email" id="fCEm" value="${esc(p.client.email)}" oninput="dirty()"></div>
        <div class="fg"><label class="fl">Phone</label><input type="tel" id="fCPh" value="${esc(p.client.phone)}" oninput="dirty()"></div>
      </div>
    </div>
  `;
    lucide.createIcons();
    initDatePickers();
}

function updateExpiryWarning(p) {
    const existing = document.querySelector('.expiry-warn');
    let html = '';
    if (p.validUntil && (p.status === 'draft' || p.status === 'sent')) {
        const now = new Date(); now.setHours(0, 0, 0, 0);
        const exp = new Date(p.validUntil); exp.setHours(0, 0, 0, 0);
        const diff = Math.ceil((exp - now) / 86400000);
        if (diff < 0) {
            html = '<div class="expiry-warn warn-expired"><i data-lucide="alert-triangle"></i> This proposal expired ' + Math.abs(diff) + ' days ago. Consider updating the valid-until date or marking as declined.</div>';
        } else if (diff <= 7) {
            html = '<div class="expiry-warn warn-soon"><i data-lucide="clock"></i> Expires in ' + diff + ' day' + (diff !== 1 ? 's' : '') + '. ' + (p.status === 'sent' ? 'Follow up with the client.' : 'Send it before it expires.') + '</div>';
        }
    }
    if (existing) {
        if (html) { existing.outerHTML = html; } else { existing.remove(); }
    } else if (html) {
        const det = document.getElementById('edDetails');
        if (det) det.insertAdjacentHTML('afterbegin', html);
    }
    lucide.createIcons();
}

function toggleStatusMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('statusMenu');
    menu.classList.toggle('show');
    const close = (ev) => { if (!menu.contains(ev.target)) { menu.classList.remove('show'); document.removeEventListener('click', close); } };
    setTimeout(() => document.addEventListener('click', close), 0);
}

function setStatus(s) {
    const p = cur(); if (!p) return;
    p.status = s;
    p.notes = p.notes || [];
    p.notes.push({ text: `Status changed to ${s}`, time: Date.now(), type: 'system' });
    persist();
    document.getElementById('statusMenu').classList.remove('show');
    loadEditor(CUR);
    toast('Status updated to ' + s);
}

function handleCoverPhoto(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast('Please upload a valid image file (PNG, JPG, or WebP)', 'error');
        input.value = '';
        return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('Cover photo size must be less than 5MB', 'error');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const p = cur();
        if (!p) return;
        p.coverPhoto = e.target.result;
        if (persist()) {
            renderDetails(p);
            toast('Cover photo uploaded');
        }
    };
    reader.onerror = () => {
        toast('Error reading file', 'error');
        input.value = '';
    };
    reader.readAsDataURL(file);
}

function changeCoverPhoto() { document.getElementById('coverInput')?.click(); }

function removeCoverPhoto() {
    confirmDialog('Remove the cover photo?', () => {
        const p = cur(); if (!p) return;
        p.coverPhoto = null;
        persist();
        renderDetails(p);
        toast('Cover photo removed');
    }, { title: 'Remove Cover Photo', confirmText: 'Remove' });
}
