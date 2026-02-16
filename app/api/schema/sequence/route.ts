import { NextResponse } from "next/server";
import { listDesignDocumentsBySrfId } from "@/lib/data/design-documents";
import { listDdDependenciesBySourceIds } from "@/lib/data/requirement-links";
import { getSystemFunctionById } from "@/lib/data/system-functions";
import { sideEffectsToMermaidSequence } from "@/lib/utils/design-documents/sideeffects-to-mermaid";

/**
 * シーケンス図のMermaid DSLを取得するAPI
 * SF（システム機能）に紐づく設計書（DD）のsideEffectsからシーケンス図を生成する
 *
 * @param request - リクエスト（srfIdをクエリパラメータで受け取る）
 * @returns Mermaid DSL文字列とSF情報を含むJSONレスポンス
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const srfId = searchParams.get("srfId");
    const projectId = searchParams.get("projectId");

    if (!srfId) {
      return NextResponse.json(
        { error: "システム機能IDが必要です" },
        { status: 400 }
      );
    }

    // SF情報を取得
    const { data: sf, error: sfError } = await getSystemFunctionById(
      srfId,
      projectId || undefined
    );

    if (sfError || !sf) {
      console.error("Failed to fetch system function:", sfError);
      return NextResponse.json(
        { error: "システム機能の取得に失敗しました" },
        { status: 500 }
      );
    }



    // SFに紐づく設計書を取得
    const { data: dds, error: ddError } = await listDesignDocumentsBySrfId(
      srfId,
      projectId || undefined
    );

    if (ddError) {
      console.error("Failed to fetch design documents:", ddError);
      return NextResponse.json(
        { error: "設計書の取得に失敗しました" },
        { status: 500 }
      );
    }

    const ddIds = (dds ?? []).map((dd) => dd.id);
    const { data: dependencies, error: dependencyError } =
      await listDdDependenciesBySourceIds(ddIds, projectId || undefined);
    if (dependencyError) {
      console.error("Failed to fetch DD dependencies:", dependencyError);
      return NextResponse.json(
        { error: "DD依存関係の取得に失敗しました" },
        { status: 500 }
      );
    }

    // DD間依存 + sideEffects から Mermaid シーケンス図を生成
    const { mermaidCode, ddMapping } = sideEffectsToMermaidSequence(
      sf,
      dds || [],
      dependencies ?? []
    );

    return NextResponse.json({
      mermaidCode,
      sfInfo: {
        id: sf.id,
        name: sf.title,
        description: sf.summary,
      },
      ddCount: dds?.length || 0,
      ddMapping,
    });
  } catch (error) {
    console.error("Sequence diagram generation error:", error);
    return NextResponse.json(
      { error: "シーケンス図の生成に失敗しました" },
      { status: 500 }
    );
  }
}
