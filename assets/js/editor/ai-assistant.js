// ════════════════════════════════════════
// AI WRITING ASSISTANT — Anthropic Claude
// ════════════════════════════════════════

/* exported showAiPanel, runAi, runAiCustom, acceptAiResult, renderAiSettingsCard */
let _aiLoading = false;

const AI_PROMPTS = {
    improve: 'Improve the following proposal section text. Make it more professional, clear, and persuasive while keeping the same meaning. Return only the improved text, no explanations or preamble.',
    expand: 'Expand the following proposal section with more detail and relevant points. Maintain the same tone and style. Return only the expanded text, no explanations.',
    shorten: 'Condense the following proposal section to be more concise while keeping all key points. Return only the shortened text, no explanations.',
    grammar: 'Fix any grammar, spelling, or punctuation errors in the following text. Return only the corrected text, no explanations.'
};

async function aiRequest(prompt, content) {
    const key = CONFIG?.aiApiKey;
    if (!key) { toast('Add your API key in Settings → AI Assistant', 'warning'); return null; }
    try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': key,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: CONFIG.aiModel || 'claude-sonnet-4-20250514',
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt + '\n\n---\n\n' + content }]
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            toast('AI error: ' + (err.error?.message || 'HTTP ' + res.status), 'error');
            return null;
        }
        const data = await res.json();
        return data.content?.[0]?.text || null;
    } catch (e) {
        toast('AI request failed: ' + e.message, 'error');
        return null;
    }
}

function showAiPanel(sectionIdx) {
    document.getElementById('aiPanel')?.remove();
    const panel = document.createElement('div');
    panel.id = 'aiPanel';
    panel.className = 'ai-panel';
    panel.innerHTML = `
        <div class="ai-panel-head">
            <i data-lucide="sparkles" class="ai-icon"></i>
            <span class="ai-title">AI Assistant</span>
            <button class="btn-sm-icon-ghost" onclick="document.getElementById('aiPanel')?.remove()" data-tooltip="Close"><i data-lucide="x"></i></button>
        </div>
        <div class="ai-actions">
            <button class="ai-action-btn" onclick="runAi('improve',${sectionIdx})"><i data-lucide="wand-2"></i> Improve</button>
            <button class="ai-action-btn" onclick="runAi('expand',${sectionIdx})"><i data-lucide="expand"></i> Expand</button>
            <button class="ai-action-btn" onclick="runAi('shorten',${sectionIdx})"><i data-lucide="minimize-2"></i> Shorten</button>
            <button class="ai-action-btn" onclick="runAi('grammar',${sectionIdx})"><i data-lucide="spell-check"></i> Fix Grammar</button>
        </div>
        <div class="ai-custom">
            <input type="text" id="aiCustomPrompt" placeholder="Custom instruction..." onkeydown="if(event.key==='Enter')runAiCustom(${sectionIdx})">
            <button class="btn-sm" onclick="runAiCustom(${sectionIdx})"><i data-lucide="send"></i></button>
        </div>
        <div id="aiLoading" class="ai-loading" style="display:none">
            <i data-lucide="loader-2" style="animation:spin 1s linear infinite"></i> Thinking...
        </div>
        <div id="aiResult" class="ai-result" style="display:none">
            <div id="aiResultContent" class="ai-result-content"></div>
            <div class="ai-result-actions">
                <button class="btn-sm" onclick="acceptAiResult(${sectionIdx})"><i data-lucide="check"></i> Accept</button>
                <button class="btn-sm-outline" onclick="document.getElementById('aiResult').style.display='none'">Discard</button>
            </div>
        </div>`;
    const secBlock = document.querySelectorAll('.sec-b')[sectionIdx];
    if (secBlock) secBlock.after(panel);
    else document.getElementById('edSections')?.appendChild(panel);
    lucide.createIcons();
    document.getElementById('aiCustomPrompt')?.focus();
}

function getEditorContent(sectionIdx) {
    const editor = sectionEditors[sectionIdx];
    if (!editor) return '';
    try {
        return typeof editor.getText === 'function' ? editor.getText() : '';
    } catch (e) { return ''; }
}

async function runAi(action, sectionIdx) {
    if (_aiLoading) return;
    const content = await getEditorContent(sectionIdx);
    if (!content.trim()) { toast('Section is empty — write something first', 'warning'); return; }
    _aiLoading = true;
    document.querySelectorAll('.ai-action-btn,.ai-custom button').forEach(b => b.disabled = true);
    const loading = document.getElementById('aiLoading');
    const resultEl = document.getElementById('aiResult');
    if (loading) loading.style.display = 'flex';
    if (resultEl) resultEl.style.display = 'none';
    lucide.createIcons();
    const result = await aiRequest(AI_PROMPTS[action], content);
    _aiLoading = false;
    document.querySelectorAll('.ai-action-btn,.ai-custom button').forEach(b => b.disabled = false);
    if (loading) loading.style.display = 'none';
    if (result) {
        const contentEl = document.getElementById('aiResultContent');
        if (contentEl) contentEl.textContent = result;
        if (resultEl) resultEl.style.display = 'block';
        window._aiResultText = result;
    }
}

async function runAiCustom(sectionIdx) {
    if (_aiLoading) return;
    const prompt = document.getElementById('aiCustomPrompt')?.value.trim();
    if (!prompt) return;
    _aiLoading = true;
    document.querySelectorAll('.ai-action-btn,.ai-custom button').forEach(b => b.disabled = true);
    const content = await getEditorContent(sectionIdx);
    const fullPrompt = content.trim() ? prompt + '\n\nApply this instruction to the following text. Return only the result, no explanations.' : prompt + '\n\nReturn only the result text, no explanations.';
    const loading = document.getElementById('aiLoading');
    const resultEl = document.getElementById('aiResult');
    if (loading) loading.style.display = 'flex';
    if (resultEl) resultEl.style.display = 'none';
    lucide.createIcons();
    const result = await aiRequest(fullPrompt, content || '(empty section — generate new content)');
    _aiLoading = false;
    document.querySelectorAll('.ai-action-btn,.ai-custom button').forEach(b => b.disabled = false);
    if (loading) loading.style.display = 'none';
    if (result) {
        const contentEl = document.getElementById('aiResultContent');
        if (contentEl) contentEl.textContent = result;
        if (resultEl) resultEl.style.display = 'block';
        window._aiResultText = result;
    }
}

function acceptAiResult(sectionIdx) {
    const text = window._aiResultText;
    if (!text) return;
    const editor = sectionEditors[sectionIdx];
    if (!editor) return;
    if (typeof pushUndo === 'function') pushUndo();
    // Convert plain text paragraphs to HTML
    const html = text.split('\n\n').filter(p => p.trim()).map(p => `<p>${esc(p.trim())}</p>`).join('');
    editor.commands.setContent(html);
    dirty();
    document.getElementById('aiPanel')?.remove();
    toast('AI suggestion applied');
}

function renderAiSettingsCard() {
    return `<div class="card card-p" style="margin-bottom:14px">
        <div class="card-head"><div><div class="card-t">AI Writing Assistant</div><div class="card-d">Powered by Anthropic Claude</div></div></div>
        <div class="fg"><label class="fl">API Key</label>
            <input type="password" id="setAiKey" value="${esc(CONFIG?.aiApiKey || '')}" placeholder="sk-ant-api03-..." oninput="saveSettings()">
            <div class="fh">Get your key from <a href="https://console.anthropic.com" target="_blank" rel="noopener">console.anthropic.com</a>. Stored locally only.</div>
        </div>
    </div>`;
}
