"use client"

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkles, Plus, Loader2 } from "lucide-react";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRowActions } from "@/components/ui/table-row-actions";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Task } from "@/lib/domain";
import { listTasksByBusinessId, deleteTask } from "@/lib/data/tasks";
import { stripMarkdown } from "@/lib/utils";
import { parseYamlKeySourceList } from "@/lib/utils/yaml";
import { TableSkeleton } from "@/components/skeleton";
import { useBusinessByKey } from "@/hooks/use-business-by-key";
import { confirmDelete } from "@/lib/ui/confirm";
import { useProject } from "@/components/project/project-context";
import { DndContext, closestCenter, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableTaskRow } from "@/components/tasks/sortable-task-row";

export default function BusinessTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: businessKey } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<Task[]>([]);
  const [businessArea, setBusinessArea] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedItems, setReorderedItems] = useState<Task[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { currentProjectId, loading: projectLoading } = useProject();
  const { businessId, businessArea: resolvedArea, loading: businessLoading, error: businessError } =
    useBusinessByKey(businessKey);

  const routeArea = resolvedArea ?? businessKey;

  const handleRowClick = (taskId: string) => {
    router.push(`/business/${routeArea}/${taskId}`);
  };

  useEffect(() => {
    if (projectLoading || businessLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません");
      setItems([]);
      setBusinessArea(null);
      setLoading(false);
      return;
    }
    if (!businessId) {
      setError(businessError ?? "指定された業務領域が見つかりません");
      setItems([]);
      setBusinessArea(null);
      setLoading(false);
      return;
    }
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: taskRows, error: taskError }] = await Promise.all([
        listTasksByBusinessId(businessId, currentProjectId),
      ]);
      if (!active) return;
      const mergedError = taskError ?? businessError;
      if (mergedError) {
        setError(mergedError);
        setItems([]);
        setBusinessArea(null);
      } else {
        setError(null);
        setItems(taskRows ?? []);
        setBusinessArea(resolvedArea ?? null);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [businessId, businessError, currentProjectId, projectLoading, businessLoading, resolvedArea]);

  useEffect(() => {
    if (businessArea && businessArea !== businessKey) {
      router.replace(`/business/${businessArea}`);
    }
  }, [businessArea, businessKey, router]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((task) => {
      const haystack = [
        task.id,
        task.name,
        task.summary,
        task.businessContext,
        task.processSteps,
        task.input,
        task.output,
        task.conceptIdsYaml,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const handleDelete = async (task: Task) => {
    if (!confirmDelete(`${task.name}（${task.id}）`)) return;
    const { error: deleteError } = await deleteTask(task.id, currentProjectId ?? undefined);
    if (deleteError) {
      alert(deleteError);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== task.id));
  };

  // 並び替えモード開始
  const handleEnterReorderMode = () => {
    setReorderedItems(filtered);
    setIsReorderMode(true);
    setQuery(""); // 検索フィルタをクリア
  };

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setReorderedItems((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  // 並び替え保存
  const handleSaveReorder = async () => {
    setIsSaving(true);
    try {
      const updates = reorderedItems.map((task, index) => ({
        id: task.id,
        sortOrder: index,
      }));

      const response = await fetch("/api/business/tasks/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, projectId: currentProjectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "保存に失敗しました");
      }

      // 成功：データを再読み込み
      const { data: taskRows, error: taskError } = await listTasksByBusinessId(businessId!, currentProjectId);
      if (taskError) {
        alert("保存しましたが、データの再読み込みに失敗しました");
      } else {
        setItems(taskRows ?? []);
      }
      setIsReorderMode(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "保存に失敗しました");
    } finally {
      setIsSaving(false);
    }
  };

  // 並び替えキャンセル
  const handleCancelReorder = () => {
    setReorderedItems([]);
    setIsReorderMode(false);
  };

  return (
    <>
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* パンくずリスト */}
          <Breadcrumb className="mb-4">
            <BreadcrumbList>
              <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/business">業務領域一覧</Link>
              </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
              <BreadcrumbPage>業務一覧（詳細）</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* ヘッダー */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">業務一覧（詳細）</h1>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5">
                {businessArea ?? routeArea}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-500">業務領域内の業務タスク（業務プロセスの細分）</p>
          </div>

          {/* ツールバー */}
          <SearchToolbar
            value={query}
            onChange={setQuery}
            placeholder="業務タスク名、ID、業務概要、inputs/outputsで検索..."
            disabled={isReorderMode}
            actions={[
              ...(!isReorderMode ? [
                {
                  label: 'AIで追加',
                  href: routeArea ? `/chat?screen=BD&bdId=${routeArea}` : '/chat',
                  icon: Sparkles,
                  variant: 'ai' as const,
                },
                {
                  label: '新規作成',
                  href: `/business/${routeArea}/create`,
                  icon: Plus,
                },
              ] : []),
              ...(isReorderMode ? [
                {
                  label: '保存',
                  onClick: handleSaveReorder,
                  disabled: isSaving,
                  icon: isSaving ? undefined : Plus,
                } as const,
                {
                  label: 'キャンセル',
                  onClick: handleCancelReorder,
                  disabled: isSaving,
                } as const,
              ] : [{
                label: '並び替え',
                onClick: handleEnterReorderMode,
                disabled: filtered.length < 2,
              } as const]),
            ]}
          />

          {/* テーブル */}
          {isReorderMode ? (
            // 並び替えモードのテーブル
            <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={reorderedItems.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200">
                        <TableHead className="w-10 px-2 py-3"></TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスクID</TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスク</TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務概要</TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">インプット</TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">アウトプット</TableHead>
                        <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reorderedItems.map((task) => (
                        <SortableTaskRow
                          key={task.id}
                          task={task}
                          businessArea={routeArea}
                          onRowClick={() => handleRowClick(task.id)}
                          onDelete={() => handleDelete(task)}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </SortableContext>
              </DndContext>
            </div>
          ) : (
            // 通常のテーブル
            <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスクID</TableHead>
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスク</TableHead>
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務概要</TableHead>
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">インプット</TableHead>
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">アウトプット</TableHead>
                    <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableSkeleton cols={6} rows={5} />
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-rose-600">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-slate-500">
                        該当する業務タスクがありません。
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((task) => (
                      <TaskTableRow
                        key={task.id}
                        task={task}
                        businessArea={routeArea}
                        onRowClick={() => handleRowClick(task.id)}
                        onDelete={() => handleDelete(task)}
                      />
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

type TaskTableRowProps = {
  task: Task;
  businessArea: string;
  onRowClick: () => void;
  onDelete: () => void;
};

function TaskTableRow({ task, businessArea, onRowClick, onDelete }: TaskTableRowProps) {
  const formatKeySource = (value: string) => {
    const parsed = parseYamlKeySourceList(value);
    const items = parsed.value.filter((item) => item.name || item.source);
    if (items.length === 0) return value;
    return items
      .map((item) => {
        const name = item.name || "—";
        const source = item.source ? ` / ${item.source}` : "";
        return `${name}${source}`;
      })
      .join(" | ");
  };

  const inputLabel = formatKeySource(task.input);
  const outputLabel = formatKeySource(task.output);

  return (
    <TableRow
      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
      onClick={onRowClick}
    >
      <TableCell className="px-4 py-3">
        <span className="font-mono text-[12px] text-slate-400">{task.id}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[14px] font-medium text-slate-900">{task.name}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[300px] truncate text-[13px] text-slate-600" title={stripMarkdown(task.summary)}>
          {stripMarkdown(task.summary)}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={inputLabel}>
          {inputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={outputLabel}>
          {outputLabel}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <TableRowActions
          viewHref={`/business/${businessArea}/${task.id}`}
          editHref={`/business/${businessArea}/${task.id}/edit`}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
