/**
 * Reads the original template.docx, injects {{placeholder}} tags into the
 * correct empty value cells, and overwrites the file.
 *
 * Table layout (4 columns):
 *   col0 = Life1 label (blue)  col1 = Life1 value (empty)
 *   col2 = Life2 label (blue)  col3 = Life2 value (empty)
 *
 * Row order in the first table:
 *   row0: header (Life 1 / Personal Details / Life 2 / Personal Details)
 *   row1: empty spacer row
 *   row2: Name          | {{name}}          | Name          | (ignored)
 *   row3: Date of Birth | {{dob}}           | Date of Birth | (ignored)
 *   row4: Occupation    | {{occupation}}    | Occupation    | (ignored)
 *   row5: Address       | {{address}}       | Address       | (ignored)
 *   row6: Mobile        | {{mobile}}        | Mobile        | (ignored)
 *   row7: Email         | {{email}}         | Email         | (ignored)
 *   row8: Marital Status| (skip)            | Marital Status| (skip)
 *   row9: Smoker        | {{smoking_status}}| Smoker        | (skip)
 */

const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template.docx");

// Build a minimal <w:p> containing a plain text run with the given value
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

// Replace the inner content of a <w:tc> (table cell) — keeps <w:tcPr> intact,
// replaces the <w:p ...>...</w:p> paragraph(s) with our new one.
function replaceCellContent(cellXml, newText) {
  // Remove all existing <w:p> elements inside the cell
  const withoutParagraphs = cellXml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g, "");
  // Insert our new paragraph before the closing </w:tc>
  return withoutParagraphs.replace("</w:tc>", makeParagraphXml(newText) + "</w:tc>");
}

// Given a <w:tr>...</w:tr> string, return an array of <w:tc>...</w:tc> strings
function extractCells(rowXml) {
  const cells = [];
  const re = /<w:tc[ >][\s\S]*?<\/w:tc>/g;
  let m;
  while ((m = re.exec(rowXml)) !== null) {
    cells.push(m[0]);
  }
  return cells;
}

// Replace a specific cell in a row string
function replaceCell(rowXml, cellIndex, newCellXml) {
  let i = 0;
  return rowXml.replace(/<w:tc[ >][\s\S]*?<\/w:tc>/g, (match) => {
    if (i === cellIndex) {
      i++;
      return newCellXml;
    }
    i++;
    return match;
  });
}

// Map: row index (0-based within first table) → { col1Placeholder, col3Placeholder }
// col1 = Life1 value cell (index 1), col3 = Life2 value cell (index 3)
// docxtemplater default delimiters are single braces: {tag}
const ROW_PLACEHOLDERS = {
  2: { col1: "{name}",          col3: null },
  3: { col1: "{dob}",           col3: null },
  4: { col1: "{occupation}",    col3: null },
  5: { col1: "{address}",       col3: null },
  6: { col1: "{mobile}",        col3: null },
  7: { col1: "{email}",         col3: null },
  9: { col1: "{smoking_status}",col3: null },
};

const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// Extract all <w:tbl> blocks — we only care about the first one (personal details)
const tblRegex = /<w:tbl[ >][\s\S]*?<\/w:tbl>/g;
const tables = [];
let tblMatch;
while ((tblMatch = tblRegex.exec(xml)) !== null) {
  tables.push({ full: tblMatch[0], index: tblMatch.index });
}

if (tables.length === 0) {
  console.error("No tables found in document!");
  process.exit(1);
}

console.log(`Found ${tables.length} table(s). Injecting into table 0...`);

// Work on the first table
let firstTable = tables[0].full;

// Extract rows
const rowRegex = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
const rows = [];
let rowMatch;
while ((rowMatch = rowRegex.exec(firstTable)) !== null) {
  rows.push(rowMatch[0]);
}

console.log(`Table 0 has ${rows.length} rows.`);

let modifiedTable = firstTable;

for (const [rowIdxStr, placeholders] of Object.entries(ROW_PLACEHOLDERS)) {
  const rowIdx = parseInt(rowIdxStr);
  if (rowIdx >= rows.length) {
    console.warn(`Row ${rowIdx} does not exist (table only has ${rows.length} rows), skipping.`);
    continue;
  }

  let row = rows[rowIdx];
  const cells = extractCells(row);

  if (placeholders.col1 && cells[1]) {
    const newCell = replaceCellContent(cells[1], placeholders.col1);
    row = replaceCell(row, 1, newCell);
    console.log(`  Row ${rowIdx}, col1 → ${placeholders.col1}`);
  }
  if (placeholders.col3 && cells[3]) {
    const newCell = replaceCellContent(cells[3], placeholders.col3);
    row = replaceCell(row, 3, newCell);
    console.log(`  Row ${rowIdx}, col3 → ${placeholders.col3}`);
  }

  // Replace old row with modified row in the table string
  modifiedTable = modifiedTable.replace(rows[rowIdx], row);
  // Update rows array so subsequent replacements use the updated string
  rows[rowIdx] = row;
}

// Replace the original table in the full XML
xml = xml.replace(tables[0].full, modifiedTable);

// Save back into the zip and write the file
zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);

console.log("\n✓ Template updated successfully with placeholders.");
console.log(`  Saved to: ${TEMPLATE_PATH}`);
