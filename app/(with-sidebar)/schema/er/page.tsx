"use client";

import { useEffect, useState } from "react";
import { useProject } from "@/components/project/project-context";
import { MermaidRenderer } from "@/components/schema/MermaidRenderer";
import { SectionCard } from "@/components/system-domains/section-card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";

/**
 * ER図表示ページ（エンドユーザー向け）
 *
 * model型の設計書からER図を自動生成して表示する。
 * データベーステーブルではなく、業務ドメインモデルを表現。
 */
export default function SchemaPage() {
  const { currentProjectId, loading: projectLoading } = useProject();
  const [mermaidCode, setMermaidCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchErDiagram = async () => {
      if (projectLoading || !currentProjectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/schema/er?projectId=${currentProjectId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "ER図の取得に失敗しました");
        }

        const data = await response.json();
        setMermaidCode(data.mermaidCode);
      } catch (err) {
        console.error("Failed to fetch ER diagram:", err);
        setError(
          err instanceof Error
            ? err.message
            : "ER図の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchErDiagram();
  }, [currentProjectId, projectLoading]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ヘッダー */}
      <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">ダッシュボード</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>ER図（ドメインモデル）</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          ER図（ドメインモデル）
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          model型設計書から生成された業務ドメインモデルのER図
        </p>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl">
          {projectLoading || loading ? (
            <SectionCard title="読み込み中...">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <span className="ml-3 text-slate-600">ER図を生成しています...</span>
              </div>
            </SectionCard>
          ) : error ? (
            <SectionCard title="エラー">
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="text-sm font-semibold text-red-800 mb-2">
                  ER図の取得エラー
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </SectionCard>
          ) : !currentProjectId ? (
            <SectionCard title="プロジェクト未選択">
              <p className="text-sm text-slate-600">
                プロジェクトを選択してください。
              </p>
            </SectionCard>
          ) : (
            <SectionCard title="業務ドメインモデル">
              <p className="text-sm text-slate-600 mb-4">
                model型設計書から自動生成されたER図です。エンティティ間の関連を視覚的に確認できます。
              </p>
              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 p-6">
                <MermaidRenderer
                  code={mermaidCode}
                  className="w-full flex justify-center"
                />
              </div>
            </SectionCard>
          )}
        </div>
      </main>
    </div>
  );
}
