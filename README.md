# AutoFill — Insurance PDF → DOCX Generator

Upload an insurance/application PDF, extract key fields with the xAI Grok API, and automatically fill a DOCX template.

---

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **pdf-parse** — PDF text extraction
- **xAI Grok API** (via OpenAI-compatible SDK)
- **docxtemplater + pizzip** — DOCX template filling

---

## Project Structure

```
auto-fill/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # POST: parse PDF → Grok → fill DOCX
│   │   └── download/route.ts    # GET: serve generated DOCX
│   ├── layout.tsx
│   ├── page.tsx                 # Main UI (drag-and-drop upload)
│   └── globals.css
├── lib/
│   ├── types.ts                 # TypeScript interfaces
│   ├── parsePdf.ts              # PDF text extraction
│   ├── extractWithGrok.ts       # xAI Grok API call
│   └── fillDocx.ts              # DOCX template filling
├── templates/
│   └── template.docx            # ← Place your template here
├── output/                      # Generated DOCX files (auto-created)
└── .env.local                   # Environment variables
```

---

## Installation

```bash
npm install
```

---

## Setup

### 1. Add your xAI API key

Edit `.env.local`:

```env
XAI_API_KEY=your_xai_api_key_here
```

Get your key at [https://console.x.ai](https://console.x.ai).

### 2. Add your DOCX template

Place your Word template at:

```
templates/template.docx
```

The template must use these `{{placeholder}}` tags anywhere in the document (paragraphs, tables, cells):

| Placeholder                      | Field                      |
|----------------------------------|----------------------------|
| `{{name}}`                       | Full Name                  |
| `{{address}}`                    | Address                    |
| `{{dob}}`                        | Date of Birth              |
| `{{annual_income}}`              | Annual Income              |
| `{{income_protection_benefit}}`  | Income Protection Benefit  |
| `{{deferral_period}}`            | Deferral Period            |
| `{{occupation}}`                 | Occupation                 |
| `{{smoking_status}}`             | Smoking Status             |
| `{{mobile}}`                     | Mobile                     |
| `{{email}}`                      | Email                      |

---

## Running

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

---

## Usage

1. Open the app in your browser.
2. Drag and drop a PDF insurance/application document (or click to browse).
3. Click **Extract & Generate DOCX**.
4. The app will:
   - Extract text from the PDF
   - Send it to Grok AI for field extraction
   - Fill your DOCX template with the extracted values
5. Review the extracted fields shown on screen.
6. Click **Download DOCX** to save the filled document.

---

## Notes

- PDF must be text-based (not a scanned image). Scanned PDFs will return empty fields.
- Maximum file size: 20 MB.
- Generated DOCX files are saved temporarily in `output/`. They are not cleaned up automatically — add a cron job or cleanup route if needed.
- Original DOCX formatting, tables, and styles are fully preserved.
