// ════════════════════════════════════════
// TIPTAP MENUS — Notion-style bubble menu + slash commands
// ════════════════════════════════════════

/* exported attachBubbleMenu, attachSlashMenu, destroyTiptapMenus */

// ─── Bubble Menu (appears on text selection) ───

function attachBubbleMenu(editor, wrapEl) {
    if (!editor || !wrapEl) return;
    let bubble = wrapEl.querySelector('.tt-bubble');
    if (bubble) bubble.remove();

    bubble = document.createElement('div');
    bubble.className = 'tt-bubble';
    bubble.setAttribute('role', 'toolbar');
    bubble.setAttribute('aria-label', 'Text formatting');
    bubble.innerHTML = `
        <button class="tt-b-btn" data-cmd="bold" data-tooltip="Bold" data-side="top"><strong>B</strong></button>
        <button class="tt-b-btn" data-cmd="italic" data-tooltip="Italic" data-side="top"><em>I</em></button>
        <button class="tt-b-btn" data-cmd="underline" data-tooltip="Underline" data-side="top"><u>U</u></button>
        <button class="tt-b-btn" data-cmd="strike" data-tooltip="Strikethrough" data-side="top"><s>S</s></button>
        <span class="tt-b-sep"></span>
        <button class="tt-b-btn" data-cmd="code" data-tooltip="Inline code" data-side="top"><code>&lt;/&gt;</code></button>
        <button class="tt-b-btn" data-cmd="highlight" data-tooltip="Highlight" data-side="top"><mark>H</mark></button>
        <button class="tt-b-btn" data-cmd="link" data-tooltip="Link" data-side="top"><i data-lucide="link" style="width:14px;height:14px"></i></button>`;
    wrapEl.style.position = 'relative';
    wrapEl.appendChild(bubble);
    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [bubble] });

    // Button handlers
    bubble.querySelectorAll('.tt-b-btn').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const cmd = btn.dataset.cmd;
            if (cmd === 'bold') editor.chain().focus().toggleBold().run();
            else if (cmd === 'italic') editor.chain().focus().toggleItalic().run();
            else if (cmd === 'underline') editor.chain().focus().toggleUnderline().run();
            else if (cmd === 'strike') editor.chain().focus().toggleStrike().run();
            else if (cmd === 'code') editor.chain().focus().toggleCode().run();
            else if (cmd === 'highlight') editor.chain().focus().toggleHighlight().run();
            else if (cmd === 'link') promptLink(editor);
            updateBubbleActive(editor, bubble);
        });
    });

    // Show/hide on selection change
    const update = () => {
        const { from, to, empty } = editor.state.selection;
        if (empty || from === to) { bubble.classList.remove('show'); return; }
        updateBubbleActive(editor, bubble);
        positionBubble(editor, bubble, wrapEl);
        bubble.classList.add('show');
    };
    editor.on('selectionUpdate', update);
    editor.on('blur', () => { setTimeout(() => { if (!bubble.matches(':hover')) bubble.classList.remove('show'); }, 150); });
    editor._bubbleCleanup = () => { editor.off('selectionUpdate', update); };
}

function updateBubbleActive(editor, bubble) {
    bubble.querySelectorAll('.tt-b-btn').forEach(btn => {
        const cmd = btn.dataset.cmd;
        const active = cmd === 'bold' ? editor.isActive('bold')
            : cmd === 'italic' ? editor.isActive('italic')
            : cmd === 'underline' ? editor.isActive('underline')
            : cmd === 'strike' ? editor.isActive('strike')
            : cmd === 'code' ? editor.isActive('code')
            : cmd === 'highlight' ? editor.isActive('highlight')
            : cmd === 'link' ? editor.isActive('link')
            : false;
        btn.classList.toggle('active', active);
    });
}

function positionBubble(editor, bubble, wrap) {
    const { view } = editor;
    const { from, to } = view.state.selection;
    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);
    const wrapRect = wrap.getBoundingClientRect();
    const midX = (start.left + end.right) / 2 - wrapRect.left;
    const topY = start.top - wrapRect.top - 44;
    bubble.style.left = Math.max(0, Math.min(midX - bubble.offsetWidth / 2, wrapRect.width - bubble.offsetWidth)) + 'px';
    bubble.style.top = Math.max(0, topY) + 'px';
}

function promptLink(editor) {
    const existing = editor.getAttributes('link').href || '';
    const url = prompt('Enter URL:', existing);
    if (url === null) return;
    if (url === '') { editor.chain().focus().unsetLink().run(); return; }
    let safeUrl = url.trim();
    if (!/^https?:\/\//i.test(safeUrl) && !safeUrl.startsWith('mailto:')) safeUrl = 'https://' + safeUrl;
    editor.chain().focus().setLink({ href: safeUrl }).run();
}

// ─── Slash Command Menu (type / to get block options) ───

const SLASH_ITEMS = [
    { label: 'Heading 2', desc: 'Large heading', icon: 'heading-2', cmd: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Heading 3', desc: 'Medium heading', icon: 'heading-3', cmd: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bullet List', desc: 'Unordered list', icon: 'list', cmd: (e) => e.chain().focus().toggleBulletList().run() },
    { label: 'Numbered List', desc: 'Ordered list', icon: 'list-ordered', cmd: (e) => e.chain().focus().toggleOrderedList().run() },
    { label: 'Task List', desc: 'Checklist with checkboxes', icon: 'check-square', cmd: (e) => e.chain().focus().toggleTaskList().run() },
    { label: 'Quote', desc: 'Blockquote', icon: 'quote', cmd: (e) => e.chain().focus().toggleBlockquote().run() },
    { label: 'Code Block', desc: 'Fenced code block', icon: 'code', cmd: (e) => e.chain().focus().toggleCodeBlock().run() },
    { label: 'Divider', desc: 'Horizontal rule', icon: 'minus', cmd: (e) => e.chain().focus().setHorizontalRule().run() },
    { label: 'Table', desc: '3x3 table', icon: 'table', cmd: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
];

function attachSlashMenu(editor, wrapEl) {
    if (!editor || !wrapEl) return;
    let menu = wrapEl.querySelector('.tt-slash');
    if (menu) menu.remove();

    menu = document.createElement('div');
    menu.className = 'tt-slash';
    menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', 'Insert block');
    wrapEl.appendChild(menu);

    let slashPos = null;
    let selectedIdx = 0;
    let filtered = [];

    function renderMenu(items) {
        filtered = items;
        selectedIdx = 0;
        menu.innerHTML = items.map((item, i) =>
            `<div class="tt-slash-item${i === 0 ? ' selected' : ''}" data-idx="${i}" role="option">
                <div class="tt-slash-icon"><i data-lucide="${item.icon}"></i></div>
                <div class="tt-slash-info"><div class="tt-slash-label">${item.label}</div><div class="tt-slash-desc">${item.desc}</div></div>
            </div>`
        ).join('');
        if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [menu] });
        menu.querySelectorAll('.tt-slash-item').forEach(el => {
            el.addEventListener('mousedown', (e) => {
                e.preventDefault();
                executeSlash(parseInt(el.dataset.idx));
            });
            el.addEventListener('mouseenter', () => {
                selectedIdx = parseInt(el.dataset.idx);
                highlightItem();
            });
        });
    }

    function highlightItem() {
        menu.querySelectorAll('.tt-slash-item').forEach((el, i) => {
            el.classList.toggle('selected', i === selectedIdx);
        });
    }

    function executeSlash(idx) {
        const item = filtered[idx];
        if (!item) return;
        // Delete the slash command text
        if (slashPos !== null) {
            const { from } = editor.state.selection;
            editor.chain().focus().deleteRange({ from: slashPos, to: from }).run();
        }
        item.cmd(editor);
        hideSlash();
    }

    function showSlash() {
        const { view } = editor;
        const { from } = view.state.selection;
        const coords = view.coordsAtPos(from);
        const wrapRect = wrapEl.getBoundingClientRect();
        menu.style.left = Math.max(0, coords.left - wrapRect.left) + 'px';
        menu.style.top = (coords.bottom - wrapRect.top + 4) + 'px';
        menu.classList.add('show');
    }

    function hideSlash() {
        menu.classList.remove('show');
        slashPos = null;
    }

    // Listen for "/" key
    const handleKeyDown = (view, event) => {
        if (menu.classList.contains('show')) {
            if (event.key === 'ArrowDown') {
                event.preventDefault();
                selectedIdx = (selectedIdx + 1) % filtered.length;
                highlightItem();
                return true;
            }
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                selectedIdx = (selectedIdx - 1 + filtered.length) % filtered.length;
                highlightItem();
                return true;
            }
            if (event.key === 'Enter') {
                event.preventDefault();
                executeSlash(selectedIdx);
                return true;
            }
            if (event.key === 'Escape') {
                hideSlash();
                return true;
            }
        }
        return false;
    };

    const handleUpdate = () => {
        if (!menu.classList.contains('show') && slashPos === null) return;
        if (slashPos === null) return;
        const { from } = editor.state.selection;
        const text = editor.state.doc.textBetween(slashPos, from, '');
        const query = text.replace(/^\//, '').toLowerCase();
        const items = SLASH_ITEMS.filter(item =>
            item.label.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)
        );
        if (!items.length || from < slashPos) { hideSlash(); return; }
        renderMenu(items);
        showSlash();
    };

    // Track slash insertion
    const handleTransaction = ({ transaction }) => {
        if (!transaction.docChanged) return;
        const { from } = editor.state.selection;
        // Check if the character just typed is "/"
        if (from > 0) {
            const charBefore = editor.state.doc.textBetween(from - 1, from, '');
            if (charBefore === '/' && slashPos === null) {
                // Only trigger at start of line or after whitespace
                const twoBefore = from > 1 ? editor.state.doc.textBetween(from - 2, from - 1, '') : '';
                if (from === 1 || twoBefore === '' || /\s/.test(twoBefore)) {
                    slashPos = from - 1;
                    renderMenu(SLASH_ITEMS);
                    showSlash();
                    return;
                }
            }
        }
        if (slashPos !== null) handleUpdate();
    };

    // Register handlers
    editor.view.dom.addEventListener('keydown', (e) => handleKeyDown(editor.view, e), true);
    editor.on('transaction', handleTransaction);
    editor.on('blur', () => { setTimeout(() => { if (!menu.matches(':hover')) hideSlash(); }, 150); });

    editor._slashCleanup = () => {
        editor.off('transaction', handleTransaction);
    };
}

function destroyTiptapMenus(editor) {
    if (!editor) return;
    if (editor._bubbleCleanup) editor._bubbleCleanup();
    if (editor._slashCleanup) editor._slashCleanup();
}
