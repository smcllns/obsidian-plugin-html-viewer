import { Component, FileView, Notice, Plugin, TFile, WorkspaceLeaf } from "obsidian";

const VIEW_TYPE_HTML = "html-docs";

interface EmbedContext {
	containerEl: HTMLElement;
}

interface EmbedRegistry {
	registerExtension(
		extension: string,
		embedCreator: (context: EmbedContext, file: TFile) => Component,
	): void;
	unregisterExtension(extension: string): void;
}

interface AppWithEmbedRegistry {
	embedRegistry?: EmbedRegistry;
}

function renderSandboxedHtml(contentEl: HTMLElement, html: string): () => void {
	contentEl.empty();
	contentEl.addClass("html-docs-container");

	// Load the document via a Blob URL rather than srcdoc so anchor
	// links (#section) and the History API navigate correctly inside
	// the page. The sandbox attribute still gives the document an
	// opaque origin regardless of URL scheme, so isolation from
	// Obsidian and the vault is preserved.
	const blobUrl = URL.createObjectURL(new Blob([html], { type: "text/html" }));

	// Build the iframe fully detached so the browser never observes it
	// without the sandbox attribute. Inserting first, then setting
	// sandbox, leaves a window where the initial about:blank document
	// is created with the parent's origin — some Chromium versions
	// don't fully re-apply the sandbox on the subsequent navigation,
	// leaking same-origin privileges into user HTML.
	const iframe = contentEl.ownerDocument.createElement("iframe");
	iframe.className = "html-docs-iframe";
	// allow-scripts lets the page's JS run; omitting allow-same-origin
	// keeps it isolated from Obsidian and the user's vault.
	iframe.setAttribute("sandbox", "allow-scripts allow-popups allow-forms");
	iframe.src = blobUrl;
	contentEl.appendChild(iframe);

	return () => {
		URL.revokeObjectURL(blobUrl);
		contentEl.empty();
		contentEl.removeClass("html-docs-container");
	};
}

class HtmlView extends FileView {
	private cleanupHtml: (() => void) | null = null;

	getViewType(): string {
		return VIEW_TYPE_HTML;
	}

	getIcon(): string {
		return "code";
	}

	canAcceptExtension(extension: string): boolean {
		return extension === "html";
	}

	async onLoadFile(file: TFile): Promise<void> {
		const content = await this.app.vault.cachedRead(file);
		this.render(content);
	}

	async onUnloadFile(_file: TFile): Promise<void> {
		this.cleanupHtml?.();
		this.cleanupHtml = null;
	}

	private render(html: string): void {
		this.cleanupHtml?.();
		this.cleanupHtml = renderSandboxedHtml(this.contentEl, html);
	}
}

class HtmlEmbed extends Component {
	private cleanupHtml: (() => void) | null = null;

	constructor(
		private contentEl: HTMLElement,
		private plugin: HtmlDocsPlugin,
		private file: TFile,
	) {
		super();
	}

	async loadFile(): Promise<void> {
		const content = await this.plugin.app.vault.cachedRead(this.file);
		this.cleanupHtml?.();
		this.cleanupHtml = renderSandboxedHtml(this.contentEl, content);
	}

	onunload(): void {
		this.cleanupHtml?.();
		this.cleanupHtml = null;
	}
}

export default class HtmlDocsPlugin extends Plugin {
	async onload(): Promise<void> {
		this.registerView(
			VIEW_TYPE_HTML,
			(leaf: WorkspaceLeaf) => new HtmlView(leaf),
		);
		this.registerExtensions(["html"], VIEW_TYPE_HTML);

		const embedRegistry = (this.app as unknown as AppWithEmbedRegistry).embedRegistry;
		if (!embedRegistry) {
			throw new Error("HTML Docs: app.embedRegistry is unavailable; cannot register HTML embeds.");
		}
		embedRegistry.registerExtension("html", (context, file) => new HtmlEmbed(context.containerEl, this, file));
		this.register(() => embedRegistry.unregisterExtension("html"));

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
