# HTML Viewer

A minimal Obsidian plugin that lets you bring the (unreasonanble effectiveness of HTML)[https://x.com/trq212/status/2052809885763747935] to Obsidian.

* The html is rendered in a sandboxed `<iframe>`.
* Javascript run for interactivity, but the iframe is isolated from Obsidian and from your vault (`sandbox="allow-scripts allow-popups allow-forms"`)
* Nothing else, fork and extend if you want other features.

## Install (manual)

1. `npm install`
2. `npm run build`
3. Copy `main.js`, `manifest.json`, and `styles.css` into `<vault>/.obsidian/plugins/html-viewer/`.
4. Enable **HTML Viewer** in Obsidian's Community Plugins settings.

## Dev

```bash
npm install
npm run dev
```

Open any `.html` or `.htm` file in your vault — Obsidian will route it through the plugin's view.
