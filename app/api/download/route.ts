import { NextRequest, NextResponse } from "next/server";
import { s3PresignedUrl } from "@/lib/s3";

export const dynamic = "force-dynamic";

/**
 * Redirects to a fresh presigned S3 URL for the given output key.
 * Usage: GET /api/download?key=output/filled_123_1.docx
 *
 * Note: The upload route now returns presigned URLs directly, so this
 * endpoint is only needed if you want to re-generate a download link later.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing 'key' query parameter." },
        { status: 400 }
      );
    }

    // Only allow keys under the output/ prefix to prevent arbitrary S3 access
    if (!key.startsWith("output/filled_") || !key.endsWith(".docx")) {
      return NextResponse.json({ error: "Invalid key." }, { status: 400 });
    }

    const url = await s3PresignedUrl(key);

    // Redirect the browser directly to the presigned S3 URL
    return NextResponse.redirect(url);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download failed.";
    console.error("[download] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
