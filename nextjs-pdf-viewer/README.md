# nextjs-pdf-viewer

Professional, framework-agnostic PDF viewer with smooth rendering, accurate zoom-proof highlights, and full-text search. Ships as a web component and a programmatic API. Optimized for Next.js but works with any bundler.

## Live Demo

Try it here: https://nextjs-pdf-viewer-git-main-yohannesgs-projects.vercel.app/

## Contributing & Feedback

We welcome issues, discussions, and pull requests.

- Feedback/ideas: open a GitHub Discussion or Issue with the label `enhancement`.
- Bug reports: include steps to reproduce, expected vs actual behavior, browser/OS, and logs/screenshots.
- PRs: small, focused changes are best. Add context to the description and link related issues.

Development quick start:

```bash
git clone https://github.com/yourusername/nextjs-pdf-viewer.git
cd nextjs-pdf-viewer
npm install
npm run dev   # watch builds to dist/
```

Coding guidelines:

- Keep code readable, avoid deep nesting, prefer early returns.
- Strongly typed APIs; avoid `any` in public surfaces.
- Only meaningful comments; avoid obvious ones.
- Verify no linter/type errors. Keep bundle size reasonable.

[![npm version](https://badge.fury.io/js/ai-pdf-viewer.svg)](https://badge.fury.io/js/ai-pdf-viewer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

## Features

- ✅ **Smooth virtualized rendering** using `pdfjs-dist`
- ✅ **Zoom-proof text highlighting** (50%–300%+) with exact character-level precision
- ✅ **Full-text search** across all pages with live result count
- ✅ **Modern UI**: grouped controls, zoom dropdown, Fit width/page buttons
- ✅ **Keyboard shortcuts**: Ctrl/Cmd +/− (zoom), Ctrl/Cmd F (search), PageUp/Down, Enter (next result)
- ✅ **Document-level scrolling** with `document-scroll` attribute
- ✅ **Web component** `<pdf-viewer>` and **programmatic API**
- ✅ **TypeScript**, ESM/CJS builds, npm-installable
- ✅ **Zero dependencies** (except pdfjs-dist)
- ✅ **Framework agnostic** - works with React, Vue, Angular, vanilla JS

## Install

```bash
npm install nextjs-pdf-viewer pdfjs-dist
```

## Usage

### Web Component (vanilla HTML)

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="importmap">
      {
        "imports": {
          "pdfjs-dist": "https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.mjs"
        }
      }
    </script>
  </head>
  <body>
    <pdf-viewer
      src="/example.pdf"
      worker-src="https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs"
      style="height: 100vh; width: 100%"
    ></pdf-viewer>

    <script type="module">
      import "/node_modules/nextjs-pdf-viewer/dist/web-component/index.js";
    </script>
  </body>
</html>
```

### Next.js (App Router)

```tsx
// app/page.tsx
"use client";
import { useEffect } from "react";

export default function Page() {
  useEffect(() => {
    import("nextjs-pdf-viewer/dist/web-component/index.js");
  }, []);
  return (
    <pdf-viewer
      src="/file.pdf"
      worker-src="https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs"
      style={{ display: "block", height: "100vh", width: "100%" }}
    />
  );
}
```

### Web Component Attributes

- `src` — PDF URL or path
- `worker-src` — PDF.js worker URL (required)
- `scale` — Initial zoom (default: 1.0)
- `document-scroll` — Use window scrollbar instead of container scroll
- `render-all` — Render all pages on load (disables virtualization)

### Features

**Search:**

- Type in the search box; highlights appear on all pages
- Press Enter or click Next/Prev to navigate between result pages
- Clear the search to remove highlights and return to page 1
- Live count shows total matches

**Navigation:**

- Use ◀ ▶ buttons or Page input + Go/Enter
- Prev/Next buttons cycle through search results
- Keyboard: PageUp/PageDown, Arrow keys

**Zoom:**

- Click + / − buttons
- Select from dropdown (50%–300%)
- Fit width / Fit page buttons
- Keyboard: Ctrl/Cmd + +/−

### Programmatic API

```ts
import { PdfViewer, setPdfJsWorkerSrc } from "nextjs-pdf-viewer";

setPdfJsWorkerSrc(
  "https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs"
);

const viewer = new PdfViewer({
  container: document.getElementById("root")!,
  src: "/example.pdf",
  scale: 1,
});

await viewer.load();

// API methods
viewer.setScale(1.5);
viewer.goToPage(5);
const hits = await viewer.search("evaluation");
const count = await viewer.countOccurrences("evaluation");
viewer.setSearchQuery("evaluation"); // triggers highlights
await viewer.renderAllPages(); // render all pages (no virtualization)
```

## Development

```bash
git clone https://github.com/yourusername/nextjs-pdf-viewer.git
cd nextjs-pdf-viewer
npm install
npm run build    # Build library
npm run dev      # Watch mode
npm run typecheck
```

## Browser Compatibility

- Modern browsers with ES2020+ support
- Requires native ES modules or a bundler
- Works with Vite, Webpack, Rollup, esbuild, Next.js

## Troubleshooting

- 404 for PDF: ensure `src` points to a reachable path (e.g., `/public/file.pdf` in Next.js)
- PDF.js worker: set `worker-src` to a valid URL (CDN or self-hosted)
- CORS: when loading remote PDFs, allow cross-origin or proxy via your server

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/nextjs-pdf-viewer.git`
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm run typecheck`
6. Build: `npm run build`
7. Submit a pull request

## Roadmap

- [ ] Add text layer support for better accessibility
- [ ] Add annotation support
- [ ] Add print functionality
- [ ] Add more customization options
- [ ] Add React/Vue/Angular specific examples
- [ ] Add unit tests

## License

MIT © [Yohannes](https://github.com/yohannes)

## Acknowledgments

- Built on top of [PDF.js](https://mozilla.github.io/pdf.js/) by Mozilla
- Inspired by modern PDF viewer implementations
