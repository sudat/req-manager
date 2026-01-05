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

const tickets = [
  {
    id: "CR-001",
    title: "インボイス制度対応",
    business: ["請求業務", "経理業務"],
    areas: ["FI", "SD"],
    status: "適用済",
    versions: ["v2.0", "v2.1"],
    date: "2024-01-15",
  },
  {
    id: "CR-002",
    title: "電子帳簿保存法対応",
    business: ["請求業務", "経理業務", "+1"],
    areas: ["FI", "SD", "MM"],
    status: "承認済",
    versions: ["v2.1"],
    date: "2024-02-01",
  },
  {
    id: "CR-003",
    title: "承認ワークフロー改善",
    business: ["購買業務", "経費精算業務"],
    areas: ["MM", "FI"],
    status: "レビュー中",
    versions: ["未適用"],
    date: "2024-02-10",
  },
  {
    id: "CR-004",
    title: "在庫管理機能強化",
    business: ["在庫管理業務", "購買業務"],
    areas: ["MM"],
    status: "オープン",
    versions: ["未適用"],
    date: "2024-02-15",
  },
  {
    id: "CR-005",
    title: "取引先マスタ統合",
    business: ["販売業務", "購買業務", "+1"],
    areas: ["SD", "MM", "FI"],
    status: "レビュー中",
    versions: ["未適用"],
    date: "2024-02-20",
  },
];

const getStatusVariant = (status: string) => {
  switch (status) {
    case "適用済":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    case "承認済":
      return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
    case "レビュー中":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100";
    case "オープン":
      return "bg-amber-50 text-amber-700 hover:bg-amber-100";
    default:
      return "";
  }
};

const getAreaColor = (area: string) => {
  switch (area) {
    case "FI":
      return "bg-sky-50 text-sky-700 hover:bg-sky-100";
    case "SD":
      return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
    case "MM":
      return "bg-amber-50 text-amber-700 hover:bg-amber-100";
    default:
      return "";
  }
};

export default function TicketsPage() {
  const router = useRouter();

  const handleRowClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="変更要求一覧"
            description="仕様変更のチケットを管理"
          />

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 gap-3 min-w-[300px]">
              <SearchBox placeholder="変更要求を検索..." />
              <Select>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="すべてのステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステータス</SelectItem>
                  <SelectItem value="open">オープン</SelectItem>
                  <SelectItem value="review">レビュー中</SelectItem>
                  <SelectItem value="approved">承認済</SelectItem>
                  <SelectItem value="applied">適用済</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="すべての領域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべての領域</SelectItem>
                  <SelectItem value="fi">FI</SelectItem>
                  <SelectItem value="sd">SD</SelectItem>
                  <SelectItem value="mm">MM</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Link href="/tickets/create">
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
                  <TableHead>タイトル</TableHead>
                  <TableHead>影響業務</TableHead>
                  <TableHead>影響領域</TableHead>
                  <TableHead>ステータス</TableHead>
                  <TableHead>適用先版</TableHead>
                  <TableHead>起票日</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleRowClick(ticket.id)}
                  >
                    <TableCell className="font-medium">{ticket.id}</TableCell>
                    <TableCell>{ticket.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {ticket.business.map((b, i) => (
                          <Badge
                            key={i}
                            className="bg-brand-50 text-brand-700 hover:bg-brand-100"
                          >
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {ticket.areas.map((area, i) => (
                          <Badge key={i} className={getAreaColor(area)}>
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusVariant(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {ticket.versions.map((v, i) => (
                          <Badge key={i} variant="outline">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{ticket.date}</TableCell>
                    <TableCell>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button size="icon" variant="outline" title="照会">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/tickets/${ticket.id}/edit`}>
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
