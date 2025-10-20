// Core PDF viewer with simple virtualization using IntersectionObserver and canvas rendering.
// Relies on pdfjs-dist v4+. Text layer is optional and will be added in a later task.

import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";

export type PdfViewerOptions = {
  container: HTMLElement;
  src: string | Uint8Array;
  scale?: number;
  pageGap?: number;
  workerSrc?: string;
  scrollElement?: HTMLElement | Window;
};

export function setPdfJsWorkerSrc(workerSrc: string): void {
  GlobalWorkerOptions.workerSrc = workerSrc as any;
}

export class PdfViewer {
  private container: HTMLElement;
  private src: string | Uint8Array;
  private scale: number;
  private pageGap: number;

  private pdfDoc: any | null = null;
  private pagesWrapper: HTMLElement;
  private scrollElement: HTMLElement | Window;
  private observer: IntersectionObserver | null = null;
  private renderedCanvases: Map<number, HTMLCanvasElement> = new Map();
  private pageTextCache: Map<number, string> = new Map();
  private pageTextItems: Map<number, any[]> = new Map();
  private highlightLayers: Map<number, HTMLElement> = new Map();
  private currentQuery: string = "";
  private currentQueryLower: string = "";
  private textLayerContainers: Map<number, HTMLElement> = new Map();
  private textLayerDivs: Map<number, HTMLElement[]> = new Map();
  private isHighlightingAll = false;

  private estimatedPageHeight = 800; // Updated after first page is measured
  private isDestroyed = false;
  private scrollRaf = 0 as unknown as number;

  constructor(options: PdfViewerOptions) {
    this.container = options.container;
    this.src = options.src;
    this.scale = options.scale ?? 1.0;
    this.pageGap = options.pageGap ?? 16;
    this.scrollElement = options.scrollElement ?? options.container;

    if (options.workerSrc) {
      setPdfJsWorkerSrc(options.workerSrc);
    }

    this.container.style.overflow = "auto";
    this.container.style.position = "relative";

    this.pagesWrapper = document.createElement("div");
    this.pagesWrapper.style.position = "relative";
    this.pagesWrapper.style.width = "fit-content";
    this.pagesWrapper.style.margin = "0 auto";
    this.container.appendChild(this.pagesWrapper);
  }

  async load(): Promise<void> {
    const loadingTask = getDocument(this.src as any);
    this.pdfDoc = await loadingTask.promise;
    if (this.isDestroyed) return;

    const numPages: number = this.pdfDoc.numPages as number;

    // Measure first page to estimate sizes.
    const firstPage = await this.pdfDoc.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: this.scale });
    this.estimatedPageHeight = firstViewport.height;

    // Create placeholders
    for (let i = 1; i <= numPages; i++) {
      const placeholder = document.createElement("div");
      placeholder.className = "ai-pdf-page";
      placeholder.dataset.index = String(i);
      placeholder.style.position = "relative";
      placeholder.style.width = `${firstViewport.width}px`;
      placeholder.style.height = `${this.estimatedPageHeight}px`;
      placeholder.style.margin = `${i === 1 ? 0 : this.pageGap}px 0 0 0`;
      placeholder.style.background = "#fff";
      placeholder.style.boxShadow = "0 1px 4px rgba(0,0,0,0.1)";
      placeholder.style.borderRadius = "4px";
      this.pagesWrapper.appendChild(placeholder);
    }

    this.setupObserver();
    // Eagerly render first few pages to seed viewport
    const eager = Math.min(3, numPages);
    for (let i = 1; i <= eager; i++) {
      void this.renderPage(i);
    }
    // Fallback: proactively render visible pages on scroll
    const se: any = this.scrollElement as any;
    if (se && se.addEventListener) {
      se.addEventListener("scroll", this.onScroll, { passive: true });
    }
    this.renderVisiblePages();
  }

  private setupObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    const root = this.container;
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const index = Number(el.dataset.index);
          if (entry.isIntersecting) {
            void this.renderPage(index);
          }
        }
      },
      {
        root,
        rootMargin: "800px 0px",
        threshold: 0.01,
      }
    );

    for (const child of Array.from(this.pagesWrapper.children)) {
      this.observer.observe(child as Element);
    }
  }

  private async renderPage(pageNumber: number): Promise<void> {
    if (this.isDestroyed || !this.pdfDoc) return;
    if (this.renderedCanvases.has(pageNumber)) return;

    const placeholder = this.pagesWrapper.querySelector(
      `.ai-pdf-page[data-index="${pageNumber}"]`
    ) as HTMLElement | null;
    if (!placeholder) return;

    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });

    // Update placeholder size to actual page size
    placeholder.style.width = `${viewport.width}px`;
    placeholder.style.height = `${viewport.height}px`;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const outputScale = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);

    await page.render({ canvasContext: ctx as any, viewport } as any).promise;
    placeholder.innerHTML = "";
    placeholder.appendChild(canvas);
    // Create highlight layer overlay
    const hl = document.createElement("div");
    hl.className = "ai-highlight-layer";
    hl.style.position = "absolute";
    hl.style.left = "0";
    hl.style.top = "0";
    hl.style.width = `${viewport.width}px`;
    hl.style.height = `${viewport.height}px`;
    hl.style.pointerEvents = "none";
    hl.style.zIndex = "1";
    hl.style.overflow = "visible";
    placeholder.appendChild(hl);
    this.highlightLayers.set(pageNumber, hl);
    // Create text layer container overlay for precise glyph positioning
    const tl = document.createElement("div");
    tl.className = "textLayer";
    tl.style.position = "absolute";
    tl.style.left = "0";
    tl.style.top = "0";
    tl.style.width = `${viewport.width}px`;
    tl.style.height = `${viewport.height}px`;
    tl.style.pointerEvents = "none";
    tl.style.opacity = "0";
    tl.style.zIndex = "0";
    placeholder.appendChild(tl);
    this.textLayerContainers.set(pageNumber, tl);
    this.renderedCanvases.set(pageNumber, canvas);

    // Preload text content and create simple text layer manually (no pdf_viewer.mjs)
    void (async () => {
      try {
        await this.ensurePageText(pageNumber);
        const tc = await page.getTextContent();
        const items = (tc.items as any[]) || [];
        this.pageTextItems.set(pageNumber, items);
        // Manually render text spans using transform data
        const spans: HTMLElement[] = [];
        for (const item of items) {
          const str = item.str ?? "";
          if (!str) continue;
          const tr = item.transform as number[];
          const span = document.createElement("span");
          span.textContent = str;
          span.style.position = "absolute";
          span.style.left = `${tr[4]}px`;
          span.style.bottom = `${tr[5]}px`;
          span.style.fontSize = `${Math.hypot(tr[2], tr[3])}px`;
          span.style.fontFamily = (item.fontName as string) || "sans-serif";
          span.style.whiteSpace = "pre";
          span.style.transformOrigin = "0% 0%";
          const angle = Math.atan2(tr[1], tr[0]);
          const scaleX = Math.hypot(tr[0], tr[1]);
          const scaleY = Math.hypot(tr[2], tr[3]);
          if (angle !== 0 || scaleX !== 1) {
            const a = Math.cos(angle) * scaleX;
            const b = Math.sin(angle) * scaleX;
            const c = -Math.sin(angle) * scaleY;
            const d = Math.cos(angle) * scaleY;
            span.style.transform = `matrix(${a},${b},${c},${d},0,0)`;
          }
          tl.appendChild(span);
          spans.push(span);
        }
        this.textLayerDivs.set(pageNumber, spans);
        if (this.currentQuery) this.applyHighlights(pageNumber);
      } catch {}
    })();
  }

  private async renderTextLayerForPage(pageNumber: number): Promise<void> {
    if (!this.pdfDoc) return;
    const placeholder = this.pagesWrapper.querySelector(
      `.ai-pdf-page[data-index="${pageNumber}"]`
    ) as HTMLElement | null;
    if (!placeholder) return;
    // Create missing highlight layer if not present
    let hl = this.highlightLayers.get(pageNumber);
    const page = await this.pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: this.scale });
    if (!hl) {
      hl = document.createElement("div");
      hl.className = "ai-highlight-layer";
      hl.style.position = "absolute";
      hl.style.left = "0";
      hl.style.top = "0";
      hl.style.width = `${viewport.width}px`;
      hl.style.height = `${viewport.height}px`;
      hl.style.pointerEvents = "none";
      placeholder.appendChild(hl);
      this.highlightLayers.set(pageNumber, hl);
    }
    if (this.textLayerDivs.has(pageNumber)) return;
    let tl = this.textLayerContainers.get(pageNumber);
    if (!tl) {
      tl = document.createElement("div");
      tl.className = "textLayer";
      tl.style.position = "absolute";
      tl.style.left = "0";
      tl.style.top = "0";
      tl.style.width = `${viewport.width}px`;
      tl.style.height = `${viewport.height}px`;
      tl.style.pointerEvents = "none";
      placeholder.appendChild(tl);
      this.textLayerContainers.set(pageNumber, tl);
    }
    const tc = await page.getTextContent();
    const items = (tc.items as any[]) || [];
    this.pageTextItems.set(pageNumber, items);
    // Manually render text spans using transform data
    const spans: HTMLElement[] = [];
    for (const item of items) {
      const str = item.str ?? "";
      if (!str) continue;
      const tr = item.transform as number[];
      const span = document.createElement("span");
      span.textContent = str;
      span.style.position = "absolute";
      span.style.left = `${tr[4]}px`;
      span.style.bottom = `${tr[5]}px`;
      span.style.fontSize = `${Math.hypot(tr[2], tr[3])}px`;
      span.style.fontFamily = (item.fontName as string) || "sans-serif";
      span.style.whiteSpace = "pre";
      span.style.transformOrigin = "0% 0%";
      const angle = Math.atan2(tr[1], tr[0]);
      const scaleX = Math.hypot(tr[0], tr[1]);
      const scaleY = Math.hypot(tr[2], tr[3]);
      if (angle !== 0 || scaleX !== 1) {
        const a = Math.cos(angle) * scaleX;
        const b = Math.sin(angle) * scaleX;
        const c = -Math.sin(angle) * scaleY;
        const d = Math.cos(angle) * scaleY;
        span.style.transform = `matrix(${a},${b},${c},${d},0,0)`;
      }
      tl.appendChild(span);
      spans.push(span);
    }
    this.textLayerDivs.set(pageNumber, spans);
    if (this.currentQuery) this.applyHighlights(pageNumber);
  }

  // Public API: force-render all pages (non-virtualized). Useful when the caller
  // wants the complete document visible at once. Concurrency limits avoid main-thread jank.
  async renderAllPages(concurrency = 4): Promise<void> {
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    const total = this.pdfDoc.numPages as number;
    const queue: number[] = [];
    for (let i = 1; i <= total; i++) queue.push(i);
    const workers: Promise<void>[] = [];
    for (let w = 0; w < Math.max(1, concurrency); w++) {
      workers.push(
        (async () => {
          while (queue.length) {
            const n = queue.shift();
            if (!n) break;
            await this.renderPage(n);
          }
        })()
      );
    }
    await Promise.all(workers);
  }

  private onScroll = (): void => {
    if (this.scrollRaf) cancelAnimationFrame(this.scrollRaf);
    this.scrollRaf = requestAnimationFrame(() => this.renderVisiblePages());
  };

  private renderVisiblePages(): void {
    const viewportH = this.getViewportRect().height || 800;
    const buffer = Math.max(1200, viewportH * 2); // dynamic buffer for zoomed-out cases
    const containerRect = this.getViewportRect();
    const extendedTop = containerRect.top - buffer;
    const extendedBottom = containerRect.bottom + buffer;
    const children = Array.from(this.pagesWrapper.children) as HTMLElement[];
    let maxVisibleIndex = 0;
    for (const el of children) {
      const rect = el.getBoundingClientRect();
      const isVisible =
        rect.bottom >= extendedTop && rect.top <= extendedBottom;
      if (!isVisible) continue;
      const index = Number(el.dataset.index || "0");
      if (index > 0) void this.renderPage(index);
      if (index > maxVisibleIndex) maxVisibleIndex = index;
    }
    if (maxVisibleIndex > 0 && this.pdfDoc) {
      const total = this.pdfDoc.numPages as number;
      for (
        let i = maxVisibleIndex + 1;
        i <= Math.min(total, maxVisibleIndex + 2);
        i++
      ) {
        void this.renderPage(i);
      }
    }
  }

  setScale(scale: number): void {
    if (scale <= 0) return;
    const root = this.container;
    const isWindow = this.scrollElement === (window as unknown as Window);
    const scrollRatio = isWindow
      ? (window.scrollY || 0) /
        Math.max(
          1,
          (document.documentElement?.scrollHeight || 1) -
            (window.innerHeight || 1)
        )
      : root.scrollTop / Math.max(1, root.scrollHeight - root.clientHeight);
    this.scale = scale;

    // Reset and rerender lazily
    for (const [index, canvas] of this.renderedCanvases.entries()) {
      const parent = canvas.parentElement;
      if (parent) parent.innerHTML = "";
      this.renderedCanvases.delete(index);
    }
    // Clear highlight and text caches so positions are recomputed at new scale
    this.highlightLayers.clear();
    this.pageTextItems.clear();
    // Remove text layers to re-render at new scale
    for (const [page, tl] of this.textLayerContainers.entries()) {
      tl.remove();
    }
    this.textLayerContainers.clear();
    this.textLayerDivs.clear();

    // Update placeholder sizes to the new scale using first page as estimate
    void (async () => {
      if (!this.pdfDoc) return;
      const firstPage = await this.pdfDoc.getPage(1);
      const vp = firstPage.getViewport({ scale: this.scale });
      for (const child of Array.from(this.pagesWrapper.children)) {
        const el = child as HTMLElement;
        el.style.width = `${vp.width}px`;
        el.style.height = `${vp.height}px`;
      }
    })();

    // Retrigger observer to render visible pages at new scale
    this.setupObserver();
    if (isWindow) {
      const total =
        (document.documentElement?.scrollHeight || 1) -
        (window.innerHeight || 1);
      window.scrollTo({ top: scrollRatio * total });
    } else {
      root.scrollTop = scrollRatio * (root.scrollHeight - root.clientHeight);
    }
    this.renderVisiblePages();
    // If a search is active, re-render text layers and highlights in the background
    if (this.currentQuery) {
      void (async () => {
        if (!this.pdfDoc) return;
        const total = this.pdfDoc.numPages as number;
        for (let i = 1; i <= total; i++) {
          await this.renderTextLayerForPage(i);
        }
      })();
    }
  }

  async getPageCount(): Promise<number> {
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    return this.pdfDoc.numPages as number;
  }

  private async ensurePageText(pageNumber: number): Promise<string> {
    if (this.pageTextCache.has(pageNumber))
      return this.pageTextCache.get(pageNumber)!;
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    const page = await this.pdfDoc.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = (textContent.items as any[])
      .map((item) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    this.pageTextCache.set(pageNumber, text);
    return text;
  }

  async preloadAllTexts(
    onProgress?: (loaded: number, total: number) => void
  ): Promise<void> {
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    const total = this.pdfDoc.numPages as number;
    let loaded = 0;
    for (let i = 1; i <= total; i++) {
      await this.ensurePageText(i);
      loaded += 1;
      if (onProgress) onProgress(loaded, total);
    }
  }

  async search(
    query: string,
    options?: { caseSensitive?: boolean; normalizeAccents?: boolean }
  ): Promise<number[]> {
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    const normalize = (s: string) => {
      const base = options?.caseSensitive ? s : s.toLowerCase();
      return options?.normalizeAccents === false
        ? base
        : base.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
    };
    const normalizedQuery = normalize(query);
    const results: number[] = [];
    const total = this.pdfDoc.numPages as number;
    for (let i = 1; i <= total; i++) {
      const text = await this.ensurePageText(i);
      const hay = normalize(text);
      if (normalizedQuery && hay.includes(normalizedQuery)) results.push(i);
    }
    return results;
  }

  goToPage(pageNumber: number): void {
    if (!this.pdfDoc) return;
    const total = this.pdfDoc.numPages as number;
    const clamped = Math.max(1, Math.min(total, Math.floor(pageNumber)));
    const target = this.pagesWrapper.querySelector(
      `.ai-pdf-page[data-index="${clamped}"]`
    ) as HTMLElement | null;
    if (!target) return;
    if (this.scrollElement === (window as unknown as Window)) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      const containerRect = this.container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const delta = targetRect.top - containerRect.top;
      const top = this.container.scrollTop + delta;
      this.container.scrollTo({ top, behavior: "smooth" });
    }
    this.renderVisiblePages();
  }

  setSearchQuery(query: string): void {
    this.currentQuery = query || "";
    this.currentQueryLower = this.currentQuery.toLowerCase();
    // Clear all existing highlights first
    for (const overlay of this.highlightLayers.values()) {
      overlay.innerHTML = "";
    }
    if (!this.currentQuery) return;
    for (const pageNumber of this.renderedCanvases.keys()) {
      this.applyHighlights(pageNumber);
    }
    // Also highlight not-yet-rendered pages in the background
    void (async () => {
      if (!this.pdfDoc || !this.currentQuery || this.isHighlightingAll) return;
      this.isHighlightingAll = true;
      try {
        const total = this.pdfDoc.numPages as number;
        for (let i = 1; i <= total; i++) {
          if (!this.textLayerDivs.has(i)) {
            await this.renderTextLayerForPage(i);
          } else {
            this.applyHighlights(i);
          }
        }
      } finally {
        this.isHighlightingAll = false;
      }
    })();
  }

  private applyHighlights(pageNumber: number): void {
    const items = this.pageTextItems.get(pageNumber);
    const overlay = this.highlightLayers.get(pageNumber);
    const canvas = this.renderedCanvases.get(pageNumber);
    if (!this.currentQuery || !items || !overlay || !canvas) return;
    overlay.innerHTML = "";
    const query = this.currentQueryLower;
    // Get viewport info for proper scaling
    const pageWidth = canvas.clientWidth;
    const pageHeight = canvas.clientHeight;
    // Build a flat string from text items
    let combined = "";
    const itemMap: { start: number; end: number; item: any }[] = [];
    for (const it of items) {
      const str = (it.str ?? "") as string;
      const start = combined.length;
      combined += str;
      itemMap.push({ start, end: combined.length, item: it });
    }
    combined = combined.toLowerCase();
    if (!combined || !query) return;
    // Find all occurrences and paint boxes
    let pos = 0;
    while (true) {
      const idx = combined.indexOf(query, pos);
      if (idx === -1) break;
      const endIdx = idx + query.length;
      // Find items that contain this match
      for (const { start, end, item } of itemMap) {
        if (end <= idx || start >= endIdx) continue;
        const overlapStart = Math.max(start, idx);
        const overlapEnd = Math.min(end, endIdx);
        if (overlapStart >= overlapEnd) continue;
        const str = item.str ?? "";
        const tr = item.transform as number[];
        // Apply viewport scale from current rendering
        const x = tr[4] * this.scale;
        const y = tr[5] * this.scale;
        const fontHeight = Math.hypot(tr[2], tr[3]) * this.scale;
        const totalWidth =
          (item.width ?? Math.hypot(tr[0], tr[1]) * str.length) * this.scale;
        const charWidth = str.length > 0 ? totalWidth / str.length : totalWidth;
        const localStart = overlapStart - start;
        const localEnd = overlapEnd - start;
        const left = x + charWidth * localStart;
        const width = charWidth * (localEnd - localStart);
        const top = pageHeight - (y + fontHeight * 0.8);
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.left = `${left}px`;
        div.style.top = `${top}px`;
        div.style.width = `${width}px`;
        div.style.height = `${fontHeight}px`;
        div.style.background = "rgba(255, 235, 59, 0.45)";
        div.style.boxShadow = "0 0 0 1px rgba(255, 193, 7, 0.6) inset";
        overlay.appendChild(div);
      }
      pos = idx + Math.max(1, query.length);
    }
  }

  async countOccurrences(
    query: string,
    options?: { caseSensitive?: boolean; normalizeAccents?: boolean }
  ): Promise<number> {
    if (!this.pdfDoc) throw new Error("PDF not loaded");
    const normalize = (s: string) => {
      const base = options?.caseSensitive ? s : s.toLowerCase();
      return options?.normalizeAccents === false
        ? base
        : base.normalize("NFD").replace(/\p{Diacritic}+/gu, "");
    };
    const q = normalize(query);
    let total = 0;
    const pages = this.pdfDoc.numPages as number;
    for (let i = 1; i <= pages; i++) {
      const text = await this.ensurePageText(i);
      const hay = normalize(text);
      if (!q) continue;
      let idx = 0;
      while (true) {
        idx = hay.indexOf(q, idx);
        if (idx === -1) break;
        total += 1;
        idx += q.length;
      }
    }
    return total;
  }

  destroy(): void {
    this.isDestroyed = true;
    if (this.observer) this.observer.disconnect();
    const se: any = this.scrollElement as any;
    if (se && se.removeEventListener) {
      se.removeEventListener("scroll", this.onScroll);
    }
    this.renderedCanvases.clear();
    this.pagesWrapper.remove();
    this.pdfDoc = null;
  }

  private getViewportRect(): { top: number; bottom: number; height: number } {
    if (this.scrollElement === (window as unknown as Window)) {
      const top = 0;
      const height =
        window.innerHeight || document.documentElement?.clientHeight || 800;
      return { top, bottom: top + height, height };
    }
    const r = this.container.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height };
  }
}
