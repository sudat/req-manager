"use client"

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { SearchBox } from "@/components/ui/search-box";
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
import { ArrowLeft, Plus, Eye, Pencil, Trash2 } from "lucide-react";

const tasks = [
  {
    id: "TASK-001",
    name: "請求書発行",
    summary: "請求対象を抽出し、請求書を生成して発行する。",
    person: "経理担当",
    input: "請求対象データ、契約情報",
    output: "請求書（PDF/電子）",
  },
  {
    id: "TASK-002",
    name: "入金消込",
    summary: "入金データを取り込み、請求と突合して消込処理を行う。",
    person: "経理担当",
    input: "入金データ、請求データ",
    output: "消込結果、未消込一覧",
  },
  {
    id: "TASK-003",
    name: "債権管理",
    summary: "未回収債権を把握し、督促・与信見直し等の対応を行う。",
    person: "回収担当",
    input: "債権残高、入金状況",
    output: "督促状況、回収計画",
  },
];

export default function BusinessTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const handleRowClick = (taskId: string) => {
    router.push(`/business/${id}/tasks/${taskId}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          {/* ヘッダー */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-semibold text-slate-900">業務一覧（詳細）</h1>
              <Badge className="bg-brand-50 text-brand-700 border-brand-100 text-sm">
                {id}
              </Badge>
            </div>
            <p className="text-sm text-slate-600">業務領域内の業務タスク（業務プロセスの細分）</p>
          </div>

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px]">
              <SearchBox placeholder="業務タスク名、業務タスクID、業務概要、担当者、インプット、アウトプットで検索..." />
            </div>
            <div className="flex items-center gap-3">
              <Link href="/business">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  一覧へ戻る
                </Button>
              </Link>
              <Link href={`/business/manual-add?id=${id}`}>
                <Button className="bg-brand hover:bg-brand-600 gap-2">
                  <Plus className="h-4 w-4" />
                  追加
                </Button>
              </Link>
            </div>
          </div>

          {/* テーブル */}
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>業務タスクID</TableHead>
                  <TableHead>業務タスク</TableHead>
                  <TableHead>業務概要</TableHead>
                  <TableHead>担当者</TableHead>
                  <TableHead>インプット</TableHead>
                  <TableHead>アウトプット</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(task.id)}
                  >
                    <TableCell className="text-xs font-semibold text-slate-500">
                      {task.id}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900">
                      {task.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {task.summary}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {task.person}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {task.input}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {task.output}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/business/${id}/tasks/${task.id}`}>
                          <Button size="icon" variant="outline" title="照会">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/business/${id}/tasks/${task.id}/edit`}>
                          <Button size="icon" variant="outline" title="編集">
                            <Pencil className="h-4 w-4 text-brand" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="outline" title="削除">
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
}
