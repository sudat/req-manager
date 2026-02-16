"use client";

import { useEffect, useState, useCallback } from "react";
import { useProject } from "@/components/project/project-context";
import { SchemaViewer } from "@/components/schema/SchemaViewer";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Loader2, Maximize2 } from "lucide-react";

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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
      {!isFullscreen && (
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
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                ER図（ドメインモデル）
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                model型設計書から生成された業務ドメインモデルのER図
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="gap-2"
            >
              <Maximize2 className="h-4 w-4" />
              全画面表示
            </Button>
          </div>
        </header>
      )}

      {/* メインコンテンツ */}
      <main className={`flex-1 overflow-hidden bg-slate-50 ${isFullscreen ? 'p-0' : 'p-4 lg:p-6'}`}>
        <div className={isFullscreen ? 'h-full' : 'mx-auto w-full max-w-[1600px] h-full'}>
          {projectLoading || loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="flex items-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <span className="ml-3 text-slate-600">ER図を生成しています...</span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                ER図の取得エラー
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !currentProjectId ? (
            <p className="text-sm text-slate-600">
              プロジェクトを選択してください。
            </p>
          ) : (
            <div className="h-full">
              <div className={`bg-white rounded-lg border border-slate-200 p-4 lg:p-6 h-full ${isFullscreen ? '' : 'min-h-[72vh]'}`}>
                <SchemaViewer code={mermaidCode} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
