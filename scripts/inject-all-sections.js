/**
 * Injects placeholders into all remaining empty sections of template.docx:
 *
 * Table 1 (Dependents): row1-3 col0={dep1_name}/{dep2_name}/{dep3_name}, col1={dep1_dob}/{dep2_dob}/{dep3_dob}
 * Table 2 (Income):     col1 value cells get {gross_annual_salary} etc after €
 * Table 3 (Outgoings):  col1 value cells get {mortgage} etc after €
 * Table 4 (Assets):     col1 value cells get {asset_home} etc
 * Table 5 (PHI):        col1 value cells get {total_life_cover} etc
 * Table 6 (Employment): col1 value cells get {employment_occupation} etc
 * Table 7 (Notes):      single cell gets {notes}
 */

const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template.docx");

const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeParagraphXml(text) {
  return (
    `<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>` +
    `<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr>` +
    `<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>` +
    `<w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>` +
    `<w:t xml:space="preserve">${text}</w:t></w:r></w:p>`
  );
}

function replaceCellContent(cellXml, newText) {
  const withoutParagraphs = cellXml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, "");
  return withoutParagraphs.replace("</w:tc>", makeParagraphXml(newText) + "</w:tc>");
}

function extractCells(rowXml) {
  const cells = [];
  const re = /<w:tc[ >][\s\S]*?<\/w:tc>/g;
  let m;
  while ((m = re.exec(rowXml)) !== null) cells.push(m[0]);
  return cells;
}

function replaceCell(rowXml, cellIndex, newCellXml) {
  let i = 0;
  return rowXml.replace(/<w:tc[ >][\s\S]*?<\/w:tc>/g, (match) => {
    if (i === cellIndex) { i++; return newCellXml; }
    i++;
    return match;
  });
}

function extractTables(xmlStr) {
  const tables = [];
  const re = /<w:tbl[ >][\s\S]*?<\/w:tbl>/g;
  let m;
  while ((m = re.exec(xmlStr)) !== null) tables.push(m[0]);
  return tables;
}

function extractRows(tableXml) {
  const rows = [];
  const re = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
  let m;
  while ((m = re.exec(tableXml)) !== null) rows.push(m[0]);
  return rows;
}

// Inject placeholder into col1 of a specific row in a table
function injectCell(tableXml, rowIdx, colIdx, placeholder) {
  const rows = extractRows(tableXml);
  if (rowIdx >= rows.length) {
    console.warn(`  Row ${rowIdx} not found in table`);
    return tableXml;
  }
  let row = rows[rowIdx];
  const cells = extractCells(row);
  if (colIdx >= cells.length) {
    console.warn(`  Col ${colIdx} not found in row ${rowIdx}`);
    return tableXml;
  }
  const newCell = replaceCellContent(cells[colIdx], placeholder);
  const newRow = replaceCell(row, colIdx, newCell);
  return tableXml.replace(rows[rowIdx], newRow);
}

// For € cells: append placeholder after the € sign in the existing paragraph
function injectAfterEuro(tableXml, rowIdx, placeholder) {
  const rows = extractRows(tableXml);
  if (rowIdx >= rows.length) return tableXml;
  let row = rows[rowIdx];
  const cells = extractCells(row);
  if (cells.length < 2) return tableXml;

  // Replace the € text node with €{placeholder}
  const euroCell = cells[1];
  const newEuroCell = euroCell.replace(
    /(<w:t[^>]*>)(€)(<\/w:t>)/,
    `$1€{${placeholder}}$3`
  );
  if (newEuroCell === euroCell) {
    console.warn(`  Could not find € in row ${rowIdx} col1`);
    return tableXml;
  }
  const newRow = replaceCell(row, 1, newEuroCell);
  return tableXml.replace(rows[rowIdx], newRow);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const tables = extractTables(xml);
console.log(`Found ${tables.length} tables\n`);

// ── Table 1: Dependents (rows 1-3, col0=name, col1=dob) ──────────────────────
console.log("Table 1 (Dependents):");
let t1 = tables[1];
[[1, 0, "{dep1_name}"], [1, 1, "{dep1_dob}"],
 [2, 0, "{dep2_name}"], [2, 1, "{dep2_dob}"],
 [3, 0, "{dep3_name}"], [3, 1, "{dep3_dob}"]].forEach(([r, c, p]) => {
  t1 = injectCell(t1, r, c, p);
  console.log(`  row${r} col${c} → ${p}`);
});

// ── Table 2: Income (col1 after €) ───────────────────────────────────────────
console.log("\nTable 2 (Income):");
let t2 = tables[2];
const incomeFields = [
  "gross_annual_salary",
  "net_monthly_income",
  "other_net_monthly_income",
  "total_net_monthly_income",
];
incomeFields.forEach((field, i) => {
  t2 = injectAfterEuro(t2, i, field);
  console.log(`  row${i} → €{${field}}`);
});

// ── Table 3: Outgoings (col1 after €) ────────────────────────────────────────
console.log("\nTable 3 (Outgoings):");
let t3 = tables[3];
const outgoingFields = [
  "outgoing_mortgage",
  "outgoing_other_loans",
  "outgoing_life_savings_pension",
  "outgoing_regular_expenses",
  "outgoing_motor_travel",
  "outgoing_other",
  "outgoing_total",
];
outgoingFields.forEach((field, i) => {
  t3 = injectAfterEuro(t3, i, field);
  console.log(`  row${i} → €{${field}}`);
});

// ── Table 4: Assets & Liabilities (col1) ─────────────────────────────────────
console.log("\nTable 4 (Assets):");
let t4 = tables[4];
const assetFields = [
  [0, "asset_home"],
  [1, "asset_mortgage"],
  [2, "asset_deposits"],
  [3, "asset_other_loans"],
  [4, "asset_net"],
];
assetFields.forEach(([r, field]) => {
  t4 = injectCell(t4, r, 1, `{${field}}`);
  console.log(`  row${r} col1 → {${field}}`);
});

// ── Table 5: Life/Illness/PHI (col1) ─────────────────────────────────────────
console.log("\nTable 5 (PHI):");
let t5 = tables[5];
const phiFields = [
  [0, "cover_total_life"],
  [1, "cover_total_illness"],
  [2, "cover_total_phi"],
  [3, "cover_pension_value"],
  [4, "cover_pension_contribution"],
  [5, "cover_target_nra"],
];
phiFields.forEach(([r, field]) => {
  t5 = injectCell(t5, r, 1, `{${field}}`);
  console.log(`  row${r} col1 → {${field}}`);
});

// ── Table 6: Employment Details (col1) ───────────────────────────────────────
console.log("\nTable 6 (Employment):");
let t6 = tables[6];
const empFields = [
  [0, "employment_occupation"],
  [1, "employment_type"],
  [2, "employment_other_job"],
];
empFields.forEach(([r, field]) => {
  t6 = injectCell(t6, r, 1, `{${field}}`);
  console.log(`  row${r} col1 → {${field}}`);
});

// ── Table 7: Notes (single cell) ─────────────────────────────────────────────
console.log("\nTable 7 (Notes):");
let t7 = tables[7];
t7 = injectCell(t7, 0, 0, "{notes}");
console.log("  row0 col0 → {notes}");

// ── Rebuild XML ───────────────────────────────────────────────────────────────
xml = xml
  .replace(tables[1], t1)
  .replace(tables[2], t2)
  .replace(tables[3], t3)
  .replace(tables[4], t4)
  .replace(tables[5], t5)
  .replace(tables[6], t6)
  .replace(tables[7], t7);

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);
console.log("\n✓ template.docx updated with all section placeholders.");
