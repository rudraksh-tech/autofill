/**
 * Injects {placeholder} tags into template2.docx by doing targeted XML
 * string replacements on the known text patterns in the document.
 *
 * Fields to fill:
 *   name        → after "Name:" header paragraph (next empty paragraph)
 *   address     → after "Address:" header paragraph (next empty paragraph)
 *   dob         → after "Date:" header paragraph (next empty paragraph)
 *   name again  → "Dear ," → "Dear {name},"
 *   income_protection_benefit → "benefit of € to be paid" → "benefit of €{income_protection_benefit} to be paid"
 *   deferral_period → hardcoded "26" weeks → "{deferral_period}"
 *   annual_income   → "€ 35,000 per annum" → "€ {annual_income} per annum"
 *   occupation      → "Class 1" → "{occupation_class}" (skip — not in our fields)
 */

const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template2.docx");

const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// ── Helper: replace a literal text value inside <w:t> tags ──────────────────
// Replaces the FIRST occurrence of exactText with newText inside a <w:t> element
function replaceWtText(xmlStr, exactText, newText) {
  // Escape special regex chars in the search string
  const escaped = exactText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(<w:t[^>]*>)(${escaped})(<\\/w:t>)`);
  const result = xmlStr.replace(re, `$1${newText}$3`);
  if (result === xmlStr) {
    console.warn(`  WARNING: could not find text to replace: "${exactText}"`);
  }
  return result;
}

// Same but replaces ALL occurrences
function replaceAllWtText(xmlStr, exactText, newText) {
  const escaped = exactText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(<w:t[^>]*>)(${escaped})(<\\/w:t>)`, "g");
  return xmlStr.replace(re, `$1${newText}$3`);
}

// ── 1. Name: paragraph — the paragraph after "Name:" is empty, inject {name} ─
// Pattern: <w:t>Name:</w:t></w:r></w:p>  followed by  <w:p ...><w:pPr...></w:pPr><w:r...><w:rPr...></w:rPr></w:r></w:p>
// Simpler: find the empty <w:r> run after the Name: paragraph and add text
// Strategy: replace the empty paragraph that follows "Name:" with one containing {name}

// Find "Name:" paragraph end and inject into the NEXT paragraph's run
// We'll do this by replacing the specific empty run pattern after each label

// Actually the cleanest approach: replace the empty <w:t/> or missing <w:t> in
// the paragraph that follows each label paragraph.

// Looking at the XML output: after "Name:</w:t></w:r></w:p>" there's a paragraph
// with a run that has rPr but no <w:t>. We inject a <w:t> into that run.

function injectAfterLabel(xmlStr, labelText, placeholder) {
  // Find the label paragraph closing, then find the next <w:r> that has no <w:t>
  const escaped = labelText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Match: label text run close → paragraph close → next paragraph → run with rPr but no w:t
  const re = new RegExp(
    `(${escaped}<\\/w:t><\\/w:r><\\/w:p><w:p[^>]*>(?:<w:pPr>[\\s\\S]*?<\\/w:pPr>)?<w:r[^>]*>(?:<w:rPr>[\\s\\S]*?<\\/w:rPr>)?)(<\\/w:r>)`
  );
  const replacement = `$1<w:t xml:space="preserve">${placeholder}</w:t>$2`;
  const result = xmlStr.replace(re, replacement);
  if (result === xmlStr) {
    console.warn(`  WARNING: could not inject after label: "${labelText}"`);
  } else {
    console.log(`  ✓ Injected ${placeholder} after "${labelText}"`);
  }
  return result;
}

// ── 2. "Dear ," → "Dear {name}," ────────────────────────────────────────────
// The XML has: <w:t>Dear</w:t></w:r><w:r ...><w:t xml:space="preserve">, </w:t>
// We need to insert {name} between "Dear" and ","
function injectDearName(xmlStr) {
  // Replace: >Dear</w:t></w:r> ... >, </w:t>
  // with:    >Dear {name}</w:t></w:r> ... >, </w:t>
  const re = /(<w:t>Dear<\/w:t><\/w:r>)([\s\S]*?)(<w:t xml:space="preserve">, <\/w:t>)/;
  const result = xmlStr.replace(re, (match, p1, p2, p3) => {
    return `<w:t xml:space="preserve">Dear {name}</w:t></w:r>${p2}${p3}`;
  });
  if (result === xmlStr) {
    console.warn("  WARNING: could not inject Dear {name}");
  } else {
    console.log("  ✓ Injected {name} after Dear");
  }
  return result;
}

// ── 3. "benefit of € to be paid" → "benefit of €{income_protection_benefit} to be paid"
function injectBenefit(xmlStr) {
  // The text is: "benefit of € to be paid until your retirement age"
  // in a single <w:t> run
  const result = replaceWtText(
    xmlStr,
    "You require an annual income protection benefit of \u20AC to be paid until your retirement age",
    "You require an annual income protection benefit of \u20AC{income_protection_benefit} to be paid until your retirement age"
  );
  if (result !== xmlStr) console.log("  ✓ Injected {income_protection_benefit}");
  return result;
}

// ── 4. Deferral period "26" → "{deferral_period}" ───────────────────────────
// The XML has a separate run: <w:t>26</w:t> between "deferred period of " and " weeks"
function injectDeferral(xmlStr) {
  const result = replaceWtText(xmlStr, "26", "{deferral_period}");
  if (result !== xmlStr) console.log("  ✓ Injected {deferral_period} (replaced '26')");
  return result;
}

// ── 5. Annual income "€ 35,000 per annum" → "€ {annual_income} per annum" ──
// XML: <w:t>€</w:t> ... <w:t>35,000</w:t> ... <w:t xml:space="preserve"> per annum</w:t>
// Replace the "35,000" run
function injectAnnualIncome(xmlStr) {
  const result = replaceWtText(xmlStr, "35,000", "{annual_income}");
  if (result !== xmlStr) console.log("  ✓ Injected {annual_income} (replaced '35,000')");
  return result;
}

// ── 6. Name/Address/Date header paragraphs ───────────────────────────────────
console.log("\nInjecting into template2.docx...\n");

xml = replaceWtText(xml, "Name:", "Name: {name}");
console.log("  ✓ Injected {name} after Name:");
xml = replaceWtText(xml, "Address: ", "Address: {address}");
console.log("  ✓ Injected {address} after Address:");
xml = replaceWtText(xml, "Date:", "Date: {dob}");
console.log("  ✓ Injected {dob} after Date:");
xml = injectDearName(xml);
xml = injectBenefit(xml);
xml = injectDeferral(xml);
xml = injectAnnualIncome(xml);

// Save
zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);
console.log("\n✓ template2.docx updated successfully.");
