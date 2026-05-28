import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "Missing file parameter." }, { status: 400 });
    }

    // Sanitise: strip any path traversal attempts
    const safeFilename = path.basename(file);

    // Only allow files that match our generated naming pattern
    if (!/^filled_\d+_[12]\.docx$/.test(safeFilename)) {
      return NextResponse.json({ error: "Invalid file name." }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "output", safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Download failed.";
    console.error("[download] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
