import { NextResponse } from "next/server";
import { listDesignDocuments } from "@/lib/data/design-documents";
import { modelDDsToMermaidErDiagram } from "@/lib/utils/design-documents/model-to-mermaid";

/**
 * ER図のMermaid DSLを取得するAPI
 * model型の設計書からER図を生成する
 *
 * @param request - リクエスト（projectIdをクエリパラメータで受け取る）
 * @returns Mermaid DSL文字列を含むJSONレスポンス
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: "プロジェクトIDが必要です" },
        { status: 400 }
      );
    }

    // design_documents を取得（project_idでフィルタ）
    const { data: dds, error } = await listDesignDocuments(projectId);

    if (error) {
      console.error("Failed to fetch design documents:", error);
      return NextResponse.json(
        { error: "設計書の取得に失敗しました" },
        { status: 500 }
      );
    }

    // model型のみフィルタしてMermaid生成
    const mermaidCode = modelDDsToMermaidErDiagram(dds || []);

    return NextResponse.json({ mermaidCode });
  } catch (error) {
    console.error("ER diagram generation error:", error);
    return NextResponse.json(
      { error: "ER図の生成に失敗しました" },
      { status: 500 }
    );
  }
}
