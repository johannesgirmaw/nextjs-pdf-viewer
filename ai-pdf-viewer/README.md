# ai-pdf-viewer

🌟 World-class AI-powered PDF viewer for the web with zoom-proof search highlighting.

## Features

- ✅ **Smooth virtualized rendering** using `pdfjs-dist`
- ✅ **Zoom-proof text highlighting** (50%–300%+) with exact character-level precision
- ✅ **Full-text search** across all pages with live result count
- ✅ **Modern UI**: grouped controls, zoom dropdown, Fit width/page buttons
- ✅ **Keyboard shortcuts**: Ctrl/Cmd +/− (zoom), Ctrl/Cmd F (search), PageUp/Down, Enter (next result)
- ✅ **Document-level scrolling** with `document-scroll` attribute
- ✅ **Web component** `<ai-pdf-viewer>` and **programmatic API**
- ✅ **AI-ready**: embeddings, vector store, RAG engine (Q&A, summarization)
- ✅ **TypeScript**, ESM/CJS builds, npm-installable

## Install

```bash
npm install ai-pdf-viewer pdfjs-dist
# Optional for AI features:
npm install @tensorflow/tfjs @tensorflow-models/universal-sentence-encoder
```

## Quick Start (Web Component)

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
    <ai-pdf-viewer
      src="/example.pdf"
      worker-src="https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs"
      style="height: 100vh; width: 100%"
    ></ai-pdf-viewer>

    <script type="module">
      import "/node_modules/ai-pdf-viewer/dist/web-component/index.js";
    </script>
  </body>
</html>
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

## Programmatic API

```ts
import { PdfViewer, setPdfJsWorkerSrc } from "ai-pdf-viewer";

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

## AI: Embeddings + RAG

```ts
import { UseEmbedder, RagEngine, extractPdfTextPages } from "ai-pdf-viewer/ai";

const embedder = new UseEmbedder();
const engine = new RagEngine({
  embedder,
  llm: async (prompt) => {
    // Plug any LLM provider (OpenAI, Anthropic, local model, etc.)
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    return await res.text();
  },
});

// Index PDF pages
const pages = await extractPdfTextPages("/example.pdf");
await engine.indexTexts(pages.map((t, i) => `Page ${i + 1}: ${t}`));

// Ask questions
const answer = await engine.answerQuestion("What is the main conclusion?");
console.log(answer);

// Summarize
const summary = await engine.summarize();
console.log(summary);

// Semantic search
const similar = await engine.querySimilar("evaluation metrics", 5);
console.log(similar);
```

## Advanced: Server-side LLM Proxy

**NEVER expose API keys in client-side code.** Use a server proxy:

```js
// server.js (Node/Express)
import express from "express";

const app = express();
app.use(express.json());

app.post("/api/llm", async (req, res) => {
  const { prompt } = req.body;
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    }),
  });
  const json = await resp.json();
  res.send(json.choices?.[0]?.message?.content ?? "");
});

app.listen(3000);
```

Then in your client code, call `/api/llm` as shown in the RAG example above.

## Development

```bash
cd ai-pdf-viewer
npm install
npm run build    # Build library
npm run dev      # Watch mode
npm run typecheck
```

## Browser Compatibility

- Modern browsers with ES2020+ support
- Requires native ES modules or a bundler
- Works with Vite, Webpack, Rollup, esbuild

## License

MIT
