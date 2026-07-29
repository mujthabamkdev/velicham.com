---
name: velicham-styling
description: >
  Styling skill for Velicham.com. Handles CSS design tokens, component styling, 
  Tailwind utility classes, glassmorphism effects, animations, and the monochrome 
  black & white design system. Trigger for any visual, UI, color, layout, spacing, 
  typography, responsive design, dark mode, or animation task.
---

# Velicham Styling Skill

## Design System Overview

Velicham uses a **monochrome black & white** design system. The entire UI is built on pure black backgrounds with white text and white accent elements. No colored accents are allowed.

## Design Tokens (defined in `src/app/globals.css` under `@theme`)

| Token | Value | Usage |
|---|---|---|
| `--color-void` | `#000000` | Page background |
| `--color-surface-base` | `#050505` | Section backgrounds |
| `--color-surface-card` | `rgba(255,255,255,0.03)` | Card backgrounds |
| `--color-surface-hover` | `rgba(255,255,255,0.06)` | Hover states |
| `--color-border` | `rgba(255,255,255,0.1)` | Default borders |
| `--color-border-hover` | `rgba(255,255,255,0.2)` | Hover borders |
| `--color-accent-primary` | `#ffffff` | Primary accent (white) |
| `--color-accent-secondary` | `#a3a3a3` | Secondary text (gray) |
| `--font-sans` | `Inter` | Body text |
| `--font-mono` | `JetBrains Mono` | Code, labels |

## Color Rules

### STRICTLY FORBIDDEN colors:
- Purple (`purple-*`, `violet-*`, `indigo-*`)
- Cyan (`cyan-*`, `teal-*`)
- Pink (`pink-*`, `rose-*`)
- Any gradient using colored stops

### ALLOWED colors:
- `white`, `black`, `gray-*` (all shades)
- `red-*` (ONLY for error/destructive states)
- `emerald-*` / `green-*` (ONLY for success indicators)
- `rgba(255,255,255,*)` at any opacity

## Component Styling Patterns

### Primary Button
```html
<button className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-bold transition shadow">
  Button Text
</button>
```

### Secondary Button
```html
<button className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono font-bold transition">
  Button Text
</button>
```

### Card
```html
<div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 shadow-2xl">
  <!-- content -->
</div>
```

### Input Field
```html
<input className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white transition" />
```

### Alert (Error)
```html
<div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
  <i className="lni lni-warning text-sm" /> Error message
</div>
```

### Alert (Success)
```html
<div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
  <i className="lni lni-checkmark text-sm" /> Success message
</div>
```

## Glassmorphism Classes (defined in `globals.css`)

| Class | Usage |
|---|---|
| `.glass-panel` | Header/nav bar background with blur |
| `.glass-card` | Cards with blur + border + hover lift |
| `.glass-input` | Input fields with subtle glass effect |
| `.glow-white` | Subtle white glow box-shadow |
| `.text-gradient` | White-to-gray gradient text |

## Animation Classes

| Class | Effect |
|---|---|
| `.animate-float` | 6s vertical float (10px) |
| `.animate-pulse-glow` | 3s opacity pulse |
| `.live-dot` | Green pulsing dot indicator |

## Icon System — Lineicons 4.0

Always use `<i className="lni lni-{name} text-{size}" />`. Never use emojis or SVGs.

CDN loaded via:
- `globals.css`: `@import url("https://cdn.lineicons.com/4.0/lineicons.css");`
- `layout.tsx`: `<link rel="stylesheet" href="https://cdn.lineicons.com/4.0/lineicons.css" />`

### Common Icon Mapping

| Purpose | Icon Class |
|---|---|
| Search | `lni-search-alt` |
| Sparkle/AI | `lni-sparkles` |
| Lightning/Admin | `lni-bolt` |
| Key/API | `lni-key` |
| Heart/Like | `lni-heart` |
| Bookmark | `lni-bookmark` |
| Delete | `lni-trash-can` |
| Edit | `lni-pencil` |
| Folder/Move | `lni-folder` |
| Close | `lni-close` |
| Warning | `lni-warning` |
| Back Arrow | `lni-arrow-left` |
| Logout | `lni-exit` |
| Rocket/Generate | `lni-rocket` |
| Network/Graph | `lni-network` |
| Share | `lni-share-alt` |
| Comments | `lni-comments-alt` |
| Reload/Repost | `lni-reload` |
| Lock/Security | `lni-lock` |
| Book/Docs | `lni-book` |
| Checkmark | `lni-checkmark` |

## Responsive Breakpoints (TailwindCSS 4 defaults)

| Prefix | Min Width |
|---|---|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

## Typography Scale

- Page titles: `text-2xl font-bold text-white`
- Section headers: `text-lg font-bold text-white`
- Body text: `text-sm text-gray-300`
- Labels: `text-xs font-medium text-gray-400`
- Mono labels: `text-xs font-mono font-bold text-gray-400 uppercase tracking-wider`
- Tiny text: `text-[11px] text-gray-500`

## Layout Architecture

The root layout (`src/app/layout.tsx`) renders:
1. `<Header />` — global nav bar (rendered ONCE, never in pages)
2. `<main>` — page content fills remaining space via `flex-1`
3. `<FloatingAiAgent />` — floating chat bubble

Pages should NOT wrap in `min-h-screen bg-[#0f0f11]`. They sit inside the flex layout.
