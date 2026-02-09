# ProposalKit - Claude Context

> [!NOTE]
> This file provides Claude with project context. It is automatically loaded into every conversation.

## Project Overview

**ProposalKit** is a professional proposal builder web application that allows users to create, manage, and export polished proposals and invoices as PDFs.

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **CSS Framework**: Tailwind CSS v4 (via CDN)
- **Icons**: Lucide Icons
- **Fonts**: Inter (UI), JetBrains Mono (code)
- **Rich Text Editing**: EditorJS with multiple plugins
- **Storage**: LocalStorage/IndexedDB
- **PWA**: Service Worker enabled

## Project Structure

```
/Users/virag/Downloads/MVP/
├── index.html           # Main app entry point
├── client.html          # Client-facing proposal view
├── manifest.json        # PWA manifest
├── sw.js                # Service worker
├── assets/
│   ├── css/             # Modular CSS (8 files)
│   │   ├── variables.css
│   │   ├── components.css
│   │   ├── layout.css
│   │   ├── pages.css
│   │   ├── features.css
│   │   ├── pdf.css
│   │   ├── responsive.css
│   │   └── print.css
│   ├── js/              # Modular JS (43 files, 4 subdirs)
│   │   ├── core/        # Foundation (store, utils, theme, modals)
│   │   ├── views/       # Pages (nav, dashboard, clients, settings)
│   │   ├── editor/      # Editor tabs (pricing, sections, details)
│   │   ├── export/      # PDF, preview, sharing, templates
│   │   └── boot.js      # App initialization (loaded last)
│   └── icons/           # App icons
├── docs/               # Documentation
└── .claude/             # Claude configuration
    ├── settings.json
    ├── settings.local.json
    ├── skills/          # Custom skills
    └── commands/        # Custom slash commands
```

## Key JavaScript Modules

| Module | Purpose |
|--------|---------|
| `core/store.js` | LocalStorage data management |
| `views/proposals.js` | Proposal CRUD operations |
| `editor/editor.js` | EditorJS integration |
| `editor/pricing.js` | Pricing tables and calculations |
| `export/templates.js` | PDF template management |
| `export/export.js` | PDF export functionality |
| `views/clients.js` | Client management |
| `views/nav.js` | SPA navigation |

## CSS Architecture

- `variables.css` - CSS custom properties (theme colors, spacing)
- `components.css` - Reusable UI components
- `layout.css` - Grid and layout systems
- `responsive.css` - Mobile breakpoints

## Development Guidelines

### Code Style
- Use semantic HTML5 elements
- Follow BEM-like CSS naming conventions
- JavaScript functions should be descriptive and modular
- Maintain existing dark/light theme compatibility

### Testing
```bash
# Validate JavaScript syntax
node -c assets/js/{core,views,editor,export}/<file>.js

# Open in browser
open index.html
```

### Common Tasks
- **Add new page sections**: Modify `sections.js` and `structured-sections.js`
- **Update styling**: Edit relevant CSS file in `assets/css/`
- **Add new features**: Create new JS module in appropriate `assets/js/{core,views,editor,export}/` subfolder

## Important Notes

- All data is stored client-side (localStorage)
- The app works offline as a PWA
- PDF exports use html2pdf.js or similar libraries
- Theme toggle persists via `pk_theme` localStorage key
