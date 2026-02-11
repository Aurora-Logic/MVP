// ════════════════════════════════════════
// SIGNATURE PAD — Draw & save signatures
// ════════════════════════════════════════

/* exported clearSigCanvas, saveSignature, editSignature, clearSignature */
function initSignaturePad() {
    const display = document.getElementById('sigDisplay');
    if (!display) return;

    const savedSig = CONFIG?.signature;
    if (savedSig) {
        const safeSig = savedSig.startsWith('data:image/') ? savedSig : '';
        if (!safeSig) return showSignatureCanvas();
        const img = document.createElement('img');
        img.src = safeSig;
        img.className = 'sig-saved';
        img.alt = 'Your signature';
        display.innerHTML = '';
        display.appendChild(img);
        display.insertAdjacentHTML('beforeend', `
            <div class="sig-controls">
                <button class="btn-sm-ghost" onclick="editSignature()"><i data-lucide="edit-3"></i> Edit</button>
                <button class="btn-sm-destructive" onclick="clearSignature()"><i data-lucide="trash-2"></i> Clear</button>
            </div>`);
    } else {
        showSignatureCanvas();
    }
    lucide.createIcons();
}

function showSignatureCanvas() {
    const display = document.getElementById('sigDisplay');
    if (!display) return;
    display.innerHTML = `
        <canvas id="sigCanvas" class="sig-canvas" width="400" height="150"></canvas>
        <div class="sig-controls">
            <button class="btn-sm-ghost" onclick="clearSigCanvas()"><i data-lucide="eraser"></i> Clear</button>
            <button class="btn-sm" onclick="saveSignature()"><i data-lucide="save"></i> Save</button>
        </div>
        <div class="sig-placeholder">Draw your signature above</div>`;
    lucide.createIcons();
    setupSigCanvas();
}

function setupSigCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = document.documentElement.classList.contains('dark') ? '#fafafa' : '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
        return { x, y };
    };

    const start = (e) => { drawing = true; const pos = getPos(e); lastX = pos.x; lastY = pos.y; };
    const draw = (e) => { if (!drawing) return; e.preventDefault(); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(pos.x, pos.y); ctx.stroke(); lastX = pos.x; lastY = pos.y; };
    const stop = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stop);
}

function clearSigCanvas() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature() {
    const canvas = document.getElementById('sigCanvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    CONFIG.signature = dataUrl;
    saveConfig();
    initSignaturePad();
    toast('Signature saved');
}

function editSignature() { showSignatureCanvas(); }

function clearSignature() {
    confirmDialog('Remove your saved signature?', () => {
        CONFIG.signature = null;
        saveConfig();
        showSignatureCanvas();
        toast('Signature cleared');
    }, { title: 'Clear Signature', confirmText: 'Remove' });
}
