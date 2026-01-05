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
import { Eye, Pencil, Trash2, Layers } from "lucide-react";

const businesses = [
  { id: "BIZ-001", name: "請求業務", area: "FI", business: 12, system: 28 },
  { id: "BIZ-002", name: "会計業務", area: "FI", business: 15, system: 35 },
  { id: "BIZ-003", name: "販売業務", area: "SD", business: 18, system: 42 },
  { id: "BIZ-004", name: "在庫業務", area: "MM", business: 10, system: 25 },
  { id: "BIZ-005", name: "購買業務", area: "MM", business: 14, system: 32 },
  { id: "BIZ-006", name: "生産管理業務", area: "PP", business: 20, system: 48 },
];

const getAreaColor = (area: string) => {
  switch (area) {
    case "FI":
      return "bg-sky-50 text-sky-700";
    case "SD":
      return "bg-indigo-50 text-indigo-700";
    case "MM":
      return "bg-amber-50 text-amber-700";
    case "PP":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "";
  }
};

export default function BusinessPage() {
  const router = useRouter();

  const handleRowClick = (bizId: string) => {
    router.push(`/business/${bizId}/tasks`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="業務一覧"
            description="業務体系の管理(ベースライン/仕様)"
          />

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px]">
              <SearchBox placeholder="業務名、ID、領域で検索..." />
            </div>
            <Button variant="outline" className="gap-2">
              <Layers className="h-4 w-4" />
              AI修正指示
            </Button>
          </div>

          {/* テーブル */}
          <div className="rounded-lg border border-slate-100 bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>業務名</TableHead>
                  <TableHead>領域</TableHead>
                  <TableHead>業務要件数</TableHead>
                  <TableHead>システム要件数</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((biz) => (
                  <TableRow
                    key={biz.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(biz.id)}
                  >
                    <TableCell className="text-xs font-semibold text-slate-500">
                      {biz.id}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-900">
                      {biz.name}
                    </TableCell>
                    <TableCell>
                      <Badge className={getAreaColor(biz.area)}>{biz.area}</Badge>
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600">
                      {biz.business}
                    </TableCell>
                    <TableCell className="text-sm font-semibold text-slate-600">
                      {biz.system}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/business/${biz.id}/tasks`}>
                          <Button size="icon" variant="outline" title="照会">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="outline" title="編集">
                          <Pencil className="h-4 w-4 text-brand" />
                        </Button>
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
