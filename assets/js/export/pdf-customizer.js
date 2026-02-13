// ════════════════════════════════════════
// PDF CUSTOMIZER — Template Style Editor (Pro/Team)
// ════════════════════════════════════════

/* exported getPdfStyles, savePdfStyles, resetPdfStyles, renderPdfCustomizer, applyPdfStyles, previewPdfCustomization, togglePdfCustomizeDrawer, renderPdfCustomizeDrawer */

// Default PDF styles
const DEFAULT_PDF_STYLES = {
    primaryColor: '#800020',      // Burgundy - main accent color
    headingColor: '#09090b',      // Near black - h1, h2, h3
    textColor: '#3f3f46',         // Dark gray - body text
    mutedColor: '#71717a',        // Medium gray - secondary text
    borderColor: '#e4e4e7',       // Light gray - borders, dividers
    tableHeaderBg: '#fafafa',     // Very light gray - table headers
    fontFamily: 'Inter',          // Main font
    headingFontFamily: 'Inter',   // Heading font
    fontSize: '13px',             // Base font size
    headingSize: '24px',          // H1 size
    lineHeight: '1.6',            // Body line height
    borderWidth: '1px',           // Border thickness
    borderRadius: '8px',          // Rounded corners
    tableBorderColor: '#e4e4e7',  // Table borders
    tableRowAltBg: '#f9fafb'      // Alternate row background
};

function getPdfStyles() {
    if (!CONFIG) return DEFAULT_PDF_STYLES;
    if (!CONFIG.pdfStyles) {
        CONFIG.pdfStyles = structuredClone(DEFAULT_PDF_STYLES);
        saveConfig();
    }
    return CONFIG.pdfStyles;
}

function savePdfStyles(styles) {
    if (!CONFIG) return;
    CONFIG.pdfStyles = styles;
    saveConfig();
    toast('PDF styles saved');
}

function resetPdfStyles() {
    if (!CONFIG) return;
    CONFIG.pdfStyles = structuredClone(DEFAULT_PDF_STYLES);
    saveConfig();
    toast('PDF styles reset to default');
    renderPdfCustomizer();
}

// Apply PDF styles to preview (called from buildPreview)
function applyPdfStyles(html) {
    const styles = getPdfStyles();
    // Replace hardcoded colors with custom styles
    let styled = html
        .replace(/#800020/g, styles.primaryColor)
        .replace(/#09090b/g, styles.headingColor)
        .replace(/#3f3f46/g, styles.textColor)
        .replace(/#71717a/g, styles.mutedColor)
        .replace(/#e4e4e7/g, styles.borderColor)
        .replace(/#fafafa/g, styles.tableHeaderBg)
        .replace(/font-family:Inter/g, `font-family:${styles.fontFamily}`)
        .replace(/font-size:13px/g, `font-size:${styles.fontSize}`)
        .replace(/font-size:24px/g, `font-size:${styles.headingSize}`)
        .replace(/line-height:1\.6/g, `line-height:${styles.lineHeight}`)
        .replace(/border:1px solid/g, `border:${styles.borderWidth} solid`)
        .replace(/border-radius:8px/g, `border-radius:${styles.borderRadius}`);
    return styled;
}

// Generate sample proposal for preview
function generateSampleProposal() {
    const sampleId = 'pdf-preview-sample';
    return {
        id: sampleId,
        title: 'Website Redesign Project',
        number: 'PROP-2024-001',
        status: 'draft',
        date: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 30*86400000).toISOString().split('T')[0],
        currency: CONFIG?.currency || '₹',
        sender: {
            company: CONFIG?.company || 'Your Company',
            email: CONFIG?.email || 'hello@company.com',
            address: CONFIG?.address || '123 Business Street, City, Country'
        },
        client: {
            name: 'Acme Corporation',
            contact: 'John Smith',
            email: 'john@acme.com',
            phone: '+1 234 567 8900',
            address: '456 Client Avenue, Metro City'
        },
        lineItems: [
            { desc: 'UI/UX Design', detail: 'Complete redesign of website interface', qty: 1, rate: 50000 },
            { desc: 'Frontend Development', detail: 'React-based responsive implementation', qty: 1, rate: 75000 },
            { desc: 'Backend Integration', detail: 'API development and database setup', qty: 1, rate: 60000 }
        ],
        sections: [
            { title: 'Project Overview', content: '<p>This proposal outlines our approach to redesigning your company website with a modern, user-friendly interface.</p>' },
            { title: 'Deliverables', content: '<ul><li>Responsive web design</li><li>Mobile-optimized interface</li><li>Performance optimization</li></ul>' }
        ],
        discount: 0,
        taxRate: 18,
        coverPage: false,
        version: 1
    };
}

function previewPdfCustomization() {
    // Save current proposal ID
    const originalCUR = typeof CUR !== 'undefined' ? CUR : null;

    // Generate and set sample proposal
    const sample = generateSampleProposal();

    // Temporarily add to DB if buildPreview needs it
    const existingIndex = DB.findIndex(p => p.id === sample.id);
    if (existingIndex >= 0) {
        DB[existingIndex] = sample;
    } else {
        DB.push(sample);
    }

    // Set as current
    if (typeof window !== 'undefined') window.CUR = sample.id;

    // Open preview
    if (typeof openPreview === 'function') {
        openPreview();
    }

    // Restore original after preview opens
    setTimeout(() => {
        // Remove sample from DB
        const idx = DB.findIndex(p => p.id === sample.id);
        if (idx >= 0) DB.splice(idx, 1);

        // Restore original CUR
        if (typeof window !== 'undefined') window.CUR = originalCUR;
    }, 100);
}

function renderPdfCustomizer() {
    // Check plan access
    const hasPdfCustomization = typeof checkLimit === 'function' ? checkLimit('pdfCustomization').allowed : false;

    if (!hasPdfCustomization) {
        return `<div class="card card-p" style="margin-bottom:14px">
            <div class="card-head">
                <div><div class="card-t">PDF Template Editor</div>
                <div class="card-d">Customize PDF colors, fonts, and styling</div></div>
                <span class="badge badge-draft" style="font-size:11px">Pro Feature</span>
            </div>
            <div style="padding:20px;text-align:center;color:var(--muted-foreground);background:var(--muted);border-radius:8px">
                <i data-lucide="lock" style="width:32px;height:32px;margin-bottom:8px;opacity:0.5"></i>
                <p style="margin:0 0 12px;font-size:13px;font-weight:500">PDF customization is a Pro feature</p>
                <button class="btn-sm" onclick="if(typeof showUpgradeModal==='function')showUpgradeModal('pdfCustomization',{allowed:false,plan:'free'})">
                    <i data-lucide="sparkles"></i> Upgrade to Pro
                </button>
            </div>
        </div>`;
    }

    const styles = getPdfStyles();

    return `<div class="card card-p" id="pdfCustomizerCard" style="margin-bottom:14px">
        <div class="card-head">
            <div><div class="card-t">PDF Template Editor</div>
            <div class="card-d">Customize your PDF appearance</div></div>
            <div style="display:flex;gap:8px">
                <button class="btn-sm-outline" onclick="resetPdfStyles()"><i data-lucide="rotate-ccw"></i> Reset</button>
                <button class="btn-sm" onclick="previewPdfCustomization()"><i data-lucide="eye"></i> Preview Changes</button>
            </div>
        </div>

        <div class="pdf-cust-grid">
            <!-- Colors Section -->
            <div class="pdf-cust-section">
                <div class="pdf-cust-label"><i data-lucide="palette"></i> Colors</div>

                <div class="pdf-cust-row">
                    <label class="fl">Primary Color</label>
                    <input type="color" id="pdfPrimaryColor" value="${esc(styles.primaryColor)}" onchange="updatePdfStyle('primaryColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.primaryColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Heading Color</label>
                    <input type="color" id="pdfHeadingColor" value="${esc(styles.headingColor)}" onchange="updatePdfStyle('headingColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.headingColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Text Color</label>
                    <input type="color" id="pdfTextColor" value="${esc(styles.textColor)}" onchange="updatePdfStyle('textColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.textColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Muted Text</label>
                    <input type="color" id="pdfMutedColor" value="${esc(styles.mutedColor)}" onchange="updatePdfStyle('mutedColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.mutedColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Border Color</label>
                    <input type="color" id="pdfBorderColor" value="${esc(styles.borderColor)}" onchange="updatePdfStyle('borderColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.borderColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Table Header BG</label>
                    <input type="color" id="pdfTableHeaderBg" value="${esc(styles.tableHeaderBg)}" onchange="updatePdfStyle('tableHeaderBg', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.tableHeaderBg}</span>
                </div>
            </div>

            <!-- Typography Section -->
            <div class="pdf-cust-section">
                <div class="pdf-cust-label"><i data-lucide="type"></i> Typography</div>

                <div class="pdf-cust-row">
                    <label class="fl">Font Family</label>
                    <div id="pdfFontFamily"></div>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Heading Font</label>
                    <div id="pdfHeadingFont"></div>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Font Size</label>
                    <input type="text" id="pdfFontSize" value="${esc(styles.fontSize)}" oninput="updatePdfStyle('fontSize', this.value)" placeholder="13px" style="width:80px">
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Heading Size</label>
                    <input type="text" id="pdfHeadingSize" value="${esc(styles.headingSize)}" oninput="updatePdfStyle('headingSize', this.value)" placeholder="24px" style="width:80px">
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Line Height</label>
                    <input type="text" id="pdfLineHeight" value="${esc(styles.lineHeight)}" oninput="updatePdfStyle('lineHeight', this.value)" placeholder="1.6" style="width:80px">
                </div>
            </div>

            <!-- Spacing & Borders Section -->
            <div class="pdf-cust-section">
                <div class="pdf-cust-label"><i data-lucide="square"></i> Spacing & Borders</div>

                <div class="pdf-cust-row">
                    <label class="fl">Border Width</label>
                    <input type="text" id="pdfBorderWidth" value="${esc(styles.borderWidth)}" oninput="updatePdfStyle('borderWidth', this.value)" placeholder="1px" style="width:80px">
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Border Radius</label>
                    <input type="text" id="pdfBorderRadius" value="${esc(styles.borderRadius)}" oninput="updatePdfStyle('borderRadius', this.value)" placeholder="8px" style="width:80px">
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Table Border</label>
                    <input type="color" id="pdfTableBorderColor" value="${esc(styles.tableBorderColor)}" onchange="updatePdfStyle('tableBorderColor', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.tableBorderColor}</span>
                </div>

                <div class="pdf-cust-row">
                    <label class="fl">Alt Row BG</label>
                    <input type="color" id="pdfTableRowAltBg" value="${esc(styles.tableRowAltBg)}" onchange="updatePdfStyle('tableRowAltBg', this.value)" class="pdf-color-input">
                    <span class="pdf-color-hex">${styles.tableRowAltBg}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function updatePdfStyle(key, value) {
    const styles = getPdfStyles();
    styles[key] = value;

    // Update hex display for color inputs
    if (key.includes('Color') || key.includes('Bg')) {
        const input = document.getElementById('pdf' + key.charAt(0).toUpperCase() + key.slice(1));
        if (input && input.nextElementSibling) {
            input.nextElementSibling.textContent = value;
        }
    }

    savePdfStyles(styles);

    // Auto-refresh preview if open
    const prevPanel = document.getElementById('prevPanel');
    if (prevPanel && prevPanel.classList.contains('show')) {
        // Debounce preview updates (don't rebuild on every keystroke)
        if (updatePdfStyle._previewTimer) clearTimeout(updatePdfStyle._previewTimer);
        updatePdfStyle._previewTimer = setTimeout(() => {
            if (typeof buildPreview === 'function') buildPreview();
        }, 300);
    }
}

// Initialize font selectors after rendering
function initPdfCustomizerSelects() {
    if (typeof csel !== 'function') return;

    const styles = getPdfStyles();
    const fonts = [
        { value: 'Inter', label: 'Inter', desc: 'Modern sans-serif' },
        { value: 'System', label: 'System Default', desc: 'SF Pro / Segoe UI' },
        { value: 'Georgia', label: 'Georgia', desc: 'Classic serif' },
        { value: 'Times New Roman', label: 'Times New Roman', desc: 'Traditional serif' },
        { value: 'Arial', label: 'Arial', desc: 'Standard sans-serif' },
        { value: 'Helvetica', label: 'Helvetica', desc: 'Clean sans-serif' },
        { value: 'Verdana', label: 'Verdana', desc: 'Readable sans-serif' },
        { value: 'Courier New', label: 'Courier New', desc: 'Monospace' }
    ];

    const fontFamilyEl = document.getElementById('pdfFontFamily');
    const headingFontEl = document.getElementById('pdfHeadingFont');

    if (fontFamilyEl) {
        csel(fontFamilyEl, {
            value: styles.fontFamily,
            items: fonts,
            onChange: (val) => updatePdfStyle('fontFamily', val)
        });
    }

    if (headingFontEl) {
        csel(headingFontEl, {
            value: styles.headingFontFamily,
            items: fonts,
            onChange: (val) => updatePdfStyle('headingFontFamily', val)
        });
    }
}

// ════════════════════════════════════════
// DRAWER FUNCTIONS (Preview Panel Integration)
// ════════════════════════════════════════

function togglePdfCustomizeDrawer() {
    const drawer = document.getElementById('pdfCustomizeDrawer');
    const btn = document.getElementById('pdfCustomizeBtn');

    if (!drawer) return;

    const isOpen = drawer.classList.contains('show');

    if (isOpen) {
        drawer.classList.remove('show');
        if (btn) btn.classList.remove('on');
    } else {
        // Check plan access
        const hasPdfCustomization = typeof checkLimit === 'function' ? checkLimit('pdfCustomization').allowed : false;
        if (!hasPdfCustomization) {
            if (typeof showUpgradeModal === 'function') {
                showUpgradeModal('pdfCustomization', checkLimit('pdfCustomization'));
            }
            return;
        }

        // Populate drawer content
        renderPdfCustomizeDrawer();
        drawer.classList.add('show');
        if (btn) btn.classList.add('on');
    }
}

function renderPdfCustomizeDrawer() {
    const body = document.getElementById('pdfCustomizeBody');
    if (!body) return;

    const styles = getPdfStyles();

    body.innerHTML = `
        <!-- Colors Section -->
        <div class="pdf-cust-section">
            <div class="pdf-cust-label"><i data-lucide="palette"></i> Colors</div>

            <div class="pdf-cust-row">
                <label class="fl">Primary Color</label>
                <input type="color" id="pdfPrimaryColor" value="${esc(styles.primaryColor)}" onchange="updatePdfStyleDrawer('primaryColor', this.value)" class="pdf-color-input">
                <span class="pdf-color-hex">${styles.primaryColor}</span>
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Heading Color</label>
                <input type="color" id="pdfHeadingColor" value="${esc(styles.headingColor)}" onchange="updatePdfStyleDrawer('headingColor', this.value)" class="pdf-color-input">
                <span class="pdf-color-hex">${styles.headingColor}</span>
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Text Color</label>
                <input type="color" id="pdfTextColor" value="${esc(styles.textColor)}" onchange="updatePdfStyleDrawer('textColor', this.value)" class="pdf-color-input">
                <span class="pdf-color-hex">${styles.textColor}</span>
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Muted Text</label>
                <input type="color" id="pdfMutedColor" value="${esc(styles.mutedColor)}" onchange="updatePdfStyleDrawer('mutedColor', this.value)" class="pdf-color-input">
                <span class="pdf-color-hex">${styles.mutedColor}</span>
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Border Color</label>
                <input type="color" id="pdfBorderColor" value="${esc(styles.borderColor)}" onchange="updatePdfStyleDrawer('borderColor', this.value)" class="pdf-color-input">
                <span class="pdf-color-hex">${styles.borderColor}</span>
            </div>
        </div>

        <!-- Typography Section -->
        <div class="pdf-cust-section">
            <div class="pdf-cust-label"><i data-lucide="type"></i> Typography</div>

            <div class="pdf-cust-row">
                <label class="fl">Font Family</label>
                <div id="pdfFontFamilyDrawer"></div>
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Font Size</label>
                <input type="text" id="pdfFontSize" value="${esc(styles.fontSize)}" oninput="updatePdfStyleDrawer('fontSize', this.value)" placeholder="13px">
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Heading Size</label>
                <input type="text" id="pdfHeadingSize" value="${esc(styles.headingSize)}" oninput="updatePdfStyleDrawer('headingSize', this.value)" placeholder="24px">
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Line Height</label>
                <input type="text" id="pdfLineHeight" value="${esc(styles.lineHeight)}" oninput="updatePdfStyleDrawer('lineHeight', this.value)" placeholder="1.6">
            </div>
        </div>

        <!-- Spacing Section -->
        <div class="pdf-cust-section">
            <div class="pdf-cust-label"><i data-lucide="square"></i> Spacing</div>

            <div class="pdf-cust-row">
                <label class="fl">Border Width</label>
                <input type="text" id="pdfBorderWidth" value="${esc(styles.borderWidth)}" oninput="updatePdfStyleDrawer('borderWidth', this.value)" placeholder="1px">
            </div>

            <div class="pdf-cust-row">
                <label class="fl">Border Radius</label>
                <input type="text" id="pdfBorderRadius" value="${esc(styles.borderRadius)}" oninput="updatePdfStyleDrawer('borderRadius', this.value)" placeholder="8px">
            </div>
        </div>

        <!-- Actions -->
        <div class="pdf-cust-actions">
            <button class="btn-sm-outline" onclick="resetPdfStylesDrawer()"><i data-lucide="rotate-ccw"></i> Reset</button>
        </div>
    `;

    // Initialize icon rendering
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Initialize font selector
    initPdfCustomizerDrawerSelects();
}

function initPdfCustomizerDrawerSelects() {
    if (typeof csel !== 'function') return;

    const styles = getPdfStyles();
    const fonts = [
        { value: 'Inter', label: 'Inter', desc: 'Modern sans-serif' },
        { value: 'System', label: 'System Default', desc: 'SF Pro / Segoe UI' },
        { value: 'Georgia', label: 'Georgia', desc: 'Classic serif' },
        { value: 'Times New Roman', label: 'Times New Roman', desc: 'Traditional serif' },
        { value: 'Arial', label: 'Arial', desc: 'Standard sans-serif' },
        { value: 'Helvetica', label: 'Helvetica', desc: 'Clean sans-serif' },
        { value: 'Verdana', label: 'Verdana', desc: 'Readable sans-serif' },
        { value: 'Courier New', label: 'Courier New', desc: 'Monospace' }
    ];

    const fontFamilyEl = document.getElementById('pdfFontFamilyDrawer');

    if (fontFamilyEl) {
        csel(fontFamilyEl, {
            value: styles.fontFamily,
            items: fonts,
            onChange: (val) => updatePdfStyleDrawer('fontFamily', val)
        });
    }
}

function updatePdfStyleDrawer(key, value) {
    const styles = getPdfStyles();
    styles[key] = value;

    // Update hex display for color inputs
    if (key.includes('Color') || key.includes('Bg')) {
        const input = document.getElementById('pdf' + key.charAt(0).toUpperCase() + key.slice(1));
        if (input && input.nextElementSibling && input.nextElementSibling.classList.contains('pdf-color-hex')) {
            input.nextElementSibling.textContent = value;
        }
    }

    savePdfStyles(styles);

    // Auto-refresh preview if open
    if (updatePdfStyleDrawer._previewTimer) clearTimeout(updatePdfStyleDrawer._previewTimer);
    updatePdfStyleDrawer._previewTimer = setTimeout(() => {
        if (typeof buildPreview === 'function') buildPreview();
    }, 300);
}

function resetPdfStylesDrawer() {
    if (!CONFIG) return;
    CONFIG.pdfStyles = structuredClone(DEFAULT_PDF_STYLES);
    saveConfig();
    toast('PDF styles reset to default');
    renderPdfCustomizeDrawer();

    // Refresh preview
    setTimeout(() => {
        if (typeof buildPreview === 'function') buildPreview();
    }, 100);
}
