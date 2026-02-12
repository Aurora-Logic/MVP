// ════════════════════════════════════════
// PRICING PACKAGES — 3-Tier (Phase 2.1)
// ════════════════════════════════════════

/* exported togglePackages, setRecommended, addPackageFeature, removePackageFeature, setFeatureTier, collectPackagesData, buildPackagesPdfHtml */
function renderPackages(p) {
    const el = document.getElementById('pkgSection');
    if (!el) return;
    const enabled = p.packagesEnabled || false;
    const c = p.currency || defaultCurrency();

    if (!enabled) {
        el.innerHTML = `<div class="card card-p pkg-toggle-card" style="margin-bottom:14px">
            <div style="display:flex;align-items:center;justify-content:space-between">
                <div><div class="card-t">Pricing packages</div><div class="card-d">Offer tiered pricing options to your client</div></div>
                <button class="btn-sm-outline" onclick="togglePackages()"><i data-lucide="layers"></i> Enable</button>
            </div>
        </div>`;
        lucide.createIcons();
        return;
    }

    const pkgs = p.packages || getDefaultPackages();
    const features = p.packageFeatures || [];

    let cards = '';
    pkgs.forEach((pkg, i) => {
        cards += `<div class="pkg-card ${pkg.recommended ? 'pkg-recommended' : ''}">
            ${pkg.recommended ? '<div class="pkg-badge">Recommended</div>' : ''}
            <input type="text" class="pkg-name" value="${esc(pkg.name)}" placeholder="Package name" oninput="dirty()">
            <div class="pkg-price-wrap">
                <span class="pkg-cur">${c}</span>
                <input type="number" class="pkg-price" value="${pkg.price || 0}" min="0" step="500" oninput="dirty()">
            </div>
            <div class="pkg-actions">
                <button class="btn-sm-ghost ${pkg.recommended ? 'on' : ''}" onclick="setRecommended(${i})" data-tooltip="Set as recommended" data-side="bottom" data-align="center"><i data-lucide="star"></i></button>
            </div>
        </div>`;
    });

    let featureRows = '';
    features.forEach((f, fi) => {
        let cells = '';
        (f.tiers || []).forEach((t, ti) => {
            const icon = t === 'check' ? 'check' : (t === 'dash' ? 'minus' : 'x');
            const color = t === 'check' ? 'var(--green)' : (t === 'dash' ? 'var(--text4)' : 'var(--red)');

            cells += `<td class="pkg-feat-cell" onclick="setFeatureTier(${fi},${ti})"><i data-lucide="${icon}" style="width:16px;height:16px;color:${color}"></i></td>`;
        });
        featureRows += `<tr>
            <td><input type="text" class="pkg-feat-name" value="${esc(f.text)}" placeholder="Feature name" oninput="dirty()"></td>
            ${cells}
            <td><button class="btn-sm-icon-ghost" onclick="removePackageFeature(${fi})" data-tooltip="Remove" data-side="bottom" data-align="center"><i data-lucide="x"></i></button></td>
        </tr>`;
    });

    el.innerHTML = `<div class="card card-p" style="margin-bottom:14px">
        <div class="card-head">
            <div><div class="card-t">Pricing packages</div><div class="card-d">Compare tiers side by side</div></div>
            <div style="display:flex;gap:6px">
                <button class="btn-sm-outline" onclick="addPackageFeature()"><i data-lucide="plus"></i> Feature</button>
                <button class="btn-sm-ghost" onclick="togglePackages()" data-tooltip="Disable packages" data-side="bottom" data-align="center"><i data-lucide="x"></i></button>
            </div>
        </div>
        <div class="pkg-grid">${cards}</div>
        <div class="pkg-features" style="margin-top:14px">
            <table class="pkg-feat-tbl">
                <thead><tr>
                    <th style="text-align:left">Feature</th>
                    ${pkgs.map(pk => `<th>${esc(pk.name)}</th>`).join('')}
                    <th></th>
                </tr></thead>
                <tbody>${featureRows}</tbody>
            </table>
            ${!features.length ? '<div class="ps-empty" style="padding:12px;text-align:center;font-size:12px;color:var(--text4)">Click "Feature" to add comparison rows</div>' : ''}
        </div>
    </div>`;
    lucide.createIcons();
}

function getDefaultPackages() {
    return [
        { name: 'Starter', price: 0, recommended: false },
        { name: 'Professional', price: 0, recommended: true },
        { name: 'Enterprise', price: 0, recommended: false }
    ];
}

function togglePackages() {
    const p = cur(); if (!p) return;
    p.packagesEnabled = !p.packagesEnabled;
    if (p.packagesEnabled && !p.packages) {
        p.packages = getDefaultPackages();
        p.packageFeatures = [];
    }
    persist();
    renderPackages(p);
}

function setRecommended(idx) {
    const p = cur(); if (!p || !p.packages) return;
    p.packages.forEach((pk, i) => { pk.recommended = (i === idx); });
    persist();
    renderPackages(p);
    dirty();
}

function addPackageFeature() {
    const p = cur(); if (!p) return;
    if (!p.packageFeatures) p.packageFeatures = [];
    const tierCount = (p.packages || getDefaultPackages()).length;
    p.packageFeatures.push({ text: '', tiers: Array(tierCount).fill('check') });
    persist();
    renderPackages(p);
}

function removePackageFeature(idx) {
    const p = cur(); if (!p || !p.packageFeatures) return;
    p.packageFeatures.splice(idx, 1);
    persist();
    renderPackages(p);
    dirty();
}

function setFeatureTier(fIdx, tIdx) {
    const p = cur(); if (!p || !p.packageFeatures) return;
    const f = p.packageFeatures[fIdx];
    if (!f || !f.tiers) return;
    const cycle = ['check', 'dash', 'cross'];
    const tierVal = f.tiers[tIdx] || 'check';
    f.tiers[tIdx] = cycle[(cycle.indexOf(tierVal) + 1) % 3];
    persist();
    renderPackages(p);
    dirty();
}

function collectPackagesData(p) {
    if (!p.packagesEnabled) return;
    const cards = document.querySelectorAll('.pkg-card');
    if (!cards.length) return;
    cards.forEach((card, i) => {
        if (p.packages && p.packages[i]) {
            p.packages[i].name = card.querySelector('.pkg-name')?.value || '';
            p.packages[i].price = parseFloat(card.querySelector('.pkg-price')?.value) || 0;
        }
    });
    const featRows = document.querySelectorAll('.pkg-feat-name');
    featRows.forEach((input, i) => {
        if (p.packageFeatures && p.packageFeatures[i]) {
            p.packageFeatures[i].text = input.value || '';
        }
    });
}

function buildPackagesPdfHtml(p, c, bc) {
    if (!p.packagesEnabled) return '';
    const pkgs = p.packages || [];
    const features = p.packageFeatures || [];
    if (!pkgs.length) return '';
    const currSymbol = c || defaultCurrency();

    let h = `<div style="margin-top:20px;page-break-inside:avoid;break-inside:avoid"><div style="font-size:14px;font-weight:700;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid ${bc};color:${bc}">Pricing packages</div>`;
    h += '<div style="display:flex;gap:12px;margin-bottom:12px">';
    pkgs.forEach(pkg => {
        h += `<div style="flex:1;border:${pkg.recommended ? '2px solid ' + bc : '1px solid #e4e4e7'};border-radius:8px;padding:16px;text-align:center;position:relative">`;
        if (pkg.recommended) h += `<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:${bc};color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;text-transform:uppercase;letter-spacing:.5px">Recommended</div>`;
        h += `<div style="font-size:14px;font-weight:700;margin-bottom:4px">${esc(pkg.name)}</div>`;
        h += `<div style="font-size:20px;font-weight:800;color:${bc}">${currSymbol}${(pkg.price || 0).toLocaleString(currSymbol === '₹' ? 'en-IN' : 'en-US')}</div>`;
        h += '</div>';
    });
    h += '</div>';

    if (features.length) {
        h += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
        h += `<thead><tr><th style="text-align:left;padding:6px 8px;border-bottom:1px solid #e4e4e7;color:#a1a1aa;font-weight:600">Feature</th>`;
        pkgs.forEach(pk => { h += `<th style="text-align:center;padding:6px 8px;border-bottom:1px solid #e4e4e7;color:#a1a1aa;font-weight:600">${esc(pk.name)}</th>`; });
        h += '</tr></thead><tbody>';
        features.forEach(f => {
            h += `<tr><td style="padding:6px 8px;border-bottom:1px solid #f4f4f5">${esc(f.text)}</td>`;
            (f.tiers || []).forEach(t => {
                const sym = t === 'check' ? '✓' : (t === 'dash' ? '—' : '✗');
                const color = t === 'check' ? '#34C759' : (t === 'dash' ? '#a1a1aa' : '#FF3B30');
                h += `<td style="text-align:center;padding:6px 8px;border-bottom:1px solid #f4f4f5;color:${color};font-weight:600">${sym}</td>`;
            });
            h += '</tr>';
        });
        h += '</tbody></table>';
    }
    h += '</div>';
    return h;
}
