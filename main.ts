import {
	Component,
	FileView,
	getLinkpath,
	Notice,
	type OpenViewState,
	type PaneType,
	Plugin,
	TFile,
	WorkspaceLeaf,
} from "obsidian";

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

interface RenderOptions {
	mode: "view" | "embed";
	widthPx?: number | null;
	heightPx?: number | null;
}

type OpenLinkText = (
	linktext: string,
	sourcePath: string,
	newLeaf?: PaneType | boolean,
	openViewState?: OpenViewState,
) => Promise<void>;

function parseDimension(value: string | null): number | null {
	if (!value) return null;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function renderSandboxedHtml(contentEl: HTMLElement, html: string, options: RenderOptions): () => void {
	contentEl.empty();
	contentEl.addClass("html-docs-container");
	contentEl.addClass(options.mode === "view" ? "html-docs-view" : "html-docs-embed");
	const cssProps: Record<string, string> = {};
	if (options.widthPx) cssProps["--html-docs-width"] = `${options.widthPx}px`;
	if (options.heightPx) cssProps["--html-docs-height"] = `${options.heightPx}px`;
	contentEl.setCssProps(cssProps);

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
		contentEl.removeClass("html-docs-view");
		contentEl.removeClass("html-docs-embed");
		contentEl.style.removeProperty("--html-docs-width");
		contentEl.style.removeProperty("--html-docs-height");
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
		this.cleanupHtml = renderSandboxedHtml(this.contentEl, html, { mode: "view" });
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
		this.cleanupHtml = renderSandboxedHtml(this.contentEl, content, {
			mode: "embed",
			widthPx: parseDimension(this.contentEl.getAttribute("width")),
			heightPx: parseDimension(this.contentEl.getAttribute("height")),
		});
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
		this.registerExistingHtmlTabNavigation();

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

	private registerExistingHtmlTabNavigation(): void {
		const workspace = this.app.workspace;
		const openLinkText = workspace.openLinkText.bind(workspace) as OpenLinkText;

		// There is no before-open event for file views, so handle the link
		// navigation path before Obsidian creates another leaf.
		const wrapper = (async (linktext, sourcePath, newLeaf, openViewState) => {
			if (!newLeaf && openViewState?.active !== false) {
				const file = this.resolveHtmlLink(linktext, sourcePath);
				const leaf = file ? this.findOpenHtmlLeaf(file) : null;
				if (leaf) {
					workspace.setActiveLeaf(leaf, { focus: true });
					return;
				}
			}

			await openLinkText(linktext, sourcePath, newLeaf, openViewState);
		}) as OpenLinkText;
		workspace.openLinkText = wrapper;

		this.register(() => {
			if (workspace.openLinkText === wrapper) workspace.openLinkText = openLinkText;
		});
	}

	private resolveHtmlLink(linktext: string, sourcePath: string): TFile | null {
		const linkpath = getLinkpath(linktext);
		const file =
			this.app.metadataCache.getFirstLinkpathDest(linkpath, sourcePath) ??
			this.app.vault.getAbstractFileByPath(linkpath);
		return file instanceof TFile && file.extension === "html" ? file : null;
	}

	private findOpenHtmlLeaf(file: TFile): WorkspaceLeaf | null {
		let existingLeaf: WorkspaceLeaf | null = null;
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (existingLeaf) return;
			const viewState = leaf.getViewState();
			if (viewState.type !== VIEW_TYPE_HTML) return;
			const stateFile = viewState.state?.file;
			const statePath = typeof stateFile === "string" ? stateFile : null;
			const livePath = leaf.view instanceof HtmlView ? leaf.view.file?.path : null;
			if (statePath === file.path || livePath === file.path) existingLeaf = leaf;
		});
		return existingLeaf;
	}
}
