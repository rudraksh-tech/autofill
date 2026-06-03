/**
 * Injects {life2_*} placeholders into the Life 2 value cells of template.docx.
 *
 * The table has 4 columns:
 *   col0 = Life1 label  col1 = Life1 value (already has placeholders)
 *   col2 = Life2 label  col3 = Life2 value (currently empty — we fill these)
 *
 * Row mapping (0-based within first table):
 *   row2: Name          → col3: {life2_name}
 *   row3: Date of Birth → col3: {life2_dob}
 *   row4: Occupation    → col3: {life2_occupation}
 *   row5: Address       → col3: {life2_address}
 *   row6: Mobile        → col3: {life2_mobile}
 *   row7: Email         → col3: {life2_email}
 *   row9: Smoker        → col3: {life2_smoking_status}
 */

const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template.docx");

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
  while ((m = re.exec(rowXml)) !== null) {
    cells.push(m[0]);
  }
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

// Row index → Life2 placeholder for col3
const ROW_LIFE2_PLACEHOLDERS = {
  2: "{life2_name}",
  3: "{life2_dob}",
  4: "{life2_occupation}",
  5: "{life2_address}",
  6: "{life2_mobile}",
  7: "{life2_email}",
  9: "{life2_smoking_status}",
};

const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

const tblRegex = /<w:tbl[ >][\s\S]*?<\/w:tbl>/g;
const tables = [];
let tblMatch;
while ((tblMatch = tblRegex.exec(xml)) !== null) {
  tables.push({ full: tblMatch[0], index: tblMatch.index });
}

if (tables.length === 0) {
  console.error("No tables found!");
  process.exit(1);
}

console.log(`Found ${tables.length} table(s). Injecting Life2 placeholders into table 0...`);

let firstTable = tables[0].full;
const rowRegex = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
const rows = [];
let rowMatch;
while ((rowMatch = rowRegex.exec(firstTable)) !== null) {
  rows.push(rowMatch[0]);
}

console.log(`Table 0 has ${rows.length} rows.`);

let modifiedTable = firstTable;

for (const [rowIdxStr, placeholder] of Object.entries(ROW_LIFE2_PLACEHOLDERS)) {
  const rowIdx = parseInt(rowIdxStr);
  if (rowIdx >= rows.length) {
    console.warn(`Row ${rowIdx} does not exist, skipping.`);
    continue;
  }

  let row = rows[rowIdx];
  const cells = extractCells(row);

  if (cells[3]) {
    const newCell = replaceCellContent(cells[3], placeholder);
    row = replaceCell(row, 3, newCell);
    console.log(`  Row ${rowIdx}, col3 → ${placeholder}`);
  } else {
    console.warn(`  Row ${rowIdx} has no col3, skipping.`);
  }

  modifiedTable = modifiedTable.replace(rows[rowIdx], row);
  rows[rowIdx] = row;
}

xml = xml.replace(tables[0].full, modifiedTable);

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);

console.log("\n✓ template.docx updated with Life2 placeholders.");
