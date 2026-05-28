import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import fs from "fs";
import path from "path";
import type { ExtractedFields } from "./types";

/**
 * Fills a single DOCX template and writes it to the output directory.
 * @returns The absolute path to the generated file.
 */
async function fillTemplate(
  templatePath: string,
  fields: ExtractedFields,
  outputFilename: string
): Promise<string> {
  if (!fs.existsSync(templatePath)) {
    throw new Error(`DOCX template not found at: ${templatePath}`);
  }

  const templateBuffer = fs.readFileSync(templatePath);
  const zip = new PizZip(templateBuffer);

  // Uses default single-brace delimiters: {tag}
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  doc.render(fields);

  const outputBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  const outputDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, outputFilename);
  fs.writeFileSync(outputPath, outputBuffer);
  return outputPath;
}

/**
 * Fills both template.docx and template2.docx with the extracted fields.
 * @returns Paths to both generated files.
 */
export async function fillDocx(
  fields: ExtractedFields
): Promise<{ path1: string; path2: string }> {
  const timestamp = Date.now();

  const path1 = await fillTemplate(
    path.join(process.cwd(), "templates", "template.docx"),
    fields,
    `filled_${timestamp}_1.docx`
  );

  const path2 = await fillTemplate(
    path.join(process.cwd(), "templates", "template2.docx"),
    fields,
    `filled_${timestamp}_2.docx`
  );

  return { path1, path2 };
}
