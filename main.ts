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

		const iframe = this.contentEl.createEl("iframe", {
			cls: "html-viewer-iframe",
		});
		// allow-scripts lets the page's JS run; omitting allow-same-origin
		// keeps it isolated from Obsidian and the user's vault.
		iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-forms");
		iframe.srcdoc = html;
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
