import { FileView, Plugin, TFile, WorkspaceLeaf } from "obsidian";

const VIEW_TYPE_HTML = "html-viewer";

class HtmlView extends FileView {
	private iframe: HTMLIFrameElement | null = null;

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
		const content = await this.app.vault.read(file);
		this.render(content);
	}

	async onUnloadFile(_file: TFile): Promise<void> {
		this.contentEl.empty();
		this.iframe = null;
	}

	private render(html: string): void {
		this.contentEl.empty();
		this.contentEl.addClass("html-viewer-container");

		// Build the iframe fully detached so the browser never observes it
		// without the sandbox attribute. Inserting first, then setting
		// sandbox, leaves a window where the initial about:blank document
		// is created with the parent's origin — some Chromium versions
		// don't fully re-apply the sandbox on the subsequent srcdoc
		// navigation, leaking same-origin privileges into user HTML.
		const iframe = document.createElement("iframe");
		iframe.className = "html-viewer-iframe";
		// allow-scripts lets the page's JS run; omitting allow-same-origin
		// keeps it isolated from Obsidian and the user's vault.
		iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-forms");
		iframe.srcdoc = html;
		this.contentEl.appendChild(iframe);
		this.iframe = iframe;
	}
}

export default class HtmlViewerPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(
			VIEW_TYPE_HTML,
			(leaf: WorkspaceLeaf) => new HtmlView(leaf),
		);
		this.registerExtensions(["html", "htm"], VIEW_TYPE_HTML);
	}
}
