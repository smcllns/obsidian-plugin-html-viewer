#!/usr/bin/env bash
# Smoke-test the HTML Viewer plugin against a running Obsidian instance.
#
# Requires:
#   - Obsidian running with a vault open
#   - The plugin installed and enabled in that vault
#   - obsidian-cli on PATH (ships with Obsidian.app: /Applications/Obsidian.app/Contents/MacOS/obsidian-cli)
#   - jq on PATH
#
# Run:
#   npm test
#   # or:  bash test/test.sh

set -euo pipefail

PLUGIN_ID="html-viewer"
FIXTURE_REL="_html-viewer-test-fixture.html"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIXTURE_SRC="$ROOT/test/fixture.html"

red()   { printf "\033[31m%s\033[0m" "$1"; }
green() { printf "\033[32m%s\033[0m" "$1"; }
gray()  { printf "\033[90m%s\033[0m" "$1"; }
amber() { printf "\033[33m%s\033[0m" "$1"; }

die() { echo "error: $*" >&2; exit 2; }

command -v obsidian-cli >/dev/null || die "obsidian-cli not on PATH (it ships inside Obsidian.app)"
command -v jq           >/dev/null || die "jq not on PATH (brew install jq)"

# Strip the "=> " prefix obsidian-cli adds to eval output.
oeval() { obsidian-cli eval code="$1" 2>/dev/null | sed 's/^=> //'; }

VAULT_PATH="$(oeval "app.vault.adapter.basePath" | sed 's/^"//; s/"$//')"
[[ -n "$VAULT_PATH" && -d "$VAULT_PATH" ]] || die "could not discover active vault (is Obsidian running with a vault open?)"

ENABLED="$(oeval "app.plugins.enabledPlugins.has('$PLUGIN_ID') ? 'yes' : 'no'" | sed 's/^"//; s/"$//')"
[[ "$ENABLED" == "yes" ]] || die "plugin '$PLUGIN_ID' is not enabled in vault '$VAULT_PATH'"

echo "vault:  $VAULT_PATH"
echo "plugin: $PLUGIN_ID (enabled)"
echo

FIXTURE_DEST="$VAULT_PATH/$FIXTURE_REL"
cp "$FIXTURE_SRC" "$FIXTURE_DEST"

cleanup() {
  rm -f "$FIXTURE_DEST"
  # close any html-viewer leaves we left open
  oeval "app.workspace.getLeavesOfType('$PLUGIN_ID').forEach(l => l.detach()); 'ok'" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# Install a parent-side listener BEFORE opening the fixture, so we don't miss
# the postMessage from the iframe's <script>.
oeval "
  window.__hvResults = null;
  if (window.__hvListener) window.removeEventListener('message', window.__hvListener);
  window.__hvListener = (e) => {
    if (e.data && e.data.type === 'html-viewer-test-results') window.__hvResults = e.data;
  };
  window.addEventListener('message', window.__hvListener);
  'ok'
" >/dev/null

# Give Obsidian a moment to notice the new file, then open it.
sleep 1
obsidian-cli open path="$FIXTURE_REL" newtab >/dev/null

# The fixture finalizes at most 4s after load. Wait a bit longer for the
# postMessage to arrive (network-dependent tests need a buffer).
sleep 6

OUTER="$(oeval "
  const view = app.workspace.activeLeaf && app.workspace.activeLeaf.view;
  const iframe = view && view.contentEl && view.contentEl.querySelector('iframe.html-viewer-iframe');
  let contentDoc = null;
  try { contentDoc = iframe ? !!iframe.contentDocument : null; } catch (e) { contentDoc = false; }
  JSON.stringify({
    viewType: view && view.getViewType(),
    file: view && view.file && view.file.path,
    hasIframe: !!iframe,
    sandbox: iframe && iframe.getAttribute('sandbox'),
    hasSrcdoc: iframe ? !!iframe.srcdoc : false,
    contentDocAccessible: contentDoc,
  })
")"

INNER="$(oeval "JSON.stringify(window.__hvResults)")"

failed=0
check() {
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf "  %s %s\n" "$(green ✓)" "$label"
  else
    printf "  %s %s %s\n" "$(red ✗)" "$label" "$(gray "(expected '$expected', got '$actual')")"
    failed=1
  fi
}

echo "Outer assertions (Obsidian-side):"
check "view type is html-viewer"          "$(echo "$OUTER" | jq -r .viewType)" "html-viewer"
check "fixture file is open"               "$(echo "$OUTER" | jq -r .file)"      "$FIXTURE_REL"
check "iframe rendered"                    "$(echo "$OUTER" | jq -r .hasIframe)" "true"
check "sandbox is locked down"             "$(echo "$OUTER" | jq -r .sandbox)"   "allow-scripts allow-popups allow-forms"
check "srcdoc is populated"                "$(echo "$OUTER" | jq -r .hasSrcdoc)" "true"
check "contentDocument is cross-origin"    "$(echo "$OUTER" | jq -r .contentDocAccessible)" "false"

echo
echo "Inner assertions (iframe-side, via postMessage):"
if [[ -z "$INNER" || "$INNER" == "null" ]]; then
  printf "  %s no test results received from fixture\n" "$(red ✗)"
  printf "     %s\n" "$(gray "the iframe's <script> may not have run, or postMessage was blocked")"
  failed=1
else
  pass=$(echo "$INNER" | jq -r .pass)
  fail=$(echo "$INNER" | jq -r .fail)
  skip=$(echo "$INNER" | jq -r .skip)
  printf "  %s passed · %s failed · %s skipped\n" "$(green "$pass")" "$([[ $fail -gt 0 ]] && red "$fail" || echo "$fail")" "$(amber "$skip")"
  echo "$INNER" | jq -r '.tests[] | (if .status == "pass" then "  [32m✓[0m " elif .status == "skip" then "  [33m—[0m " else "  [31m✗[0m " end) + .name + (if .detail != "" then "  [90m" + .detail + "[0m" else "" end)'
  [[ "$fail" == "0" ]] || failed=1
fi

echo
if [[ "$failed" -eq 0 ]]; then
  echo "$(green "All checks passed.")"
  exit 0
else
  echo "$(red "One or more checks failed.")"
  exit 1
fi
