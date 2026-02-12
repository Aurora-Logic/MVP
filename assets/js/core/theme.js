/* exported getCurrentTheme */
/* ═══════════════════════════════════════════════════════════════════════
   THEME — Light Mode Only + Font Management
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Ensure light mode (remove any stored dark preference) ───
(function initTheme() {
  document.documentElement.classList.remove('dark');
  localStorage.removeItem('pk_theme');

  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = '#ffffff';
})();

// ─── Get current theme (always light) ───
function getCurrentTheme() {
  return 'light';
}

// ─── Apply font family (Google Fonts) ───
const FONT_URLS = {
    'System': '', // SF Pro / Helvetica Neue / Helvetica (system fonts)
    'Roboto': 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap',
    'Lato': 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
    'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap',
    'Merriweather': 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap',
    'Courier Prime': 'https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap'
};

function applyFont(fontName) {
    if (!fontName || fontName === 'System' || fontName === 'Inter') {
        document.documentElement.style.setProperty('--font', "'SF Pro Display', 'SF Pro', 'Helvetica Neue', Helvetica, -apple-system, BlinkMacSystemFont, system-ui, sans-serif");
        return;
    }
    const url = FONT_URLS[fontName];
    if (url && !document.querySelector(`link[href="${url}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
    }
    const fallback = fontName === 'Courier Prime' ? 'monospace' : 'system-ui, sans-serif';
    document.documentElement.style.setProperty('--font', `'${fontName}', ${fallback}`);
}

// Apply saved font on load
(function initFont() {
    try {
        const cfg = JSON.parse(localStorage.getItem('pk_config') || 'null');
        if (cfg?.font) applyFont(cfg.font);
    } catch (e) { /* ignore */ }
})();
