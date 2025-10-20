export type VectorRecord = {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
};

export class VectorStore {
  private records: VectorRecord[] = [];

  add(records: Omit<VectorRecord, "id">[] | VectorRecord[]): void {
    for (const rec of records as VectorRecord[]) {
      const id = (rec as VectorRecord).id ?? `${this.records.length}`;
      this.records.push({
        id,
        text: rec.text,
        embedding: rec.embedding,
        metadata: rec.metadata,
      });
    }
  }

  size(): number {
    return this.records.length;
  }

  search(queryEmbedding: number[], k = 5): VectorRecord[] {
    if (this.records.length === 0) return [];
    const scored = this.records.map((r) => ({
      r,
      s: cosineSimilarity(queryEmbedding, r.embedding),
    }));
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, k).map((x) => x.r);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    const ai = a[i];
    const bi = b[i];
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
