# HTML Docs Obsidian Plugin

A zero-dependency minimal plugin to enable .html docs inside Obsidian. Inspired by [Thariq's "unreasonable effectiveness of HTML"](https://x.com/trq212/status/2052809885763747935).


* The HTML is rendered in a sandboxed `<iframe>`.
* `.html` files work as tabs, note embeds (`![[doc.html]]`), and Canvas file cards.
* JS can run inside the HTML for interactivity but the iframe is isolated from your other notes and Obsidian's own data.
* No other bells and whistles.

The plugin requires no external dependencies.

## Demo

A demo page (`test/fixture.html`) demonstrates all the passing HTML features.

![](demo.png)

## Installation

> Note: Obsidian only shows `.md` files in your file explorer, by default. To see your `.html` files too, be sure to enable: **Settings → Files & links → Show all file types**

### Install from Obsidian directly

* Go to Obsidian Community Plugins: [community.obsidian.md/plugins/html-docs](https://community.obsidian.md/plugins/html-docs)
* Click Install

### Install manually

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/smcllns/obsidian-plugin-html-docs/releases/latest)
2. Place those files into `<vault>/.obsidian/plugins/html-docs/`.
3. Enable **HTML Docs** in Obsidian's Community Plugins settings.

Releases are built and signed by GitHub Actions ([.github/workflows/release.yml](.github/workflows/release.yml)) so the binaries carry a [build attestation](https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations/using-artifact-attestations-to-establish-provenance-for-builds) you can verify against the source.

### Embed sizing

Markdown embeds default to 600px tall. To size one embed, use Obsidian's standard embed dimensions:

```markdown
![[doc.html|500x320]]
```

To change the default height for all HTML embeds, add a CSS snippet:

```css
:root {
	--html-docs-embed-height: 720px;
}
```

HTML embeds do not auto-fit to the page's internal height because the sandbox intentionally gives the iframe an opaque origin.

### Build and install from source

```bash
git clone https://github.com/smcllns/obsidian-plugin-html-docs/
npm install
npm run dev      # watch + rebuild
npm run build    # production bundle at `dist/html-docs/`
```

## Test

An E2E test runner validates features, embeds, Canvas cards, and sandboxing are working correctly. Requires `obsidian-cli`, Obsidian running with a vault open, the plugin installed and enabled, and `jq` available.


```bash
npm test
```

The script builds the current plugin, copies it into the active vault's plugin folder, reloads it, copies `test/fixture.html` into the vault temporarily, opens it in Obsidian, verifies the tab view plus markdown and Canvas embeds, collects the iframe’s own self-test results via `postMessage`, then cleans up.

See `test/fixture.html` for the full list of features exercised — and the inline notes for what is intentionally blocked.

## Obsidian Official Resources

* Developer docs: [docs.obsidian.md](https://docs.obsidian.md)

## Feedback / Support

This plugin will stay simple and do this one thing well.

File issues here, or message me on X (@smcllns).

If you want more features, please fork and customize as you need.
