/**
 * Injects {placeholder} tags into template3.docx (Statement of Suitability).
 *
 * Placeholders injected:
 *   {name}              → client name (after "Name: ")
 *   {address}           → client address (after "Address: ")
 *   {signature_date}    → date in header and body reference
 *   {term}              → policy term years (e.g. "30")
 *   {life_cover_amount} → lump sum cover amount (e.g. "€150,000")
 *   {premium}           → monthly premium (e.g. "€18.66")
 */

const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template3.docx");

const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// ── Helper: replace a pattern in the full XML string ─────────────────────────
function replacePattern(xmlStr, pattern, replacement) {
  const result = xmlStr.replace(pattern, replacement);
  if (result === xmlStr) {
    console.warn(`  WARNING: pattern not found: ${pattern}`);
  }
  return result;
}

console.log("\nInjecting placeholders into template3.docx...\n");

// ── 1. Name: "Name: " + space run + "Richelle " + "Acorin" ───────────────────
// Replace "Richelle " with "{name}" and clear "Acorin"
xml = replacePattern(
  xml,
  /<w:t xml:space="preserve">Richelle <\/w:t>/,
  '<w:t xml:space="preserve">{name} </w:t>'
);
console.log("  ✓ Injected {name} (replaced 'Richelle ')");

xml = replacePattern(
  xml,
  /<w:t>Acorin<\/w:t>/,
  "<w:t></w:t>"
);
console.log("  ✓ Cleared 'Acorin'");

// ── 2. Address: replace "38 Tobar " with "{address}" and clear subsequent parts
xml = replacePattern(
  xml,
  /<w:t xml:space="preserve">38 Tobar <\/w:t>/,
  '<w:t xml:space="preserve">{address}</w:t>'
);
console.log("  ✓ Injected {address} (replaced '38 Tobar ')");

xml = replacePattern(xml, /<w:t>Shéamais<\/w:t>/, "<w:t></w:t>");
console.log("  ✓ Cleared 'Shéamais'");

// Clear ", " separator after Shéamais
xml = replacePattern(
  xml,
  /(<w:t>Shéamais<\/w:t>[\s\S]*?)<w:t xml:space="preserve">, <\/w:t>/,
  '$1<w:t xml:space="preserve"></w:t>'
);

xml = replacePattern(xml, /<w:t>Letteragh<\/w:t>/, "<w:t></w:t>");
console.log("  ✓ Cleared 'Letteragh'");

xml = replacePattern(
  xml,
  /<w:t>Road, Galway, H9112Y4\.<\/w:t>/,
  "<w:t></w:t>"
);
console.log("  ✓ Cleared 'Road, Galway, H9112Y4.'");

// ── 3. Dates: both "25/05/2026" occurrences → {signature_date} ───────────────
xml = xml.replace(/<w:t>25\/05\/2026<\/w:t>/g, "<w:t>{signature_date}</w:t>");
console.log("  ✓ Injected {signature_date} (all date occurrences)");

// ── 4. Term: "3" run immediately before "0-year" run ─────────────────────────
// Pattern: <w:t>3</w:t></w:r><w:r ...><w:rPr...></w:rPr><w:t>0-year</w:t>
xml = replacePattern(
  xml,
  /(<w:t>)3(<\/w:t><\/w:r><w:r[^>]*><w:rPr[^>]*><w:b\/><w:bCs\/>[\s\S]*?<\/w:rPr><w:t>)0-year(<\/w:t>)/,
  "$1{term}$2-year$3"
);
console.log("  ✓ Injected {term} (replaced '3' before '0-year')");

// ── 5. Life cover amount: "€" + "1" + "50,000" ───────────────────────────────
// Replace the "1" + "50,000" pair that follows "€" in the life cover sentence
// Context: >€</w:t></w:r><w:r ...><w:t>1</w:t></w:r><w:r ...><w:t>50,000</w:t>
xml = replacePattern(
  xml,
  /(<w:t>€<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>)1(<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>)50,000(<\/w:t>)/,
  "$1{life_cover_amount}$2$3"
);
console.log("  ✓ Injected {life_cover_amount} (replaced '1' + '50,000')");

// ── 6. Premium: "€" + "1" + "8.66" in the premium sentence ──────────────────
// Context: >The premium for this cover is €</w:t>...</w:t><w:t>1</w:t>...<w:t>8.66</w:t>
xml = replacePattern(
  xml,
  /(<w:t>The premium for this cover is €<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>)1(<\/w:t><\/w:r><w:r[^>]*>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<w:t>)8\.66(<\/w:t>)/,
  "$1{premium}$2$3"
);
console.log("  ✓ Injected {premium} (replaced '1' + '8.66')");

// ── Save ──────────────────────────────────────────────────────────────────────
zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);
console.log("\n✓ template3.docx updated successfully with placeholders.");
console.log(`  Saved to: ${TEMPLATE_PATH}`);
