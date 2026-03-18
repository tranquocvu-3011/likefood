import { NextResponse } from "next/server";
import { join } from "path";
import { readFile, stat } from "fs/promises";

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png": return "image/png";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "svg": return "image/svg+xml";
    case "ico": return "image/x-icon";
    case "mp4": return "video/mp4";
    case "webm": return "video/webm";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    // Security: prevent directory traversal
    if (filePath.includes("..") || filePath.includes("~")) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const fullPath = join(process.cwd(), "public", filePath);

    try {
      await stat(fullPath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    const fileBuffer = await readFile(fullPath);
    const ext = filePath.split(".").pop() || "jpg";
    const contentType = getContentType(ext);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
