export interface AiEmbedder {
  embedDocuments(texts: string[]): Promise<number[][]>;
}

export class UseEmbedder implements AiEmbedder {
  private model: any | null = null;

  async ensureLoaded(): Promise<void> {
    if (this.model) return;
    const use = await import("@tensorflow-models/universal-sentence-encoder");
    this.model = await use.load();
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    await this.ensureLoaded();
    const embeddings = await this.model.embed(texts);
    const array = await embeddings.array();
    embeddings.dispose?.();
    return array as number[][];
  }
}
