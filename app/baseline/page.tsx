"use client"

import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye } from "lucide-react";

const baselines = [
  {
    version: "v2.1",
    summary: "電子帳簿保存法対応とワークフロー改善",
    date: "2024-02-15",
    changeRequests: 3,
    isLatest: true,
  },
  {
    version: "v2.0",
    summary: "インボイス制度対応とマスタ統合",
    date: "2024-01-20",
    changeRequests: 5,
    isLatest: false,
  },
  {
    version: "v1.5",
    summary: "請求書出力テンプレート刷新とUI改善",
    date: "2023-11-05",
    changeRequests: 2,
    isLatest: false,
  },
];

export default function BaselinePage() {
  const router = useRouter();

  const handleRowClick = (version: string) => {
    router.push(`/baseline/${version}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="ベースライン履歴"
            description="版の管理と変更履歴の確認"
          />

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="text-lg font-semibold text-slate-900">版一覧</div>
            <div className="flex items-center gap-3">
              <Button variant="outline">版間差分</Button>
              <Button className="bg-brand hover:bg-brand-600 gap-2">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </div>
          </div>

          {/* テーブル */}
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>版</TableHead>
                  <TableHead>概要</TableHead>
                  <TableHead>作成日</TableHead>
                  <TableHead>変更要求数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {baselines.map((baseline) => (
                  <TableRow
                    key={baseline.version}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(baseline.version)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {baseline.version}
                        </span>
                        {baseline.isLatest && (
                          <Badge className="bg-brand-50 text-brand-700 border-brand-100 hover:bg-brand-100">
                            最新
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {baseline.summary}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {baseline.date}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600">
                      {baseline.changeRequests}件
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="outline" title="照会">
                          <Eye className="h-4 w-4" />
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
