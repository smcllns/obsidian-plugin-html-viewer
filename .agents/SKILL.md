---
name: obsidian-html-docs
description: Author HTML files for the Obsidian HTML Docs plugin (smcllns/obsidian-plugin-html-docs). Use when creating .html docs intended to render inline in Obsidian: theme tokens, sandbox constraints, asset rules, embed sizing, and things that silently do not work.
---

# Obsidian HTML Docs authoring guide

The HTML Docs plugin lets users view `.html` files inside Obsidian tabs, markdown embeds, and Canvas cards. It renders each file in a sandboxed iframe via Blob URL. The iframe is sealed (`sandbox="allow-scripts allow-popups allow-forms"`, no `allow-same-origin`) so it cannot reach into Obsidian or the vault. Everything below works within that envelope.

## Default to Obsidian context unless asked otherwise

Before creating the Blob URL, the plugin appends a `<style data-html-docs-theme>` block to your HTML containing a snapshot of the user's current Obsidian design tokens. The iframe does not reach out for these values. They are written as static CSS into your document at load time, then the sandboxed iframe loads that document. **Security boundary unchanged**: no `allow-same-origin`, no reads from the iframe back into Obsidian.

If the user just wants a styled doc that "fits" their vault, use these as your defaults. If they're asking for a specific aesthetic (brutalist poster, retro terminal, Linear-style, an exact brand palette), design freely — Obsidian context is a *hint*, not a constraint.

Injected as static CSS:

- A `color-scheme: light | dark` declaration matching the user's current Obsidian theme
- `--obsidian-color-scheme`
- `--obsidian-bg`
- `--obsidian-bg-2`
- `--obsidian-text`
- `--obsidian-text-muted`
- `--obsidian-accent`
- `--obsidian-border`
- `--obsidian-font`
- `--obsidian-font-mono`

Use Obsidian tokens if present, fall back if not:

```css
:root {
  color-scheme: light dark;
  --bg:   var(--obsidian-bg,   light-dark(#ffffff, #0e1014));
  --text: var(--obsidian-text, light-dark(#16161a, #e7e9ec));
}
```

Open HTML tabs and embeds re-render when the Obsidian theme changes, so the injected snapshot follows theme switches.

## Assets: vault paths do not cross into the iframe

The iframe has no base URL pointing into the vault. Obsidian themes, snippets, and `attachments/...` images don't reach the iframe.

| Pattern | Works? |
|---|---|
| `<img src="attachments/foo.png">` | No — fails silently |
| `<img src="data:image/png;base64,...">` | Yes — fully self-contained |
| `<img src="https://example.com/foo.png">` | Yes — CORS permitting |
| Inline `<svg>...</svg>` | Yes — best for icons / diagrams |
| `<link rel="stylesheet" href="https://cdn...">` | Yes — HTTPS only |

Rules of thumb:

- Small graphics & icons → inline SVG or `data:` URL
- Photos / large images → upload to a host (R2, CDN) and reference HTTPS
- Fonts → system stack, or HTTPS CDN
- Never reference `attachments/` or any vault path — the iframe can't see them

## What works

- HTML / CSS (grid, `light-dark()`, custom properties, animations, gradients, SVG with CSS animations)
- JavaScript (ES2020+, fetch with CORS, Promises, DOM events, requestAnimationFrame, Canvas 2D)
- Forms (`allow-forms` is set; intercept `submit` if you don't want navigation)
- `window.parent.postMessage(msg, '*')` — works even with opaque origin
- External HTTPS resources (images, fonts on CDNs, fetch APIs that allow CORS)
- Anchor links (`#section`) and the History API — Blob URL preserves both

## What's blocked

- `localStorage`, `sessionStorage`, `IndexedDB` — `SecurityError`
- `document.cookie` — throws or silently no-ops
- Reading `window.parent.*` — cross-origin (postMessage still works)
- Service workers, geolocation, clipboard, notifications, most permission-gated APIs
- Top-level navigation from inside the iframe (no `allow-top-navigation`)
- Vault-relative URLs (see Assets above)

## Linking from markdown to HTML

Wikilinks to `.html` files need the explicit extension:

```markdown
See: [[my-doc.html]]
```

`[[my-doc]]` won't resolve to `.html` in stock Obsidian.

## Embed sizing

```markdown
![[doc.html|600x400]]
```

Sets the embed width and height. Default markdown embed height is about 600px; tab views fill the pane.

## Pitfalls (skip the turn cost)

- **Theme scripts that read `window.parent`** — always throw under this plugin's sandbox. Don't write them.
- **Images via `attachments/foo.png`** — won't resolve. Inline as data URL or use HTTPS.
- **`localStorage` / cookies for state** — blocked. Use URL hash or postMessage to parent.
- **Hard-coding a palette when Obsidian tokens are available** — defeats the contextual fit. Use `var(--obsidian-*)` with `light-dark()` fallbacks.
- **Assuming `prefers-color-scheme` == Obsidian theme** — use `--obsidian-color-scheme` or injected colors instead.
