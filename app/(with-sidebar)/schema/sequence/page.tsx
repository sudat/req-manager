"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown/markdown-renderer";
import { Button } from "@/components/ui/button";
import { SystemFunctionSelectionDialog } from "@/components/forms/SystemFunctionSelectionDialog";
import { DdDetailDialog } from "@/components/schema/DdDetailDialog";

interface SystemFunction {
  id: string;
  title: string;
  systemDomainId?: string | null;
  domainName?: string;
}

interface SequenceDiagramResponse {
  mermaidCode: string;
  sfInfo: {
    id: string;
    name: string;
    description: string;
  };
  ddCount: number;
  ddMapping: Record<string, string>;
}

/**
 * シーケンス図表示ページ
 *
 * SF（システム機能）を選択して、その機能の処理フローをシーケンス図で表示する
 */
export default function SequenceDiagramPage() {
  const { currentProjectId, loading: projectLoading } = useProject();
  const [systemFunctions, setSystemFunctions] = useState<SystemFunction[]>([]);
  const [selectedSrfId, setSelectedSrfId] = useState<string>("");
  const [diagramData, setDiagramData] = useState<SequenceDiagramResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [sfDialogOpen, setSfDialogOpen] = useState(false);

  // DD詳細モーダル用state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDdId, setSelectedDdId] = useState<string>("");

  // DD参加者クリック時のハンドラ
  const handleParticipantClick = (alias: string) => {
    const ddId = diagramData?.ddMapping[alias];
    if (!ddId) {
      // ddMappingにないエイリアス（DB/EventBus等）は無視
      return;
    }

    setSelectedDdId(ddId);
    setModalOpen(true);
  };

  // SF一覧を取得
  useEffect(() => {
    const fetchSystemFunctions = async () => {
      if (projectLoading || !currentProjectId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/system-functions?projectId=${currentProjectId}`
        );

        if (!response.ok) {
          throw new Error("システム機能の取得に失敗しました");
        }

        const data = await response.json();
        setSystemFunctions(data.systemFunctions || []);
      } catch (err) {
        console.error("Failed to fetch system functions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "システム機能の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSystemFunctions();
  }, [currentProjectId, projectLoading]);

  // 選択されたSFのシーケンス図を取得
  useEffect(() => {
    const fetchSequenceDiagram = async () => {
      if (!selectedSrfId || !currentProjectId) {
        setDiagramData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/schema/sequence?srfId=${selectedSrfId}&projectId=${currentProjectId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "シーケンス図の取得に失敗しました");
        }

        const data = await response.json();
        setDiagramData(data);
      } catch (err) {
        console.error("Failed to fetch sequence diagram:", err);
        setError(
          err instanceof Error
            ? err.message
            : "シーケンス図の取得中にエラーが発生しました"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSequenceDiagram();
  }, [selectedSrfId, currentProjectId]);

  // システム領域ごとにグループ化
  const groupedSFs = systemFunctions.reduce((acc, sf) => {
    const domainName = sf.domainName || "その他";
    if (!acc[domainName]) {
      acc[domainName] = [];
    }
    acc[domainName].push(sf);
    return acc;
  }, {} as Record<string, SystemFunction[]>);

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
              <BreadcrumbPage>シーケンス図（処理フロー）</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              シーケンス図（処理フロー）
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              システム機能の処理フローを可視化します
            </p>
          </div>
          {systemFunctions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setSfDialogOpen(true)}
                className="w-[400px] justify-start text-left"
              >
                {selectedSrfId ? (
                  <span className="truncate">
                    {selectedSrfId} - {systemFunctions.find(sf => sf.id === selectedSrfId)?.title || ""}
                  </span>
                ) : (
                  <span className="text-slate-400">システム機能を選択してください</span>
                )}
              </Button>
              {selectedSrfId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSrfId("")}
                >
                  クリア
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto hide-scrollbar bg-slate-50 p-6">
        <div className="mx-auto max-w-7xl h-full">
          {projectLoading || loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="flex items-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                <span className="ml-3 text-slate-600">
                  {selectedSrfId ? "シーケンス図を生成しています..." : "読み込み中..."}
                </span>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6">
              <h3 className="text-sm font-semibold text-red-800 mb-2">
                エラー
              </h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : !currentProjectId ? (
            <p className="text-sm text-slate-600">
              プロジェクトを選択してください。
            </p>
          ) : !selectedSrfId ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
              <p className="text-slate-500">
                上部のドロップダウンからシステム機能を選択してください
              </p>
            </div>
          ) : diagramData ? (
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {diagramData.sfInfo.name}
                  </h2>
                  {diagramData.sfInfo.description && (
                    <button
                      type="button"
                      onClick={() => setIsDetailOpen(!isDetailOpen)}
                      className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      機能詳細
                      {isDetailOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
                {diagramData.sfInfo.description && isDetailOpen && (
                  <div className="mt-3 text-sm text-slate-600 max-w-3xl p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <MarkdownRenderer content={diagramData.sfInfo.description} />
                  </div>
                )}
                {diagramData.ddCount > 0 && (
                  <p className="text-xs text-slate-400 mt-2">
                    ({diagramData.ddCount}件の設計書から生成)
                  </p>
                )}
              </div>
              <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 min-h-0 min-h-[400px]">
                <SchemaViewer
                  code={diagramData.mermaidCode}
                  onParticipantClick={handleParticipantClick}
                  ddMapping={diagramData.ddMapping}
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* SF選択ダイアログ */}
      <SystemFunctionSelectionDialog
        isOpen={sfDialogOpen}
        onClose={() => setSfDialogOpen(false)}
        title="システム機能を選択"
        systemFunctions={systemFunctions.map(sf => ({ id: sf.id, title: sf.title, domainName: sf.domainName }))}
        selectedId={selectedSrfId || null}
        onSelect={(sfId) => setSelectedSrfId(sfId)}
      />

      {/* DD詳細モーダル */}
      {selectedDdId && currentProjectId && (
        <DdDetailDialog
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedDdId("");
          }}
          ddId={selectedDdId}
          projectId={currentProjectId}
        />
      )}
    </div>
  );
}
