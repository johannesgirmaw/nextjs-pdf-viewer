# demo-nextjs-pdf-viewer

Minimal demo app showcasing the `nextjs-pdf-viewer` web component and API.

## Getting started

```bash
npm install
npm run dev      # start dev server (prints URL)
```

The demo loads a `<pdf-viewer>` and points to `public/file.pdf`. Replace it with your own file if needed.

## Contributing & Feedback (Demo)

This demo is meant to validate and showcase the library. If you find issues:

- Library bug: please open an issue in the library repo with a short reproduction.
- Demo-only bug: open an issue here; include steps, expected vs actual, and browser/OS.
- Feature ideas: describe your use case; screenshots/mockups help.

### Useful tips for reports
- Copy the browser console logs and network errors (404/worker errors are common misconfigs).
- Share the PDF (if possible) or describe special characteristics (fonts, very large pages, rotated text).
- Note your environment (browser, OS, device, zoom level).

## How this demo works

- `index.html`: defines an import map for `pdfjs-dist`, adds the `<pdf-viewer>` element.
- `src/main.js`: imports `nextjs-pdf-viewer/dist/web-component/index.js` to register the custom element.
- `public/file.pdf`: sample PDF served by the dev server.

### index.html snippet
```html
<pdf-viewer
  src="/public/file.pdf"
  worker-src="https://unpkg.com/pdfjs-dist@4.6.82/build/pdf.worker.min.mjs"
  document-scroll
  render-all
  style="width: 100%"
></pdf-viewer>
```

## Troubleshooting

- 404 for `/public/file.pdf`: ensure the PDF exists under `public/` and the path matches `src`.
- Worker not loading: verify the `worker-src` URL is reachable.
- Cross-origin PDFs: configure CORS or proxy via a backend.

## License

MIT




