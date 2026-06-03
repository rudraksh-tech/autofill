// One-time fix: clear the leftover address fragments in template3.docx
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "template3.docx");
const buf = fs.readFileSync(TEMPLATE_PATH);
const zip = new PizZip(buf);
let xml = zip.files["word/document.xml"].asText();

// Clear ", " run that follows the (now empty) Shéamais run
xml = xml.replace(
  /(<w:t><\/w:t><\/w:r><w:proofErr w:type="spellEnd"\/><w:r[^>]*><w:rPr>[\s\S]*?<\/w:rPr>)<w:t xml:space="preserve">, <\/w:t>/,
  "$1<w:t></w:t>"
);

// Clear " Road, Galway, H9112Y4." run
xml = xml.replace(
  /<w:t xml:space="preserve"> Road, Galway, H9112Y4\.<\/w:t>/,
  "<w:t></w:t>"
);

zip.file("word/document.xml", xml);
const out = zip.generate({ type: "nodebuffer", compression: "DEFLATE" });
fs.writeFileSync(TEMPLATE_PATH, out);
console.log("Fixed remaining address fragments in template3.docx");
