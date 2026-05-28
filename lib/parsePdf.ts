import pdfParse from "pdf-parse";

/**
 * Extracts raw text from a PDF buffer using pdf-parse v1.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}
