import type { AiEmbedder } from "./Embeddings";
import { VectorStore } from "./VectorStore";

export type LlmGenerateFn = (prompt: string) => Promise<string>;

export type RagEngineOptions = {
  embedder: AiEmbedder;
  llm?: LlmGenerateFn; // Optional; user can plug any provider
  store?: VectorStore; // Optional; falls back to in-memory store
};

export class RagEngine {
  private embedder: AiEmbedder;
  private llm: LlmGenerateFn | null;
  private store: VectorStore;

  constructor(options: RagEngineOptions) {
    this.embedder = options.embedder;
    this.llm = options.llm ?? null;
    this.store = options.store ?? new VectorStore();
  }

  get vectorStore(): VectorStore {
    return this.store;
  }

  async indexTexts(
    texts: string[],
    metadatas?: Record<string, unknown>[]
  ): Promise<void> {
    const embeddings = await this.embedder.embedDocuments(texts);
    const records = texts.map((text, i) => ({
      id: `${this.store.size() + i}`,
      text,
      embedding: embeddings[i],
      metadata: metadatas?.[i],
    }));
    this.store.add(records);
  }

  async querySimilar(
    query: string,
    k = 5
  ): Promise<{ text: string; metadata?: Record<string, unknown> }[]> {
    const [embedding] = await this.embedder.embedDocuments([query]);
    const hits = this.store.search(embedding, k);
    return hits.map((h) => ({ text: h.text, metadata: h.metadata }));
  }

  async answerQuestion(question: string, k = 5): Promise<string> {
    if (!this.llm) {
      return "No LLM configured. Provide an llm(prompt) => Promise<string> function in RagEngineOptions.";
    }
    const contexts = await this.querySimilar(question, k);
    const contextText = contexts
      .map((c, i) => `# Chunk ${i + 1}\n${c.text}`)
      .join("\n\n");
    const prompt = `You are a helpful assistant answering strictly from the provided PDF context.\n\nContext:\n${contextText}\n\nQuestion: ${question}\n\nAnswer (cite chunk numbers if relevant):`;
    return this.llm(prompt);
  }

  async summarize(k = 10): Promise<string> {
    if (!this.llm) {
      return "No LLM configured. Provide an llm(prompt) => Promise<string> function in RagEngineOptions.";
    }
    // Take a sample of top-k longest chunks as context
    const all = (this.store as any).records as { text: string }[];
    const sample = [...all]
      .sort((a, b) => (b.text?.length ?? 0) - (a.text?.length ?? 0))
      .slice(0, k)
      .map((c, i) => `# Chunk ${i + 1}\n${c.text}`)
      .join("\n\n");
    const prompt = `Write a concise, faithful summary of the following PDF content.\nKeep it under 8 bullet points.\n\n${sample}`;
    return this.llm(prompt);
  }
}
