// ════════════════════════════════════════
// ONBOARDING
// ════════════════════════════════════════

function renderColorSwatches(containerId, selected) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className = 'color-swatch' + (selected === c ? ' on' : '');
        s.style.background = c;
        s.onclick = () => {
            el.querySelectorAll('.color-swatch').forEach(x => x.classList.remove('on'));
            s.classList.add('on');
        };
        el.appendChild(s);
    });
}

function handleLogo(input) {
    const file = input.files[0];
    if (!file) return;
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        toast('Please upload a valid image file (PNG, JPG, SVG, or WebP)', 'error');
        input.value = '';
        return;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        toast('Image size must be less than 2MB', 'error');
        input.value = '';
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
        const boxes = document.querySelectorAll('.brand-logo-box');
        boxes.forEach(box => {
            box.innerHTML = '<img src="' + e.target.result + '">';
        });
        if (!CONFIG) CONFIG = {};
        CONFIG.logo = e.target.result;
    };
    reader.onerror = () => {
        toast('Error reading file', 'error');
        input.value = '';
    };
    reader.readAsDataURL(file);
}

function obNext() {
    CONFIG = {
        company: document.getElementById('obCompany').value,
        name: document.getElementById('obName').value,
        email: document.getElementById('obEmail').value,
        phone: document.getElementById('obPhone')?.value || '',
        country: document.getElementById('obCountry')?.value || '',
        address: document.getElementById('obAddr').value,
        taxId: document.getElementById('obTaxId')?.value || '',
        website: document.getElementById('obWebsite')?.value || '',
        color: '#18181b',
        logo: null
    };
    document.getElementById('obStep1').style.display = 'none';
    document.getElementById('obStep2').style.display = 'block';
    lucide.createIcons();
}

function skipOb() { finishOb(); }

function finishOb() {
    const sel = document.querySelector('#obColors .color-swatch.on');
    if (sel) CONFIG.color = sel.style.background || '#18181b';
    saveConfig();
    document.getElementById('onboard').classList.add('hide');
    document.getElementById('appShell').style.display = 'flex';
    bootApp();
    toast('Welcome to ProposalKit!');
}
