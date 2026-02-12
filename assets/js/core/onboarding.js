// ════════════════════════════════════════
// ONBOARDING — 4-Step Creative Flow
// ════════════════════════════════════════

/* exported obNext, obPrev, finishOb, handleLogo */
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
    const el = document.getElementById('authContent') || document.getElementById('obContent');
    if (!el) return;
    // Update left panel for onboarding context
    const quote = document.querySelector('.auth-quote');
    const author = document.querySelector('.auth-quote-author');
    if (quote) quote.innerHTML = '\u201CThe setup takes less than a minute. Just the essentials to get your proposals looking professional.\u201D';
    if (author) author.textContent = 'ProposalKit Team';
    // Hide auth top-right toggle (Login/Sign up link)
    const topRight = document.getElementById('authRightTop');
    if (topRight) topRight.style.display = 'none';
    const steps = ['About You', 'Location & Tax', 'Payment', 'Branding'];
    document.title = steps[obStep - 1] + ' — Setup — ProposalKit';
    const dots = `<div class="ob-dots">${steps.map((_, i) => `<span class="ob-dot${i + 1 === obStep ? ' on' : i + 1 < obStep ? ' done' : ''}"></span>`).join('')}</div>`;
    el.innerHTML = '<div class="auth-form ob-form-wrap">' + getObStepHtml(obStep) + dots + '</div>';
    if (obStep === 2) {
        csel(document.getElementById('obCountry'), {
            value: CONFIG?.country || '', placeholder: 'Select country', searchable: true,
            items: OB_COUNTRIES, onChange: (val) => { if (!CONFIG) CONFIG = {}; CONFIG.country = val; onCountryChange(val); }
        });
        if (CONFIG?.country) onCountryChange(CONFIG.country);
    }
    if (obStep === 4) renderColorSwatches('obColors', null);
    lucide.createIcons();
}

function getObStepHtml(step) {
    if (step === 1) return `
        <div class="auth-header">
            <div class="auth-title">Tell us about you</div>
            <div class="auth-desc">This info appears on every proposal you create.</div>
        </div>
        <div class="fg"><label class="fl">Company / Studio Name</label><input type="text" id="obCompany" placeholder="e.g. Pixel Studio" value="${esc(CONFIG?.company || '')}"></div>
        <div class="fg"><label class="fl">Your Name</label><input type="text" id="obName" placeholder="Your full name" value="${esc(CONFIG?.name || '')}"></div>
        <div class="fg"><label class="fl">Email</label><input type="email" id="obEmail" placeholder="hello@studio.com" value="${esc(CONFIG?.email || '')}"></div>
        <div class="fr">
            <div class="fg"><label class="fl">Phone</label><input type="tel" id="obPhone" placeholder="+91 98765 43210" value="${esc(CONFIG?.phone || '')}"></div>
            <div class="fg"><label class="fl">Website</label><input type="url" id="obWebsite" placeholder="https://yourstudio.com" value="${esc(CONFIG?.website || '')}"></div>
        </div>
        <button class="btn auth-submit" onclick="obNext()">Continue</button>
        <div class="ob-skip"><a href="#" onclick="obStep=2;renderOnboarding();return false">Skip for now</a></div>`;
    if (step === 2) return `
        <div class="auth-header">
            <div class="auth-title">Where you operate</div>
            <div class="auth-desc">Country-specific fields for compliant proposals.</div>
        </div>
        <div class="fg"><label class="fl">Country</label><div id="obCountry"></div></div>
        <div class="fg"><label class="fl">Address</label><input type="text" id="obAddr" placeholder="Street, City, State, PIN" value="${esc(CONFIG?.address || '')}"></div>
        <div id="obCountryFields"></div>
        <button class="btn auth-submit" onclick="obNext()">Continue</button>
        <div class="ob-nav-row">
            <a href="#" onclick="obPrev();return false">&larr; Back</a>
            <a href="#" onclick="obStep=3;renderOnboarding();return false">Skip</a>
        </div>`;
    if (step === 3) return `
        <div class="auth-header">
            <div class="auth-title">Payment details</div>
            <div class="auth-desc">Bank info for your invoices. Update anytime in settings.</div>
        </div>
        <div class="fr">
            <div class="fg"><label class="fl">Bank Name</label><input type="text" id="obBankName" placeholder="e.g. HDFC Bank" value="${esc(CONFIG?.bank?.name || '')}"></div>
            <div class="fg"><label class="fl">Account Holder</label><input type="text" id="obBankHolder" placeholder="Account holder name" value="${esc(CONFIG?.bank?.holder || '')}"></div>
        </div>
        <div class="fg"><label class="fl">Account Number</label><input type="text" id="obBankAccount" placeholder="e.g. 1234567890" value="${esc(CONFIG?.bank?.account || '')}"></div>
        <div class="fr">
            <div class="fg"><label class="fl">IFSC / Sort Code</label><input type="text" id="obBankIfsc" placeholder="e.g. HDFC0001234" value="${esc(CONFIG?.bank?.ifsc || '')}"></div>
            <div class="fg"><label class="fl">SWIFT / BIC</label><input type="text" id="obBankSwift" placeholder="e.g. HDFCINBB" value="${esc(CONFIG?.bank?.swift || '')}"></div>
        </div>
        ${CONFIG?.country === 'IN' ? `<div class="fg"><label class="fl">UPI ID</label><input type="text" id="obBankUpi" placeholder="e.g. business@upi" value="${esc(CONFIG?.bank?.upi || '')}"><div class="fh">Shown as QR code on PDFs</div></div>` : ''}
        <button class="btn auth-submit" onclick="obNext()">Continue</button>
        <div class="ob-nav-row">
            <a href="#" onclick="obPrev();return false">&larr; Back</a>
            <a href="#" onclick="obNext();return false">Skip</a>
        </div>`;
    if (step === 4) return `
        <div class="auth-header">
            <div class="auth-title">Brand it yours</div>
            <div class="auth-desc">Logo and color for your proposals.</div>
        </div>
        <div class="fg">
            <label class="fl">Logo</label>
            <div class="brand-logo-box" onclick="document.getElementById('logoInput').click()" id="obLogoBox"><i data-lucide="image-plus"></i></div>
            <input type="file" id="logoInput" accept="image/*" style="display:none" onchange="handleLogo(this)">
            <div class="fh">PNG, JPG, SVG, WebP — max 2MB</div>
        </div>
        <div class="fg"><label class="fl">Brand Color</label><div id="obColors"></div></div>
        <button class="btn auth-submit" onclick="finishOb()">Start Creating</button>
        <div class="ob-nav-row">
            <a href="#" onclick="obPrev();return false">&larr; Back</a>
            <a href="#" onclick="finishOb();return false">Skip</a>
        </div>`;
    return '';
}

function getCountryFields(country) {
    if (country === 'IN') return `
        <div class="fg"><label class="fl">GSTIN</label><input type="text" id="obGstin" placeholder="e.g. 27AAAAA0000A1Z5" value="${esc(CONFIG?.gstin || '')}" maxlength="15"><div class="fh">15-digit GST Identification Number</div></div>
        <div class="fr">
            <div class="fg"><label class="fl">PAN</label><input type="text" id="obPan" placeholder="e.g. AAAAA0000A" value="${esc(CONFIG?.pan || '')}" maxlength="10"><div class="fh">Permanent Account Number</div></div>
            <div class="fg"><label class="fl">UDYAM Registration</label><input type="text" id="obUdyam" placeholder="e.g. UDYAM-MH-00-0000000" value="${esc(CONFIG?.udyam || '')}"><div class="fh">MSME Registration Number</div></div>
        </div>
        <div class="fg"><label class="fl">LUT Number</label><input type="text" id="obLut" placeholder="LUT number from GST portal" value="${esc(CONFIG?.lut || '')}" maxlength="20"><div class="fh">Letter of Undertaking (for zero-rated exports)</div></div>`;
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
    if (obStep === 1) {
        const name = document.getElementById('obName')?.value?.trim();
        if (!name) { toast('Please enter your name', 'warning'); document.getElementById('obName')?.focus(); return; }
    }
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
        const lut = document.getElementById('obLut')?.value?.trim();
        if (lut && !validateTaxId('lut', lut)) { toast('Invalid LUT number', 'warning'); return false; }
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
        if (CONFIG.country === 'IN') { CONFIG.gstin = v('obGstin'); CONFIG.pan = v('obPan'); CONFIG.udyam = v('obUdyam'); CONFIG.lut = v('obLut'); }
        else if (CONFIG.country === 'US') { CONFIG.ein = v('obEin'); }
        else if (['GB','DE','FR','NL','SE','IE'].includes(CONFIG.country)) { CONFIG.vatNumber = v('obVat'); }
        else if (CONFIG.country === 'AU') { CONFIG.abn = v('obAbn'); }
        else { CONFIG.taxId = v('obTaxId'); }
    }
    if (obStep === 3) {
        if (!CONFIG.bank) CONFIG.bank = {};
        CONFIG.bank.name = v('obBankName'); CONFIG.bank.holder = v('obBankHolder');
        CONFIG.bank.account = v('obBankAccount'); CONFIG.bank.ifsc = v('obBankIfsc');
        CONFIG.bank.swift = v('obBankSwift'); CONFIG.bank.upi = v('obBankUpi');
    }
}

function finishOb() {
    collectObStep();
    // Brand color
    const sel = document.querySelector('#obColors .color-swatch.on');
    if (sel) {
        CONFIG.color = rgbToHex(sel.style.background) || sel.style.background || '#800020';
    } else {
        const hexInp = document.querySelector('#obColors .color-hex-input');
        if (hexInp && /^#[0-9a-fA-F]{6}$/.test(hexInp.value.trim())) CONFIG.color = hexInp.value.trim();
        else CONFIG.color = CONFIG.color || '#800020';
    }
    saveConfig();
    if (typeof pushToCloud === 'function') pushToCloud();
    // Celebration animation before transitioning
    const obEl = document.getElementById('authContent') || document.getElementById('obContent');
    if (obEl) {
        obEl.innerHTML = `<div style="text-align:center;padding:60px 20px;animation:fadeIn .4s ease-out">
            <div style="font-size:48px;margin-bottom:16px">&#127881;</div>
            <div style="font-size:22px;font-weight:700;color:var(--text,#09090b);margin-bottom:8px">You're all set!</div>
            <div style="font-size:14px;color:var(--text3,#71717a);max-width:320px;margin:0 auto">Your workspace is ready. Let's create your first proposal.</div>
        </div>`;
    }
    setTimeout(() => {
        document.getElementById('onboard').classList.add('hide');
        document.getElementById('appShell').style.display = 'flex';
        bootApp();
        toast('Welcome to ProposalKit!');
    }, 1200);
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
    hexWrap.innerHTML = `<span class="color-hex-preview" style="background:${selected || '#800020'}"></span><input type="text" class="color-hex-input" value="${selected || '#800020'}" placeholder="#000000" maxlength="7" spellcheck="false">`;
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
        document.querySelectorAll('.brand-logo-box').forEach(box => { box.innerHTML = '<img src="' + esc(url) + '" alt="Company logo">'; });
        if (!CONFIG) CONFIG = {};
        CONFIG.logo = url;
    };
    reader.onerror = () => { toast('Error reading file', 'error'); input.value = ''; };
    reader.readAsDataURL(file);
}
