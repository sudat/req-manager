import { NextRequest, NextResponse } from "next/server";
import { getDesignDocumentById } from "@/lib/data/design-documents";

/**
 * DD詳細を取得するAPI
 * シーケンス図上の参加者をクリックした際のモーダル表示等で使用する
 *
 * @param request - リクエスト（ddIdをパスパラメータ、projectIdをクエリパラメータで受け取る）
 * @returns DD詳細を含むJSONレスポンス
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ddId: string }> }
) {
  try {
    const { ddId } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    console.log("[DD API] Request:", { ddId, projectId });

    if (!ddId || ddId.trim() === "") {
      console.error("[DD API] Missing ddId");
      return NextResponse.json(
        { error: "ddId is required" },
        { status: 400 }
      );
    }

    if (!projectId || projectId === "") {
      console.error("[DD API] Missing or empty projectId");
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const { data: dd, error } = await getDesignDocumentById(ddId, projectId);

    console.log("[DD API] DB query result:", { dd: dd ? { id: dd.id, name: dd.name, projectId: dd.projectId } : null, error });

    if (error || !dd) {
      console.error("[DD API] Failed to fetch design document:", error);
      return NextResponse.json(
        { error: "DesignDocument not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ dd });
  } catch (error) {
    console.error("[DD API] Failed to fetch design document:", error);
    return NextResponse.json(
      { error: "Failed to fetch design document" },
      { status: 500 }
    );
  }
}
