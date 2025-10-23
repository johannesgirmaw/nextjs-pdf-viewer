import { PdfViewer, setPdfJsWorkerSrc } from "../viewer/Viewer";

const TEMPLATE = document.createElement("template");
TEMPLATE.innerHTML = `
  <style>
    :host { display: block; contain: content; --bg: #f5f7fb; --panel: #ffffff; --border: #e5e7eb; --muted: #6b7280; --muted-2: #81868f; --accent: #3b82f6; }
    .container { position: relative; height: 100%; width: 100%; background: var(--bg); }
    .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; align-items: center; padding: 10px; background: var(--panel); border-bottom: 1px solid var(--border); flex-wrap: wrap; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .group { display: inline-flex; gap: 6px; align-items: center; padding: 6px; background: #fafafa; border: 1px solid var(--border); border-radius: 10px; }
    .viewer { position: absolute; top: 58px; bottom: 0; left: 0; right: 0; overflow: auto; overscroll-behavior: contain; }
    /* Ensure pdf.js text layer renders correctly inside shadow DOM */
    .textLayer { position: absolute; inset: 0; pointer-events: none; color: transparent; opacity: 0; }
    .textLayer span { position: absolute; transform-origin: 0% 0%; white-space: pre; color: transparent; }
    .textLayer .endOfContent { display: none; }
    .highlight-layer { position: absolute; inset: 0; pointer-events: none; z-index: 2; background: transparent !important; }
    button { appearance: none; background: var(--muted); color: #fff; border: 0; padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background .15s ease; }
    button:hover { background: var(--muted-2); }
    button:disabled { opacity: 0.5; cursor: default; }
    .ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
    .ghost:hover { background: #f3f4f6; }
    input[type="number"] { width: 72px; padding: 6px 8px; border: 1px solid var(--border); border-radius: 8px; }
    input[type="search"] { width: 240px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; }
    select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 8px; background: #fff; }
    .spacer { flex: 1 1 auto; }
  </style>
  <div class="container">
    <div class="toolbar">
      <div class="group">
        <button id="zoomOut">-</button>
        <span id="scaleLabel">100%</span>
        <button id="zoomIn">+</button>
        <select id="scaleSelect">
          <option value="0.5">50%</option>
          <option value="0.75">75%</option>
          <option value="1" selected>100%</option>
          <option value="1.25">125%</option>
          <option value="1.5">150%</option>
          <option value="2">200%</option>
          <option value="3">300%</option>
        </select>
        <button id="fitWidth" class="ghost">Fit width</button>
        <button id="fitPage" class="ghost">Fit page</button>
      </div>

      <div class="group">
        <button id="pagePrev">◀</button>
        <span>Page</span>
        <input id="pageInput" type="number" min="1" value="1" />
        <span id="pageTotal"></span>
        <button id="goPage">Go</button>
        <button id="pageNext">▶</button>
      </div>

      <div class="spacer"></div>

      <div class="group">
        <span>Search</span>
        <input id="searchInput" type="search" placeholder="Find in document" />
        <span id="searchCount" style="min-width:48px;opacity:0.75"></span>
        <button id="searchPrev">Prev</button>
        <button id="searchNext">Next</button>
      </div>
    </div>
    <div class="viewer" id="scroll"></div>
  </div>
`;

export class PdfViewerElement extends HTMLElement {
  static get observedAttributes() {
    return ["src", "scale", "worker-src", "document-scroll", "render-all"];
  }

  private shadow: ShadowRoot;
  private viewerContainer!: HTMLElement;
  private viewer: PdfViewer | null = null;
  private scale = 1.0;
  private searchHits: number[] = [];
  private searchIndex = -1;
  private pendingSrc: string | null = null;
  private currentPage = 1;
  private totalPages = 0;
  private scrollRaf = 0;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.appendChild(TEMPLATE.content.cloneNode(true));
  }

  connectedCallback() {
    this.viewerContainer = this.shadow.getElementById("scroll") as HTMLElement;
    const src = this.getAttribute("src");
    const scaleAttr = this.getAttribute("scale");
    const workerSrc = this.getAttribute("worker-src");
    if (scaleAttr) this.scale = Math.max(0.1, parseFloat(scaleAttr));
    if (workerSrc) setPdfJsWorkerSrc(workerSrc);
    if (src) {
      this.initialize(src);
    } else if (this.pendingSrc) {
      this.initialize(this.pendingSrc);
      this.pendingSrc = null;
    }

    const zoomIn = this.shadow.getElementById("zoomIn") as HTMLButtonElement;
    const zoomOut = this.shadow.getElementById("zoomOut") as HTMLButtonElement;
    const scaleSelect = this.shadow.getElementById(
      "scaleSelect"
    ) as HTMLSelectElement;
    const fitWidthBtn = this.shadow.getElementById(
      "fitWidth"
    ) as HTMLButtonElement;
    const fitPageBtn = this.shadow.getElementById(
      "fitPage"
    ) as HTMLButtonElement;
    const scaleLabel = this.shadow.getElementById(
      "scaleLabel"
    ) as HTMLSpanElement;
    const pageInput = this.shadow.getElementById(
      "pageInput"
    ) as HTMLInputElement;
    const goPage = this.shadow.getElementById("goPage") as HTMLButtonElement;
    const pageTotal = this.shadow.getElementById(
      "pageTotal"
    ) as HTMLSpanElement;
    const pagePrev = this.shadow.getElementById(
      "pagePrev"
    ) as HTMLButtonElement;
    const pageNext = this.shadow.getElementById(
      "pageNext"
    ) as HTMLButtonElement;
    const searchInput = this.shadow.getElementById(
      "searchInput"
    ) as HTMLInputElement;
    const searchPrev = this.shadow.getElementById(
      "searchPrev"
    ) as HTMLButtonElement;
    const searchNext = this.shadow.getElementById(
      "searchNext"
    ) as HTMLButtonElement;
    const searchCount = this.shadow.getElementById(
      "searchCount"
    ) as HTMLSpanElement;
    const forceAll = document.createElement("button");
    forceAll.textContent = "▦ All";
    forceAll.title = "Render all pages";
    forceAll.addEventListener("click", () => {
      void this.viewer?.renderAllPages();
    });
    (this.shadow.querySelector(".toolbar") as HTMLElement).appendChild(
      forceAll
    );

    const updateScaleLabel = () => {
      scaleLabel.textContent = `${Math.round(this.scale * 100)}%`;
    };

    // Keyboard shortcuts
    this.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "+") {
          e.preventDefault();
          zoomIn.click();
        }
        if (e.key === "-") {
          e.preventDefault();
          zoomOut.click();
        }
        if (e.key.toLowerCase() === "f") {
          e.preventDefault();
          (
            this.shadowRoot?.getElementById("searchInput") as HTMLInputElement
          )?.focus();
        }
      }
      if (e.key === "PageDown" || e.key === "ArrowDown") {
        this.viewerContainer.scrollBy({ top: 400, behavior: "smooth" });
      }
      if (e.key === "PageUp" || e.key === "ArrowUp") {
        this.viewerContainer.scrollBy({ top: -400, behavior: "smooth" });
      }
    });

    zoomIn.addEventListener("click", () => {
      this.scale = Math.min(4, this.scale * 1.1);
      this.viewer?.setScale(this.scale);
      updateScaleLabel();
      if (scaleSelect) scaleSelect.value = String(this.scale);
    });
    zoomOut.addEventListener("click", () => {
      this.scale = Math.max(0.25, this.scale / 1.1);
      this.viewer?.setScale(this.scale);
      updateScaleLabel();
      if (scaleSelect) scaleSelect.value = String(this.scale);
    });
    if (scaleSelect) {
      scaleSelect.addEventListener("change", () => {
        const v = parseFloat(scaleSelect.value);
        if (!isNaN(v)) {
          this.scale = v;
          this.viewer?.setScale(v);
          updateScaleLabel();
        }
      });
    }
    const fitWidth = () => {
      const page = this.shadowRoot?.querySelector(
        ".pdf-page"
      ) as HTMLElement | null;
      const scroller = this.viewerContainer;
      if (!page) return;
      const padding = 32;
      const available = scroller.clientWidth - padding;
      const width = page.clientWidth || page.getBoundingClientRect().width;
      if (width > 0) {
        const newScale = (available / width) * this.scale;
        this.scale = Math.max(0.25, Math.min(4, newScale));
        this.viewer?.setScale(this.scale);
        updateScaleLabel();
        if (scaleSelect) scaleSelect.value = String(this.scale);
      }
    };
    const fitPage = () => {
      const page = this.shadowRoot?.querySelector(
        ".pdf-page"
      ) as HTMLElement | null;
      const scroller = this.viewerContainer;
      if (!page) return;
      const padding = 32;
      const available = scroller.clientHeight - padding;
      const height = page.clientHeight || page.getBoundingClientRect().height;
      if (height > 0) {
        const newScale = (available / height) * this.scale;
        this.scale = Math.max(0.25, Math.min(4, newScale));
        this.viewer?.setScale(this.scale);
        updateScaleLabel();
        if (scaleSelect) scaleSelect.value = String(this.scale);
      }
    };
    fitWidthBtn?.addEventListener("click", fitWidth);
    fitPageBtn?.addEventListener("click", fitPage);
    goPage.addEventListener("click", () => {
      const page = Math.max(1, parseInt(pageInput.value || "1", 10));
      this.viewer?.goToPage(page);
    });
    pageInput.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        const page = Math.max(1, parseInt(pageInput.value || "1", 10));
        this.viewer?.goToPage(page);
      }
    });
    pagePrev.addEventListener("click", () => {
      const next = Math.max(1, this.currentPage - 1);
      this.viewer?.goToPage(next);
    });
    pageNext.addEventListener("click", () => {
      const next = Math.min(
        this.totalPages || Number.MAX_SAFE_INTEGER,
        this.currentPage + 1
      );
      this.viewer?.goToPage(next);
    });
    let searchRaf = 0 as unknown as number;
    const doSearchNow = async () => {
      const q = searchInput.value.trim();
      if (!q) {
        this.searchHits = [];
        this.searchIndex = -1;
        this.viewer?.setSearchQuery("");
        if (searchCount) searchCount.textContent = "";
        this.viewer?.goToPage(1);
        return;
      }
      if (!this.viewer) return;
      this.viewer.setSearchQuery(q);
      const [hits, totalCount] = await Promise.all([
        this.viewer.search(q),
        this.viewer.countOccurrences(q),
      ]);
      this.searchHits = hits;
      this.searchIndex = this.searchHits.length > 0 ? 0 : -1;
      if (searchCount) searchCount.textContent = String(totalCount);
      if (this.searchIndex >= 0)
        this.viewer.goToPage(this.searchHits[this.searchIndex]);
    };
    const doSearch = () => {
      if (searchRaf) cancelAnimationFrame(searchRaf);
      searchRaf = requestAnimationFrame(() => {
        void doSearchNow();
      });
    };
    searchInput.addEventListener("change", () => {
      void doSearch();
    });
    searchInput.addEventListener("input", () => {
      void doSearch();
    });
    searchInput.addEventListener("keydown", (e) => {
      if ((e as KeyboardEvent).key === "Enter") {
        e.preventDefault();
        if (this.searchHits.length === 0) {
          void doSearchNow();
        } else {
          // Go to next result
          this.searchIndex = (this.searchIndex + 1) % this.searchHits.length;
          this.viewer?.goToPage(this.searchHits[this.searchIndex]);
        }
      }
    });
    searchNext.addEventListener("click", () => {
      if (this.searchHits.length === 0 || !this.viewer) return;
      this.searchIndex = (this.searchIndex + 1) % this.searchHits.length;
      this.viewer.goToPage(this.searchHits[this.searchIndex]);
    });
    searchPrev.addEventListener("click", () => {
      if (this.searchHits.length === 0 || !this.viewer) return;
      this.searchIndex =
        (this.searchIndex - 1 + this.searchHits.length) %
        this.searchHits.length;
      this.viewer.goToPage(this.searchHits[this.searchIndex]);
    });

    // Track current page based on scroll position
    const onScroll = () => {
      if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
      this.scrollRaf = requestAnimationFrame(() => {
        const containerRect = this.viewerContainer.getBoundingClientRect();
        const pages = Array.from(
          this.viewerContainer.querySelectorAll(".ai-pdf-page")
        ) as HTMLElement[];
        if (pages.length === 0) return;
        let bestIdx = 1;
        let bestVisibility = -Infinity;
        for (const el of pages) {
          const rect = el.getBoundingClientRect();
          const visibleTop = Math.max(rect.top, containerRect.top);
          const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
          const visible = Math.max(0, visibleBottom - visibleTop);
          const idx = Number(el.dataset.index || "1");
          if (visible > bestVisibility) {
            bestVisibility = visible;
            bestIdx = idx;
          }
        }
        this.currentPage = bestIdx;
        pageInput.value = String(bestIdx);
      });
    };
    this.viewerContainer.addEventListener("scroll", onScroll, {
      passive: true,
    });

    updateScaleLabel();
  }

  attributeChangedCallback(
    name: string,
    _old: string | null,
    value: string | null
  ) {
    if (name === "src" && value && this.isConnected) {
      if (!this.viewerContainer) {
        this.pendingSrc = value;
        return;
      }
      this.initialize(value);
    }
    if (name === "scale" && value) {
      const newScale = Math.max(0.1, parseFloat(value));
      this.scale = newScale;
      this.viewer?.setScale(newScale);
    }
    if (name === "worker-src" && value) {
      setPdfJsWorkerSrc(value);
    }
  }

  disconnectedCallback() {
    this.viewer?.destroy();
  }

  private async initialize(src: string) {
    this.viewer?.destroy();
    const useDocumentScroll = this.hasAttribute("document-scroll");
    this.viewer = new PdfViewer({
      container: this.viewerContainer,
      src,
      scale: this.scale,
      scrollElement: useDocumentScroll
        ? (window as unknown as Window)
        : this.viewerContainer,
    });
    if (useDocumentScroll) {
      this.viewerContainer.style.position = "relative";
      this.viewerContainer.style.top = "0";
      (this.viewerContainer.style as any).bottom = "";
      this.viewerContainer.style.left = "0";
      this.viewerContainer.style.right = "0";
      this.viewerContainer.style.height = "auto";
      this.viewerContainer.style.overflow = "visible";
    }
    await this.viewer.load();
    try {
      this.totalPages = await this.viewer.getPageCount();
      const pageInput = this.shadow.getElementById(
        "pageInput"
      ) as HTMLInputElement;
      if (pageInput) pageInput.max = String(this.totalPages);
      const pageTotalEl = this.shadow.getElementById(
        "pageTotal"
      ) as HTMLSpanElement | null;
      if (pageTotalEl) pageTotalEl.textContent = `/ ${this.totalPages}`;
    } catch {}
    void this.viewer.preloadAllTexts().catch(() => {});
    if (this.hasAttribute("render-all")) {
      setTimeout(() => {
        void this.viewer?.renderAllPages();
      }, 0);
    }
  }
}

customElements.define("pdf-viewer", PdfViewerElement);
