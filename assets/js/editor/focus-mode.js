// ════════════════════════════════════════
// FOCUS / DISTRACTION-FREE MODE
// ════════════════════════════════════════

/* exported toggleFocusMode */
function toggleFocusMode() {
    const app = document.getElementById('appShell');
    if (!app) return;
    focusMode = !focusMode;
    app.classList.toggle('focus-mode', focusMode);

    // Floating exit button
    let exitBtn = document.getElementById('focusExitBtn');
    if (focusMode) {
        if (!exitBtn) {
            exitBtn = document.createElement('button');
            exitBtn.id = 'focusExitBtn';
            exitBtn.className = 'focus-exit-btn';
            exitBtn.setAttribute('data-tooltip', 'Exit focus mode (Esc)');
            exitBtn.setAttribute('data-side', 'bottom');
            exitBtn.innerHTML = '<i data-lucide="minimize-2"></i>';
            exitBtn.onclick = exitFocusMode;
            document.body.appendChild(exitBtn);
            lucide.createIcons();
        }
        exitBtn.style.display = '';
    } else {
        if (exitBtn) exitBtn.style.display = 'none';
    }
}

function exitFocusMode() {
    if (!focusMode) return;
    focusMode = false;
    const app = document.getElementById('appShell');
    if (app) app.classList.remove('focus-mode');
    const exitBtn = document.getElementById('focusExitBtn');
    if (exitBtn) exitBtn.style.display = 'none';
}
