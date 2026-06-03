import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import type { ExtractedFields, PersonFields, PolicyFields } from "./types";
import { s3GetBuffer, s3PutBuffer } from "./s3";

// ── Euro-prefixed financial field names ──────────────────────────────────────
// These fields had their hardcoded "€" removed from the template cells.
// We prepend "€ " here only when the value is non-empty, so empty cells stay blank.
const EURO_FIELDS = new Set([
  "gross_annual_salary",
  "net_monthly_income",
  "other_net_monthly_income",
  "total_net_monthly_income",
  "outgoing_mortgage",
  "outgoing_other_loans",
  "outgoing_life_savings_pension",
  "outgoing_regular_expenses",
  "outgoing_motor_travel",
  "outgoing_other",
  "outgoing_total",
]);

function euroFormat(key: string, value: string): string {
  if (!value) return "";
  return EURO_FIELDS.has(key) ? `€ ${value}` : value;
}

// ── Parse a currency string to a plain number ─────────────────────────────────
// Handles "€200,000.00", "200000", "€ 200,000" etc.
function parseCurrency(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[€,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

// ── Flatten helpers ───────────────────────────────────────────────────────────

/**
 * Flattens the nested ExtractedFields into a flat object for template1 (single-life view).
 * Uses life1 fields at the top level, and prefixes life2 fields with "life2_".
 */
function flattenForTemplate1(fields: ExtractedFields): Record<string, string> {
  const flat: Record<string, string> = {};

  // Policy fields — apply euro formatting for financial fields
  for (const [k, v] of Object.entries(fields.policy as PolicyFields)) {
    flat[k] = euroFormat(k, v ?? "");
  }

  // Life1 fields — no prefix
  for (const [k, v] of Object.entries(fields.life1 as PersonFields)) {
    flat[k] = v ?? "";
  }

  // Life2 fields — prefixed with "life2_"
  for (const [k, v] of Object.entries(fields.life2 as PersonFields)) {
    flat[`life2_${k}`] = v ?? "";
  }

  // ── Derived / computed fields ──────────────────────────────────────────────

  // Employment Details section uses {employment_occupation} — map from life1.occupation
  // For dual life, combine both occupations; for single life just use life1
  const occ1 = fields.life1.occupation ?? "";
  const occ2 = fields.life2.occupation ?? "";
  if (occ1 && occ2) {
    flat["employment_occupation"] = `${occ1} / ${occ2}`;
  } else {
    flat["employment_occupation"] = occ1 || occ2;
  }

  // Total Life Cover = sum of life1 + life2 cover amounts
  const cover1 = parseCurrency(fields.policy.life_cover_amount ?? "");
  const cover2 = parseCurrency(fields.policy.life_cover_amount_life2 ?? "");
  const totalCover = cover1 + cover2;
  if (totalCover > 0) {
    flat["cover_total_life"] = `€${totalCover.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    flat["cover_total_life"] = "";
  }

  return flat;
}

/**
 * Flattens for template2 (Income Protection letter).
 * {name}    → "Life1 Name & Life2 Name" for dual life, "Life1 Name" for single
 * {address} → life1 address
 * {dob}     → life1 dob
 */
function flattenForTemplate2(fields: ExtractedFields): Record<string, string> {
  const base = flattenForTemplate1(fields);

  const name1 = fields.life1.name ?? "";
  const name2 = fields.life2.name ?? "";

  // Combined name for dual life
  base["name"] = name1 && name2 ? `${name1} & ${name2}` : name1 || name2;

  return base;
}

/**
 * Flattens for template3 (Statement of Suitability).
 * {name}              → "Life1 Name & Life2 Name" for dual life
 * {life_cover_amount} → combined cover (life1 + life2) when dual life
 * {address}           → life1 address
 * {signature_date}    → policy signature date
 * {term}              → policy term (digits only, e.g. "30" from "30 years")
 * {premium}           → empty unless extracted
 */
function flattenForTemplate3(fields: ExtractedFields): Record<string, string> {
  const base = flattenForTemplate1(fields);

  const name1 = fields.life1.name ?? "";
  const name2 = fields.life2.name ?? "";

  // Combined name for dual life
  base["name"] = name1 && name2 ? `${name1} & ${name2}` : name1 || name2;

  // Combined life cover for template3's {life_cover_amount} placeholder
  const cover1 = parseCurrency(fields.policy.life_cover_amount ?? "");
  const cover2 = parseCurrency(fields.policy.life_cover_amount_life2 ?? "");
  const totalCover = cover1 + cover2;
  if (totalCover > 0) {
    base["life_cover_amount"] = totalCover.toLocaleString("en-IE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    base["life_cover_amount"] = "";
  }

  // term — strip " years" suffix so template renders "30-year" cleanly
  const rawTerm = fields.policy.term ?? "";
  base["term"] = rawTerm.replace(/\s*years?/i, "").trim();

  return base;
}

// ── Core fill function ────────────────────────────────────────────────────────

async function fillTemplate(
  templateKey: string,
  data: Record<string, string>,
  outputKey: string
): Promise<string> {
  const templateBuffer = await s3GetBuffer(templateKey);

  const zip = new PizZip(templateBuffer);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Suppress errors for missing tags so a missing placeholder doesn't crash
    nullGetter() {
      return "";
    },
  });

  doc.render(data);

  const outputBuffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  }) as Buffer;

  await s3PutBuffer(
    outputKey,
    outputBuffer,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );

  return outputKey;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fillDocx(
  fields: ExtractedFields
): Promise<{ key1: string; key2: string; key3: string }> {
  const timestamp = Date.now();

  const [key1, key2, key3] = await Promise.all([
    fillTemplate(
      "templates/template.docx",
      flattenForTemplate1(fields),
      `output/filled_${timestamp}_1.docx`
    ),
    fillTemplate(
      "templates/template2.docx",
      flattenForTemplate2(fields),
      `output/filled_${timestamp}_2.docx`
    ),
    fillTemplate(
      "templates/template3.docx",
      flattenForTemplate3(fields),
      `output/filled_${timestamp}_3.docx`
    ),
  ]);

  return { key1, key2, key3 };
}
