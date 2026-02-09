/* ═══════════════════════════════════════════════════════════════════════
   THEME — Dark/Light Mode Toggle (shadcn pattern)
   ═══════════════════════════════════════════════════════════════════════ */

// ─── Initialize theme on page load (runs immediately) ───
(function initTheme() {
  const storedTheme = localStorage.getItem('pk_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Determine theme: stored preference > system preference > light default
  const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');

  // Apply immediately to prevent flash
  document.documentElement.classList.toggle('dark', theme === 'dark');

  // Update meta theme-color for mobile browsers
  updateMetaTheme(theme);
})();

// ─── Toggle theme function (called by UI button) ───
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.classList.contains('dark');
  const newTheme = isDark ? 'light' : 'dark';

  // Toggle class
  html.classList.toggle('dark', !isDark);

  // Persist preference
  localStorage.setItem('pk_theme', newTheme);

  // Update meta theme-color
  updateMetaTheme(newTheme);

  // Re-initialize Lucide icons for theme toggle button
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ─── Update meta theme-color for mobile browsers ───
function updateMetaTheme(theme) {
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  metaTheme.content = theme === 'dark' ? '#09090b' : '#ffffff';
}

// ─── Get current theme ───
function getCurrentTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// ─── Listen for system theme changes ───
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  const storedTheme = localStorage.getItem('pk_theme');
  // Only auto-switch if user hasn't set explicit preference
  if (!storedTheme) {
    const theme = e.matches ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', e.matches);
    updateMetaTheme(theme);

    // Re-initialize Lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }
});
