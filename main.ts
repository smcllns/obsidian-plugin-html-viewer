import { FileView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

const VIEW_TYPE_HTML = "html-docs";

class HtmlView extends FileView {
	private iframe: HTMLIFrameElement | null = null;
	private blobUrl: string | null = null;

	getViewType(): string {
		return VIEW_TYPE_HTML;
	}

	getIcon(): string {
		return "code";
	}

	canAcceptExtension(extension: string): boolean {
		return extension === "html" || extension === "htm";
	}

	async onLoadFile(file: TFile): Promise<void> {
		const content = await this.app.vault.cachedRead(file);
		this.render(content);
	}

	async onUnloadFile(_file: TFile): Promise<void> {
		this.revokeBlob();
		this.contentEl.empty();
		this.iframe = null;
	}

	private revokeBlob(): void {
		if (this.blobUrl) {
			URL.revokeObjectURL(this.blobUrl);
			this.blobUrl = null;
		}
	}

	private render(html: string): void {
		this.contentEl.empty();
		this.contentEl.addClass("html-docs-container");
		this.revokeBlob();

		// Load the document via a Blob URL rather than srcdoc so anchor
		// links (#section) and the History API navigate correctly inside
		// the page. The sandbox attribute still gives the document an
		// opaque origin regardless of URL scheme, so isolation from
		// Obsidian and the vault is preserved.
		const blob = new Blob([html], { type: "text/html" });
		this.blobUrl = URL.createObjectURL(blob);

		// Build the iframe fully detached so the browser never observes it
		// without the sandbox attribute. Inserting first, then setting
		// sandbox, leaves a window where the initial about:blank document
		// is created with the parent's origin — some Chromium versions
		// don't fully re-apply the sandbox on the subsequent navigation,
		// leaking same-origin privileges into user HTML.
		const iframe = activeDocument.createElement("iframe");
		iframe.className = "html-docs-iframe";
		// allow-scripts lets the page's JS run; omitting allow-same-origin
		// keeps it isolated from Obsidian and the user's vault.
		iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-forms");
		iframe.src = this.blobUrl;
		this.contentEl.appendChild(iframe);
		this.iframe = iframe;
	}
}

export default class HtmlDocsPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(
			VIEW_TYPE_HTML,
			(leaf: WorkspaceLeaf) => new HtmlView(leaf),
		);
		this.registerExtensions(["html", "htm"], VIEW_TYPE_HTML);

		// Obsidian hides files with unrecognized extensions in the file
		// explorer unless "Show all file types" is on; registering the
		// extension only routes the view, it doesn't add to that filter.
		const vault = this.app.vault as { getConfig?: (key: string) => unknown };
		const showUnsupported = vault.getConfig?.("showUnsupportedFiles");
		if (showUnsupported === false) {
			new Notice(
				"To see .html files in your file explorer, please enable 'Show all file types' in Settings → Files & Links.",
				10000,
			);
		}
	}
}
