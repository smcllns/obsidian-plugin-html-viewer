# HTML Viewer

A minimal Obsidian plugin that lets you open `.html` (and `.htm`) files inside Obsidian, with JavaScript execution.

The file is rendered in a sandboxed `<iframe>` (`sandbox="allow-scripts allow-popups allow-forms"`). Scripts run, but the iframe is isolated from Obsidian and from your vault.

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

Open any `.html` file in your vault — Obsidian will route it through the plugin's view.
