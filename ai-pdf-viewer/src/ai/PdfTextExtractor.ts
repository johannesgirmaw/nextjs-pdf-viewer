import { getDocument } from "pdfjs-dist";

export async function extractPdfTextPages(
  src: string | Uint8Array
): Promise<string[]> {
  const task = getDocument(src as any);
  const pdf = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    const text = tc.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    pages.push(text);
  }
  return pages;
}
