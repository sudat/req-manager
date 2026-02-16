import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

interface SystemFunctionWithDomain {
  id: string;
  title: string;
  systemDomainId: string | null;
  domainName: string;
  domainSortOrder: number;
}

/**
 * システム機能一覧を取得するAPI
 * システム領域のsort_order順、同領域内はID昇順でソート
 *
 * @param request - リクエスト（projectIdをクエリパラメータで受け取る）
 * @returns システム機能一覧を含むJSONレスポンス
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

    // システム機能一覧を取得（システム領域をJOIN）
    const { data: systemFunctions, error } = await supabase
      .from("system_functions")
      .select(`
        id,
        title,
        system_domain_id,
        system_domains!inner(name, sort_order)
      `)
      .eq("project_id", projectId)
      .order("sort_order", { foreignTable: "system_domains", ascending: true })
      .order("id", { ascending: true });

    if (error) {
      console.error("Failed to fetch system functions:", error);
      return NextResponse.json(
        { error: "システム機能の取得に失敗しました" },
        { status: 500 }
      );
    }

    // データを整形
    const formattedFunctions: SystemFunctionWithDomain[] = (systemFunctions || []).map((sf: any) => ({
      id: sf.id,
      title: sf.title,
      systemDomainId: sf.system_domain_id,
      domainName: sf.system_domains?.name || "その他",
      domainSortOrder: sf.system_domains?.sort_order || 0,
    }));

    return NextResponse.json({ systemFunctions: formattedFunctions });
  } catch (error) {
    console.error("System functions fetch error:", error);
    return NextResponse.json(
      { error: "システム機能の取得中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
