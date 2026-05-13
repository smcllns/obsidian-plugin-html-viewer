# HTML Docs Obsidian Plugin

A zero-dependency minimal plugin to enable .html docs inside Obsidian. Inspired by [Thariq's "unreasonable effectiveness of HTML"](https://x.com/trq212/status/2052809885763747935).


* The HTML is rendered in a sandboxed `<iframe>`.
* JS can run inside the HTML for interactivity but the iframe is isolated from your other notes and Obsidian's own data.
* No other bells and whistles.

The plugin is ~75 lines of code, ~100 lines of config, ~520 lines of test, and requires no external dependencies.

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

### Build and install from source

```bash
git clone https://github.com/smcllns/obsidian-plugin-html-docs/
npm install
npm run dev      # watch + rebuild
npm run build    # production bundle at `dist/html-docs/`
```

## Test

An E2E test runner validates features and sandboxing are working correctly. Requires `obsidian-cli`, Obsidian running with a vault open, the plugin installed and enabled, and `jq` available.


```bash
npm test
```

The script copies `test/fixture.html` into the vault temporarily, opens it in Obsidian, uses `obsidian-cli eval` to inspect the plugin view and verify the iframe exists with the expected sandbox and blob URL settings, collects the iframe’s own self-test results via `postMessage`, then cleans up.

See `test/fixture.html` for the full list of features exercised — and the inline notes for what is intentionally blocked.

## Obsidian Official Resources

* Developer docs: [docs.obsidian.md](https://docs.obsidian.md)

## Feedback / Support

This plugin will stay simple and do this one thing well.

File issues here, or message me on X (@smcllns).

If you want more features, please fork and customize as you need.

## Known Issues

1. **Does not support Obsidian Canvas or embeds.** HTML files in Canvas, and embeds in a doc (e.g. `![[doc.html]]`) continue to show the same placeholder as before.
