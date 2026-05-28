import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { parsePdf } from "@/lib/parsePdf";
import { extractWithGrok } from "@/lib/extractWithGrok";
import { fillDocx } from "@/lib/fillDocx";

// Force dynamic so the route is never statically cached
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // ── 1. Parse multipart form data ────────────────────────────────────────
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "No file uploaded. Please attach a PDF." },
        { status: 400 }
      );
    }

    // ── 2. Validate file type ────────────────────────────────────────────────
    const fileName = (file as File).name ?? "";
    const mimeType = (file as File).type ?? "";

    if (
      mimeType !== "application/pdf" &&
      !fileName.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // ── 3. Convert File to Buffer ────────────────────────────────────────────
    const arrayBuffer = await (file as File).arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── 4. Extract text from PDF ─────────────────────────────────────────────
    const pdfText = await parsePdf(buffer);

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        { error: "Could not extract text from the PDF. The file may be scanned or image-based." },
        { status: 422 }
      );
    }

    // ── 5. Extract fields via Grok API ───────────────────────────────────────
    const fields = await extractWithGrok(pdfText);

    // ── 6. Fill both DOCX templates ──────────────────────────────────────────
    const { path1, path2 } = await fillDocx(fields);

    // ── 7. Build download URLs ────────────────────────────────────────────────
    const downloadUrl = `/api/download?file=${encodeURIComponent(path.basename(path1))}`;
    const downloadUrl2 = `/api/download?file=${encodeURIComponent(path.basename(path2))}`;

    return NextResponse.json({
      success: true,
      downloadUrl,
      downloadUrl2,
      fields,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[upload] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
