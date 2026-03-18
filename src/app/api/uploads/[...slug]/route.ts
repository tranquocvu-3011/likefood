import { NextResponse } from "next/server";
import { join } from "path";
import { readFile, stat } from "fs/promises";

// Helper function to determine content type
function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case "png": return "image/png";
    case "gif": return "image/gif";
    case "webp": return "image/webp";
    case "avif": return "image/avif";
    case "svg": return "image/svg+xml";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  try {
    const { slug } = await params;
    const filePath = slug.join("/");
    
    // Read from the real public/uploads directory
    const fullPath = join(process.cwd(), "public", "uploads", filePath);
    
    // Check if file exists
    try {
      await stat(fullPath);
    } catch {
      return new NextResponse("File not found", { status: 404 });
    }

    // Read the file buffer
    const fileBuffer = await readFile(fullPath);
    
    // Extract extension
    const ext = filePath.split(".").pop() || "jpg";
    const contentType = getContentType(ext);

    // Return the response with proper headers allowing caching
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    
    return response;
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
