import { NextRequest, NextResponse } from "next/server";
import { parsePdf } from "@/lib/parsePdf";
import { extractWithGemini } from "@/lib/extractWithGemini";
import { fillDocx } from "@/lib/fillDocx";
import { s3PresignedUrl } from "@/lib/s3";

// Force dynamic so the route is never statically cached
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 0. Validate required env vars up front ──────────────────────────────
  const missingEnv: string[] = [];
  if (!process.env.GEMINI_API_KEY) missingEnv.push("GEMINI_API_KEY");
  if (!process.env.S3_BUCKET_NAME) missingEnv.push("S3_BUCKET_NAME");
  if (!process.env.APP_AWS_REGION) missingEnv.push("APP_AWS_REGION");
  if (!process.env.APP_AWS_ACCESS_KEY_ID) missingEnv.push("APP_AWS_ACCESS_KEY_ID");
  if (!process.env.APP_AWS_SECRET_ACCESS_KEY) missingEnv.push("APP_AWS_SECRET_ACCESS_KEY");

  if (missingEnv.length > 0) {
    console.error("[upload] Missing env vars:", missingEnv.join(", "));
    return NextResponse.json(
      { error: `Server misconfiguration: missing env vars: ${missingEnv.join(", ")}` },
      { status: 500 }
    );
  }

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
    console.log("[upload] Parsing PDF...");
    const pdfText = await parsePdf(buffer);
    console.log("[upload] PDF parsed, text length:", pdfText?.length ?? 0);

    if (!pdfText || pdfText.trim().length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from the PDF. The file may be scanned or image-based.",
        },
        { status: 422 }
      );
    }

    // ── 5. Extract fields via Gemini API ─────────────────────────────────────
    console.log("[upload] Calling Gemini API...");
    const fields = await extractWithGemini(pdfText);
    console.log("[upload] Gemini extraction done:", JSON.stringify(fields, null, 2));

    // ── 6. Fill all three DOCX templates and upload to S3 ────────────────────
    console.log("[upload] Filling DOCX templates...");
    const { key1, key2, key3 } = await fillDocx(fields);
    console.log("[upload] DOCX filled, keys:", key1, key2, key3);

    // ── 7. Generate presigned download URLs (valid 15 min) ───────────────────
    console.log("[upload] Generating presigned URLs...");
    const [downloadUrl, downloadUrl2, downloadUrl3] = await Promise.all([
      s3PresignedUrl(key1),
      s3PresignedUrl(key2),
      s3PresignedUrl(key3),
    ]);
    console.log("[upload] Done.");

    return NextResponse.json({
      success: true,
      downloadUrl,
      downloadUrl2,
      downloadUrl3,
      fields,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    const stack = err instanceof Error ? err.stack : "";
    console.error("[upload] Error:", message);
    console.error("[upload] Stack:", stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
