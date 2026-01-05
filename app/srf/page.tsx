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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { srfData } from "@/lib/mock/srf-knowledge";

const getStatusVariant = (status: string) => {
  switch (status) {
    case "実装済":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    case "実装中":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100";
    case "テスト中":
      return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
    case "未実装":
      return "bg-slate-50 text-slate-700 hover:bg-slate-100";
    default:
      return "";
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case "画面":
      return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
    case "内部":
      return "bg-amber-50 text-amber-700 hover:bg-amber-100";
    case "IF":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    default:
      return "bg-slate-50 text-slate-700 hover:bg-slate-100";
  }
};

export default function SrfPage() {
  const router = useRouter();

  const handleRowClick = (id: string) => {
    router.push(`/srf/${id}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="システム機能一覧"
            description="システム機能を一覧管理"
          />

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px]">
              <SearchBox placeholder="システム機能を検索..." />
              <Select>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="すべてのステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="implemented">実装済</SelectItem>
                  <SelectItem value="implementing">実装中</SelectItem>
                  <SelectItem value="testing">テスト中</SelectItem>
                  <SelectItem value="not-implemented">未実装</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="すべての機能分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての機能分類</SelectItem>
                  <SelectItem value="ui">画面</SelectItem>
                  <SelectItem value="internal">内部</SelectItem>
                  <SelectItem value="if">IF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Link href="/srf/create">
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
                  <TableHead>ID</TableHead>
                  <TableHead>設計書No</TableHead>
                  <TableHead>機能分類</TableHead>
                  <TableHead>機能概要</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {srfData.map((srf) => (
                  <TableRow
                    key={srf.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(srf.id)}
                  >
                    <TableCell className="font-medium">{srf.id}</TableCell>
                    <TableCell>{srf.designDocNo}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(srf.category)}>
                        {srf.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{srf.summary}</TableCell>
                    <TableCell>
                      <Badge className={getStatusVariant(srf.status)}>
                        {srf.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/srf/${srf.id}`}>
                          <Button size="icon" variant="outline" title="照会">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/srf/${srf.id}/edit`}>
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
