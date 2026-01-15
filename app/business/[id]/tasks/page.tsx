"use client"

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MobileHeader } from "@/components/layout/mobile-header";
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
import { ArrowLeft, Plus, Eye, Pencil, Trash2, Search, Sparkles } from "lucide-react";
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
import { TableSkeleton } from "@/components/skeleton";
import { getBusinessById } from "@/lib/data/businesses";
import { confirmDelete } from "@/lib/ui/confirm";

export default function BusinessTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<Task[]>([]);
  const [businessArea, setBusinessArea] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRowClick = (taskId: string) => {
    router.push(`/business/${id}/tasks/${taskId}`);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: taskRows, error: taskError }, { data: business, error: businessError }] = await Promise.all([
        listTasksByBusinessId(id),
        getBusinessById(id),
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
        setBusinessArea(business?.area ?? null);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [id]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((task) => {
      const haystack = [
        task.id,
        task.name,
        task.summary,
        task.person,
        task.input,
        task.output,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const handleDelete = async (task: Task) => {
    if (!confirmDelete(`${task.name}（${task.id}）`)) return;
    const { error: deleteError } = await deleteTask(task.id);
    if (deleteError) {
      alert(deleteError);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== task.id));
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
                {businessArea ?? id}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-500">業務領域内の業務タスク（業務プロセスの細分）</p>
          </div>

          {/* ツールバー */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px] rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="業務タスク名、業務タスクID、業務概要、担当者、インプット、アウトプットで検索..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
                />
              </div>
              <Link href={`/business/${id}/tasks/ai-order`}>
                <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                  <Sparkles className="h-4 w-4" />
                  AI修正指示
                </Button>
              </Link>
              <Link href={`/business/manual-add?id=${id}`}>
                <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </Link>
            </div>
          </div>

          {/* テーブル */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスクID</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務タスク</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">業務概要</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">担当者</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">インプット</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">アウトプット</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton cols={7} rows={5} />
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-10 text-center text-[14px] text-rose-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="px-4 py-10 text-center text-[14px] text-slate-500">
                      該当する業務タスクがありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((task) => (
                    <TaskTableRow
                      key={task.id}
                      task={task}
                      businessId={id}
                      onRowClick={() => handleRowClick(task.id)}
                      onDelete={() => handleDelete(task)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}

type TaskTableRowProps = {
  task: Task;
  businessId: string;
  onRowClick: () => void;
  onDelete: () => void;
};

function TaskTableRow({ task, businessId, onRowClick, onDelete }: TaskTableRowProps) {
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
        <div className="max-w-[300px] truncate text-[13px] text-slate-600" title={task.summary}>
          {task.summary}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[100px] truncate text-[13px] text-slate-600" title={task.person}>
          {task.person}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={task.input}>
          {task.input}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="max-w-[150px] truncate text-[13px] text-slate-600" title={task.output}>
          {task.output}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Link href={`/business/${businessId}/tasks/${task.id}`}>
            <Button size="icon" variant="outline" title="照会" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/business/${businessId}/tasks/${task.id}/edit`}>
            <Button size="icon" variant="outline" title="編集" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
              <Pencil className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="icon" variant="outline" title="削除" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
