// ════════════════════════════════════════
// MY PROFILE PAGE
// ════════════════════════════════════════

/* exported renderProfile */

function renderProfile() {
    CUR = null;
    if (typeof hideTOC === 'function') hideTOC();
    document.getElementById('topTitle').textContent = 'My Profile';
    const topSearch = document.getElementById('topSearch');
    if (topSearch) topSearch.style.display = 'none';
    document.getElementById('topRight').innerHTML = '';

    const body = document.getElementById('bodyScroll');
    const name = CONFIG?.name || 'User';
    const email = CONFIG?.email || '';
    const company = CONFIG?.company || '';
    const phone = CONFIG?.phone || '';
    const country = CONFIG?.country || '';
    const address = CONFIG?.address || '';
    const website = CONFIG?.website || '';
    const initial = name.charAt(0).toUpperCase();
    const logo = CONFIG?.logo || '';

    // Stats
    const active = activeDB();
    const total = active.length;
    const accepted = active.filter(p => p.status === 'accepted').length;
    const c = defaultCurrency();
    const revenue = active.reduce((a, p) =>
        a + (p.lineItems || []).reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0), 0);
    const clients = typeof CLIENTS !== 'undefined' ? CLIENTS.length : 0;

    // Account info (if logged in)
    const user = typeof sbSession !== 'undefined' ? sbSession?.user : null;
    const memberSince = user?.created_at ? fmtDate(user.created_at) : '';

    body.innerHTML = `
    <div class="prof-container">
      <div class="prof-hero">
        <div class="prof-avatar">${logo ? `<img src="${esc(logo)}" alt="Logo">` : initial}</div>
        <div class="prof-hero-info">
          <div class="prof-name">${esc(name)}</div>
          ${company ? `<div class="prof-company">${esc(company)}</div>` : ''}
          ${email ? `<div class="prof-email">${esc(email)}</div>` : ''}
        </div>
        <button class="btn-sm-outline" onclick="goNav('settings')"><i data-lucide="settings"></i> Edit Profile</button>
      </div>

      <div class="prof-stats-grid">
        <div class="prof-stat"><div class="prof-stat-val">${total}</div><div class="prof-stat-label">Proposals</div></div>
        <div class="prof-stat"><div class="prof-stat-val">${accepted}</div><div class="prof-stat-label">Won Deals</div></div>
        <div class="prof-stat"><div class="prof-stat-val">${fmtCur(revenue, c)}</div><div class="prof-stat-label">Revenue</div></div>
        <div class="prof-stat"><div class="prof-stat-val">${clients}</div><div class="prof-stat-label">Clients</div></div>
      </div>

      <div class="prof-cards">
        <div class="prof-card">
          <div class="prof-card-t"><i data-lucide="building-2"></i> Business Details</div>
          <div class="prof-card-body">
            ${buildProfRow('Company', company)}
            ${buildProfRow('Phone', phone)}
            ${buildProfRow('Country', countryName(country))}
            ${buildProfRow('Address', address)}
            ${buildProfRow('Website', website)}
          </div>
        </div>

        <div class="prof-card">
          <div class="prof-card-t"><i data-lucide="landmark"></i> Payment Info</div>
          <div class="prof-card-body">
            ${buildProfRow('Bank', CONFIG?.bank?.name)}
            ${buildProfRow('Account Holder', CONFIG?.bank?.holder)}
            ${buildProfRow('Account', CONFIG?.bank?.account ? maskAccount(CONFIG.bank.account) : '')}
            ${buildProfRow('IFSC / Sort Code', CONFIG?.bank?.ifsc)}
            ${buildProfRow('SWIFT / BIC', CONFIG?.bank?.swift)}
            ${CONFIG?.country === 'IN' ? buildProfRow('UPI ID', CONFIG?.bank?.upi) : ''}
          </div>
        </div>

        ${buildTaxCard()}

        <div class="prof-card">
          <div class="prof-card-t"><i data-lucide="palette"></i> Branding</div>
          <div class="prof-card-body">
            ${buildProfRow('Font', CONFIG?.font || 'System (SF Pro)')}
            ${buildProfRow('Primary Color', CONFIG?.color ? `<span class="prof-color-dot" style="background:${CONFIG.color}"></span>${CONFIG.color}` : 'Default')}
            ${buildProfRow('White Label', CONFIG?.whiteLabel ? 'Enabled' : 'Disabled')}
            ${CONFIG?.logo ? buildProfRow('Logo', '<img src="' + esc(CONFIG.logo) + '" class="prof-logo-thumb" alt="Logo">') : buildProfRow('Logo', 'Not set')}
          </div>
        </div>
      </div>

      ${memberSince ? `<div class="prof-footer">Member since ${memberSince}</div>` : ''}
    </div>`;
    lucide.createIcons();
}

function buildProfRow(label, value) {
    if (!value) return `<div class="prof-row"><span class="prof-row-label">${label}</span><span class="prof-row-val prof-row-empty">&mdash;</span></div>`;
    return `<div class="prof-row"><span class="prof-row-label">${label}</span><span class="prof-row-val">${value}</span></div>`;
}

function maskAccount(acc) {
    if (!acc || acc.length < 5) return acc || '';
    return '****' + acc.slice(-4);
}

function buildTaxCard() {
    const c = CONFIG?.country;
    const rows = [];
    if (c === 'IN') {
        if (CONFIG?.gstin) rows.push(buildProfRow('GSTIN', CONFIG.gstin));
        if (CONFIG?.pan) rows.push(buildProfRow('PAN', CONFIG.pan));
        if (CONFIG?.udyam) rows.push(buildProfRow('UDYAM', CONFIG.udyam));
        if (CONFIG?.lut) rows.push(buildProfRow('LUT', CONFIG.lut));
    } else if (c === 'US' && CONFIG?.ein) {
        rows.push(buildProfRow('EIN', CONFIG.ein));
    } else if (['GB','DE','FR','NL','SE','IE'].includes(c) && CONFIG?.vatNumber) {
        rows.push(buildProfRow('VAT Number', CONFIG.vatNumber));
    } else if (c === 'AU' && CONFIG?.abn) {
        rows.push(buildProfRow('ABN', CONFIG.abn));
    }
    if (!rows.length) return '';
    return `<div class="prof-card">
      <div class="prof-card-t"><i data-lucide="receipt"></i> Tax & Compliance</div>
      <div class="prof-card-body">${rows.join('')}</div>
    </div>`;
}

function countryName(code) {
    if (!code) return '';
    const item = typeof OB_COUNTRIES !== 'undefined' ? OB_COUNTRIES.find(c => c.value === code) : null;
    return item ? item.label : code;
}
