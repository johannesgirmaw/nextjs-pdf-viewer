import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "web-component/index": "src/web-component/index.ts",
    "ai/index": "src/ai/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  target: "es2020",
  splitting: false,
  treeshake: true,
  skipNodeModulesBundle: true,
  external: [
    "@tensorflow/tfjs",
    "@tensorflow-models/universal-sentence-encoder",
    "pdfjs-dist",
  ],
});
