import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ExtractedFields } from "./types";
import { s3GetBuffer, s3PutBuffer } from "./s3";

/**
 * Fills a single DOCX template fetched from S3 and uploads the result back to S3.
 * @returns The S3 key of the generated file.
 */
async function fillTemplate(
  templateKey: string,
  fields: ExtractedFields,
  outputKey: string
): Promise<string> {
  // Read template from S3
  const templateBuffer = await s3GetBuffer(templateKey);

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
  }) as Buffer;

  // Write generated file to S3
  await s3PutBuffer(
    outputKey,
    outputBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  return outputKey;
}

/**
 * Fills both template.docx and template2.docx with the extracted fields.
 * Templates are read from S3 under the "templates/" prefix.
 * @returns S3 keys for both generated files.
 */
export async function fillDocx(
  fields: ExtractedFields
): Promise<{ key1: string; key2: string }> {
  const timestamp = Date.now();

  const [key1, key2] = await Promise.all([
    fillTemplate(
      "templates/template.docx",
      fields,
      `output/filled_${timestamp}_1.docx`
    ),
    fillTemplate(
      "templates/template2.docx",
      fields,
      `output/filled_${timestamp}_2.docx`
    ),
  ]);

  return { key1, key2 };
}
