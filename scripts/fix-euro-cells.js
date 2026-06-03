/**
 * Removes the hardcoded "€" prefix from value cells in the Income and Outgoings tables
 * so that when the value is empty, nothing is shown (instead of a lone "€").
 * The € will be prepended in fillDocx.ts when a value is present.
 */
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template.docx");
const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// Replace €{field} with just {field} for all income/outgoing fields
const fields = [
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
];

fields.forEach((field) => {
  const before = `€{${field}}`;
  const after = `{${field}}`;
  if (xml.includes(before)) {
    xml = xml.replace(new RegExp(before.replace(/[{}]/g, "\\$&"), "g"), after);
    console.log(`  ✓ Removed € prefix from {${field}}`);
  } else {
    console.warn(`  WARNING: ${before} not found`);
  }
});

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);
console.log("\n✓ Euro prefixes removed from template.docx");
