# HTML Viewer

A minimal Obsidian plugin that lets you bring the (unreasonanble effectiveness of HTML)[https://x.com/trq212/status/2052809885763747935] to Obsidian.

* The html is rendered in a sandboxed `<iframe>`.
* Javascript run for interactivity, but the iframe is isolated from Obsidian and from your vault (`sandbox="allow-scripts allow-popups allow-forms"`)
* Nothing else, fork and extend if you want other features.

## What works

HTML, CSS (gradients, grid, animations, custom properties), JavaScript (ES2020+, Promises, `setInterval`, DOM events), inline SVG, Canvas 2D, forms, and absolute HTTPS resources (images, fetch with CORS).

## What doesn't work (by design)

Without `allow-same-origin` the page has an opaque origin, so these are blocked:

- `localStorage`, `sessionStorage`, `IndexedDB`, `document.cookie`
- Reading the parent (`window.parent.*`) — `postMessage` still works
- Vault-relative URLs like `<img src="attachments/foo.png">` — use absolute HTTPS or data URLs
- Service workers, geolocation, clipboard, notifications

This is the security trade-off: scripts run, but a malicious or untrusted HTML file can't reach Obsidian, your vault, or your cookies.

## Install (manual)

1. `npm install`
2. `npm run build`
3. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/html-viewer/`.
4. Enable **HTML Viewer** in Obsidian's Community Plugins settings.

## Dev

```bash
npm install
npm run dev      # watch + rebuild
npm run build    # production bundle
```

Open any `.html` or `.htm` file in your vault — Obsidian will route it through the plugin's view.

## Test

A smoke-test suite drives a running Obsidian instance via `obsidian-cli`.

```bash
npm test
```

Requires Obsidian running with a vault open, the plugin installed and enabled, and `jq` available. The script copies `test/fixture.html` into the vault temporarily, opens it, verifies the iframe shape from outside Obsidian and collects the iframe's own self-test results via `postMessage`, then cleans up.

See `test/fixture.html` for the full list of features exercised — and the inline notes for what is intentionally blocked.
