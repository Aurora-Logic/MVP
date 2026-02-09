// ════════════════════════════════════════
// ONBOARDING — 4-Step Creative Flow
// ════════════════════════════════════════

const OB_COUNTRIES = [
    { value: 'IN', label: '\ud83c\uddee\ud83c\uddf3 India' }, { value: 'US', label: '\ud83c\uddfa\ud83c\uddf8 United States' }, { value: 'GB', label: '\ud83c\uddec\ud83c\udde7 United Kingdom' },
    { value: 'CA', label: '\ud83c\udde8\ud83c\udde6 Canada' }, { value: 'AU', label: '\ud83c\udde6\ud83c\uddfa Australia' }, { value: 'DE', label: '\ud83c\udde9\ud83c\uddea Germany' },
    { value: 'FR', label: '\ud83c\uddeb\ud83c\uddf7 France' }, { value: 'SG', label: '\ud83c\uddf8\ud83c\uddec Singapore' }, { value: 'AE', label: '\ud83c\udde6\ud83c\uddea UAE' },
    { value: 'JP', label: '\ud83c\uddef\ud83c\uddf5 Japan' }, { value: 'NL', label: '\ud83c\uddf3\ud83c\uddf1 Netherlands' }, { value: 'SE', label: '\ud83c\uddf8\ud83c\uddea Sweden' },
    { value: 'CH', label: '\ud83c\udde8\ud83c\udded Switzerland' }, { value: 'NZ', label: '\ud83c\uddf3\ud83c\uddff New Zealand' }, { value: 'IE', label: '\ud83c\uddee\ud83c\uddea Ireland' },
    { value: 'OTHER', label: '\ud83c\udf10 Other' }
];

let obStep = 1;

function renderOnboarding() {
    const el = document.getElementById('obContent');
    if (!el) return;
    const steps = ['About You', 'Location & Tax', 'Payment', 'Branding'];
    const progress = `<div class="ob-progress"><div class="ob-progress-bar" style="width:${(obStep / 4) * 100}%"></div></div>
        <div class="ob-steps">${steps.map((s, i) => `<span class="ob-step-label${i + 1 === obStep ? ' on' : i + 1 < obStep ? ' done' : ''}">${s}</span>`).join('')}</div>`;
    el.innerHTML = progress + getObStepHtml(obStep);
    if (obStep === 2) {
        csel(document.getElementById('obCountry'), {
            value: CONFIG?.country || '', placeholder: 'Select country', searchable: true,
            items: OB_COUNTRIES, onChange: (val) => onCountryChange(val)
        });
        if (CONFIG?.country) onCountryChange(CONFIG.country);
    }
    if (obStep === 4) renderColorSwatches('obColors', null);
    lucide.createIcons();
}

function getObStepHtml(step) {
    if (step === 1) return `
        <div class="ob-step-header"><i data-lucide="user" class="ob-step-icon"></i><div><div class="ob-title">Tell us about you</div><div class="ob-desc">We'll use this on every proposal you create — no need to type it again.</div></div></div>
        <div class="ob-form">
            <div class="fg"><label class="fl">Company / Studio Name</label><input type="text" id="obCompany" placeholder="e.g. Pixel Studio" value="${esc(CONFIG?.company || '')}"></div>
            <div class="fr">
                <div class="fg"><label class="fl">Your Name</label><input type="text" id="obName" placeholder="Your full name" value="${esc(CONFIG?.name || '')}"></div>
                <div class="fg"><label class="fl">Email</label><input type="email" id="obEmail" placeholder="hello@studio.com" value="${esc(CONFIG?.email || '')}"></div>
            </div>
            <div class="fr">
                <div class="fg"><label class="fl">Phone</label><input type="tel" id="obPhone" placeholder="+91 98765 43210" value="${esc(CONFIG?.phone || '')}"></div>
                <div class="fg"><label class="fl">Website</label><input type="url" id="obWebsite" placeholder="https://yourstudio.com" value="${esc(CONFIG?.website || '')}"></div>
            </div>
            <button class="btn w-full" onclick="obNext()" style="margin-top:8px">Continue <i data-lucide="arrow-right"></i></button>
        </div>`;
    if (step === 2) return `
        <div class="ob-step-header"><i data-lucide="map-pin" class="ob-step-icon"></i><div><div class="ob-title">Where you operate</div><div class="ob-desc">Country-specific fields help generate compliant invoices and proposals.</div></div></div>
        <div class="ob-form">
            <div class="fr">
                <div class="fg"><label class="fl">Country</label><div id="obCountry"></div></div>
                <div class="fg"><label class="fl">Address</label><input type="text" id="obAddr" placeholder="Street, City, State, PIN" value="${esc(CONFIG?.address || '')}"></div>
            </div>
            <div id="obCountryFields"></div>
            <div class="ob-btn-row">
                <button class="btn-ghost" onclick="obPrev()"><i data-lucide="arrow-left"></i> Back</button>
                <button class="btn" style="flex:1" onclick="obNext()">Continue <i data-lucide="arrow-right"></i></button>
            </div>
        </div>`;
    if (step === 3) return `
        <div class="ob-step-header"><i data-lucide="landmark" class="ob-step-icon"></i><div><div class="ob-title">Payment details</div><div class="ob-desc">Add your bank details so clients know where to pay. You can always update this later.</div></div></div>
        <div class="ob-form">
            <div class="ob-bank-card">
                <div class="fr">
                    <div class="fg"><label class="fl">Bank Name</label><input type="text" id="obBankName" placeholder="e.g. HDFC Bank" value="${esc(CONFIG?.bank?.name || '')}"></div>
                    <div class="fg"><label class="fl">Account Holder</label><input type="text" id="obBankHolder" placeholder="Account holder name" value="${esc(CONFIG?.bank?.holder || '')}"></div>
                </div>
                <div class="fg"><label class="fl">Account Number</label><input type="text" id="obBankAccount" placeholder="e.g. 1234567890" value="${esc(CONFIG?.bank?.account || '')}"></div>
                <div class="fr">
                    <div class="fg"><label class="fl">IFSC / Sort Code</label><input type="text" id="obBankIfsc" placeholder="e.g. HDFC0001234" value="${esc(CONFIG?.bank?.ifsc || '')}"></div>
                    <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="obBankSwift" placeholder="e.g. HDFCINBB" value="${esc(CONFIG?.bank?.swift || '')}"></div>
                </div>
            </div>
            <div class="ob-btn-row">
                <button class="btn-ghost" onclick="obPrev()"><i data-lucide="arrow-left"></i> Back</button>
                <button class="btn-outline" onclick="obNext()">Skip</button>
                <button class="btn" style="flex:1" onclick="obNext()">Continue <i data-lucide="arrow-right"></i></button>
            </div>
        </div>`;
    if (step === 4) return `
        <div class="ob-step-header"><i data-lucide="palette" class="ob-step-icon"></i><div><div class="ob-title">Brand it yours</div><div class="ob-desc">Upload your logo and pick a color — they'll appear on every proposal.</div></div></div>
        <div class="ob-form">
            <div class="fg">
                <label class="fl">Logo</label>
                <div class="brand-logo-box" onclick="document.getElementById('logoInput').click()" id="obLogoBox"><i data-lucide="image-plus"></i></div>
                <input type="file" id="logoInput" accept="image/*" style="display:none" onchange="handleLogo(this)">
                <div class="fh">Click to upload (PNG, JPG, SVG, WebP — max 2MB)</div>
            </div>
            <div class="fg"><label class="fl">Brand Color</label><div id="obColors"></div></div>
            <div class="ob-btn-row">
                <button class="btn-ghost" onclick="obPrev()"><i data-lucide="arrow-left"></i> Back</button>
                <button class="btn-outline" onclick="finishOb()">Skip</button>
                <button class="btn" style="flex:1" onclick="finishOb()">Start Creating <i data-lucide="rocket"></i></button>
            </div>
        </div>`;
    return '';
}

function getCountryFields(country) {
    if (country === 'IN') return `
        <div class="fg"><label class="fl">GSTIN</label><input type="text" id="obGstin" placeholder="e.g. 27AAAAA0000A1Z5" value="${esc(CONFIG?.gstin || '')}" maxlength="15"><div class="fh">15-digit GST Identification Number</div></div>
        <div class="fr">
            <div class="fg"><label class="fl">PAN</label><input type="text" id="obPan" placeholder="e.g. AAAAA0000A" value="${esc(CONFIG?.pan || '')}" maxlength="10"><div class="fh">Permanent Account Number</div></div>
            <div class="fg"><label class="fl">UDYAM Registration</label><input type="text" id="obUdyam" placeholder="e.g. UDYAM-MH-00-0000000" value="${esc(CONFIG?.udyam || '')}"><div class="fh">MSME Registration Number</div></div>
        </div>`;
    if (country === 'US') return `
        <div class="fg"><label class="fl">EIN (Employer ID)</label><input type="text" id="obEin" placeholder="e.g. 12-3456789" value="${esc(CONFIG?.ein || '')}" maxlength="10"><div class="fh">Federal Employer Identification Number</div></div>`;
    if (country === 'GB' || country === 'DE' || country === 'FR' || country === 'NL' || country === 'SE' || country === 'IE') return `
        <div class="fg"><label class="fl">VAT Number</label><input type="text" id="obVat" placeholder="e.g. GB123456789" value="${esc(CONFIG?.vatNumber || '')}"><div class="fh">Value Added Tax Registration</div></div>`;
    if (country === 'AU') return `
        <div class="fg"><label class="fl">ABN</label><input type="text" id="obAbn" placeholder="e.g. 51 824 753 556" value="${esc(CONFIG?.abn || '')}" maxlength="14"><div class="fh">Australian Business Number</div></div>`;
    if (country === 'SG' || country === 'AE' || country === 'CA' || country === 'JP' || country === 'CH' || country === 'NZ' || country === 'OTHER') return `
        <div class="fg"><label class="fl">Tax / Registration ID</label><input type="text" id="obTaxId" placeholder="Tax or business registration number" value="${esc(CONFIG?.taxId || '')}"></div>`;
    return '';
}

function onCountryChange(val) {
    const el = document.getElementById('obCountryFields');
    if (el) el.innerHTML = getCountryFields(val);
}

function obNext() {
    collectObStep();
    if (obStep === 2 && !validateObTaxIds()) return;
    if (obStep < 4) { obStep++; renderOnboarding(); }
}

function validateObTaxIds() {
    const c = CONFIG?.country;
    if (c === 'IN') {
        const gstin = document.getElementById('obGstin')?.value?.trim();
        const pan = document.getElementById('obPan')?.value?.trim();
        const udyam = document.getElementById('obUdyam')?.value?.trim();
        if (gstin && !validateTaxId('gstin', gstin)) { toast('Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)', 'warning'); return false; }
        if (pan && !validateTaxId('pan', pan)) { toast('Invalid PAN format (e.g. AAAAA0000A)', 'warning'); return false; }
        if (udyam && !validateTaxId('udyam', udyam)) { toast('Invalid UDYAM format (e.g. UDYAM-MH-00-0000000)', 'warning'); return false; }
    } else if (c === 'US') {
        const ein = document.getElementById('obEin')?.value?.trim();
        if (ein && !validateTaxId('ein', ein)) { toast('Invalid EIN format (e.g. 12-3456789)', 'warning'); return false; }
    } else if (c === 'AU') {
        const abn = document.getElementById('obAbn')?.value?.trim();
        if (abn && !validateTaxId('abn', abn)) { toast('Invalid ABN format (11 digits)', 'warning'); return false; }
    }
    return true;
}

function obPrev() {
    collectObStep();
    if (obStep > 1) { obStep--; renderOnboarding(); }
}

function collectObStep() {
    if (!CONFIG) CONFIG = {};
    const v = id => document.getElementById(id)?.value?.trim() || '';
    if (obStep === 1) {
        CONFIG.company = v('obCompany'); CONFIG.name = v('obName');
        CONFIG.email = v('obEmail'); CONFIG.phone = v('obPhone');
        CONFIG.website = v('obWebsite');
    }
    if (obStep === 2) {
        CONFIG.country = cselGetValue(document.getElementById('obCountry')) || CONFIG.country || '';
        CONFIG.address = v('obAddr');
        // Country-specific
        if (CONFIG.country === 'IN') { CONFIG.gstin = v('obGstin'); CONFIG.pan = v('obPan'); CONFIG.udyam = v('obUdyam'); }
        else if (CONFIG.country === 'US') { CONFIG.ein = v('obEin'); }
        else if (['GB','DE','FR','NL','SE','IE'].includes(CONFIG.country)) { CONFIG.vatNumber = v('obVat'); }
        else if (CONFIG.country === 'AU') { CONFIG.abn = v('obAbn'); }
        else { CONFIG.taxId = v('obTaxId'); }
    }
    if (obStep === 3) {
        if (!CONFIG.bank) CONFIG.bank = {};
        CONFIG.bank.name = v('obBankName'); CONFIG.bank.holder = v('obBankHolder');
        CONFIG.bank.account = v('obBankAccount'); CONFIG.bank.ifsc = v('obBankIfsc');
        CONFIG.bank.swift = v('obBankSwift');
    }
}

function finishOb() {
    collectObStep();
    // Brand color
    const sel = document.querySelector('#obColors .color-swatch.on');
    if (sel) {
        CONFIG.color = rgbToHex(sel.style.background) || sel.style.background || '#18181b';
    } else {
        const hexInp = document.querySelector('#obColors .color-hex-input');
        if (hexInp && /^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) CONFIG.color = hexInp.value.trim();
        else CONFIG.color = CONFIG.color || '#18181b';
    }
    saveConfig();
    document.getElementById('onboard').classList.add('hide');
    document.getElementById('appShell').style.display = 'flex';
    bootApp();
    toast('Welcome to ProposalKit!');
}

function renderColorSwatches(containerId, selected) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'color-row';
    COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className = 'color-swatch' + (selected === c ? ' on' : '');
        s.style.background = c;
        s.onclick = () => {
            el.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('on'));
            s.classList.add('on');
            const hexInp = el.querySelector('.color-hex-input');
            if (hexInp) hexInp.value = c;
        };
        row.appendChild(s);
    });
    el.appendChild(row);
    const hexWrap = document.createElement('div');
    hexWrap.className = 'color-hex-wrap';
    hexWrap.innerHTML = `<span class="color-hex-preview" style="background:${selected || '#18181b'}"></span><input type="text" class="color-hex-input" value="${selected || '#18181b'}" placeholder="#000000" maxlength="7" spellcheck="false">`;
    el.appendChild(hexWrap);
    const hexInput = hexWrap.querySelector('.color-hex-input');
    const hexPreview = hexWrap.querySelector('.color-hex-preview');
    hexInput.oninput = () => {
        let v = hexInput.value.trim();
        if (!v.startsWith('#')) v = '#' + v;
        if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            hexPreview.style.background = v;
            el.querySelectorAll('.color-swatch').forEach(x => {
                x.classList.toggle('on', x.style.background === v || rgbToHex(x.style.background) === v.toLowerCase());
            });
        }
    };
}

function handleLogo(input) {
    const file = input.files[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) { toast('Please upload a valid image (PNG, JPG, SVG, WebP)', 'error'); input.value = ''; return; }
    if (file.size > 2 * 1024 * 1024) { toast('Image must be under 2MB', 'error'); input.value = ''; return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        const url = sanitizeDataUrl(e.target.result);
        if (!url) { input.value = ''; return; }
        document.querySelectorAll('.brand-logo-box').forEach(box => { box.innerHTML = '<img src="' + esc(url) + '">'; });
        if (!CONFIG) CONFIG = {};
        CONFIG.logo = url;
    };
    reader.onerror = () => { toast('Error reading file', 'error'); input.value = ''; };
    reader.readAsDataURL(file);
}
