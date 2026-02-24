"use client"

import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProject } from "@/components/project/project-context";
import { listBaselinesByProject } from "@/lib/mock/data/baselines";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";

export default function BaselinePage() {
  const router = useRouter();
  const { currentProject, currentProjectId, loading: projectLoading } = useProject();

  const baselines = currentProjectId ? listBaselinesByProject(currentProjectId) : [];

  const handleRowClick = (version: string) => {
    router.push(`/baseline/${version}`);
  };

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              ベースライン履歴
            </h1>
            <p className="text-[13px] text-slate-500">
              システムの版管理と変更履歴
            </p>
            <p className="text-[12px] text-slate-500 mt-2">
              現在プロジェクト:{" "}
              <span className="font-mono text-slate-900">{currentProject?.name ?? currentProjectId ?? "(未選択)"}</span>
            </p>
          </div>

          {projectLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
              読み込み中...
            </div>
          ) : !currentProjectId ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-700">
              プロジェクトが選択されていません
            </div>
          ) : baselines.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-white p-6 text-center">
              <p className="text-[13px] text-slate-600">このプロジェクトのベースラインは未設定です。</p>
              <p className="text-[12px] text-slate-500 mt-1">MVPではDB永続化と追加/削除は未実装です。</p>
            </div>
          ) : null}

          {/* Search Bar */}
          <div className="mb-6 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="版番号、概要、日付で検索..."
                className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled
                title="未実装"
                className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50"
              >
                版間差分
              </Button>
              <Button
                disabled
                title="未実装"
                className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    版
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    概要
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    作成日
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    変更要求数
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baselines.map((baseline) => (
                  <TableRow
                    key={baseline.version}
                    className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    onClick={() => handleRowClick(baseline.version)}
                  >
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] text-slate-400">
                          {baseline.version}
                        </span>
                        {baseline.isLatest && (
                          <Badge variant="outline" className="font-mono text-[12px] font-medium border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">
                            最新
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-[14px] font-medium text-slate-900">
                        {baseline.summary}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[12px] text-slate-500">
                        {baseline.date}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">
                          {baseline.changeRequestIds.length}
                        </span>
                        <span className="text-[11px] text-slate-400">件</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="icon"
                          variant="outline"
                          title="照会"
                          onClick={() => handleRowClick(baseline.version)}
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          title="未実装"
                          disabled
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          title="未実装"
                          disabled
                          className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                        >
                          <Trash2 className="h-4 w-4" />
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
