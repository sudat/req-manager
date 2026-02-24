import { NextResponse } from "next/server";
import JSZip from "jszip";
import { cookies } from "next/headers";
import { generateRequirementsExport } from "@/lib/export/requirements-export";
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from "@/lib/constants/project";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;

    const files = await generateRequirementsExport(projectId);

    const zip = new JSZip();
    for (const [path, content] of files) {
      zip.file(path, content);
    }

    const buffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="requirements_export_${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (error) {
    console.error("Requirements export error:", error);
    return NextResponse.json({ error: "エクスポートに失敗しました" }, { status: 500 });
  }
}
