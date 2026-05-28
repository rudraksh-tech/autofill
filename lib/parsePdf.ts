// pdf-parse v2.x exports a PDFParse class (not a default function)
import { PDFParse } from "pdf-parse";

/**
 * Extracts raw text from a PDF buffer using pdf-parse v2.
 */
export async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text;
}
