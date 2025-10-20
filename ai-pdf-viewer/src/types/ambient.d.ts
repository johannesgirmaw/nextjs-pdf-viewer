declare module "@tensorflow-models/universal-sentence-encoder" {
  export type UniversalSentenceEncoder = {
    embed(
      texts: string[] | string
    ): Promise<{ array(): Promise<number[][]>; dispose(): void }>;
  };
  export function load(): Promise<UniversalSentenceEncoder>;
}
