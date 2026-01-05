"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
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
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";

const ideas = [
  {
    id: "C001",
    name: "インボイス制度",
    synonyms: ["適格請求書", "適格請求書等保存方式", "+1"],
    domains: ["FI", "SD", "MM"],
    count: 24,
  },
  {
    id: "C002",
    name: "請求書発行",
    synonyms: ["Invoice Generation", "請求書作成", "+1"],
    domains: ["SD", "FI"],
    count: 18,
  },
  {
    id: "C003",
    name: "消費税計算",
    synonyms: ["Tax Calculation", "税額計算", "+1"],
    domains: ["FI", "SD"],
    count: 15,
  },
  {
    id: "C004",
    name: "取引先マスタ",
    synonyms: ["Customer Master", "Vendor Master", "+1"],
    domains: ["SD", "MM", "FI"],
    count: 32,
  },
  {
    id: "C005",
    name: "承認ワークフロー",
    synonyms: ["Approval Workflow", "承認フロー", "+1"],
    domains: ["SD", "MM", "FI", "HR"],
    count: 28,
  },
];

const getAreaColor = (area: string) => {
  switch (area) {
    case "FI":
      return "bg-sky-50 text-sky-700";
    case "SD":
      return "bg-indigo-50 text-indigo-700";
    case "MM":
      return "bg-amber-50 text-amber-700";
    case "HR":
      return "bg-rose-50 text-rose-700";
    default:
      return "";
  }
};

export default function IdeasPage() {
  const router = useRouter();

  const handleRowClick = (ideaId: string) => {
    router.push(`/ideas/${ideaId}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="概念辞書"
            description="用語の同義語、影響領域、必読ドキュメントを管理"
          />

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px]">
              <SearchBox placeholder="概念名または同義語で検索..." />
            </div>
            <Link href="/ideas/add">
              <Button className="bg-brand hover:bg-brand-600 gap-2">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </Link>
          </div>

          {/* テーブル */}
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>概念ID</TableHead>
                  <TableHead>概念名</TableHead>
                  <TableHead>同義語</TableHead>
                  <TableHead>影響領域</TableHead>
                  <TableHead>使用要件数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.map((idea) => (
                  <TableRow
                    key={idea.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(idea.id)}
                  >
                    <TableCell className="text-xs font-semibold text-slate-500">
                      {idea.id}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900">
                      {idea.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {idea.synonyms.map((s, i) => (
                          <Badge
                            key={i}
                            className={
                              s.startsWith("+")
                                ? "bg-slate-200 text-slate-600"
                                : "bg-slate-100 text-slate-600"
                            }
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {idea.domains.map((domain, i) => (
                          <Badge key={i} className={getAreaColor(domain)}>
                            {domain}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600">
                      {idea.count}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/ideas/${idea.id}`}>
                          <Button size="icon" variant="outline" title="照会">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/ideas/${idea.id}/edit`}>
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
