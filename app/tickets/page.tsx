"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
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
import { Plus, Eye, Pencil, Trash2, Search } from "lucide-react";

const tickets = [
  {
    id: "CR-001",
    title: "インボイス制度対応",
    business: ["債権管理"],
    areas: ["AR"],
    status: "適用済",
    versions: ["v2.0", "v2.1"],
    date: "2024-01-15",
  },
  {
    id: "CR-002",
    title: "電子帳簿保存法対応",
    business: ["一般会計"],
    areas: ["GL"],
    status: "承認済",
    versions: ["v2.1"],
    date: "2024-02-01",
  },
  {
    id: "CR-003",
    title: "支払依頼フロー改善",
    business: ["債務管理"],
    areas: ["AP"],
    status: "レビュー中",
    versions: ["未適用"],
    date: "2024-02-10",
  },
  {
    id: "CR-004",
    title: "入金消込自動化",
    business: ["債権管理"],
    areas: ["AR"],
    status: "オープン",
    versions: ["未適用"],
    date: "2024-02-15",
  },
  {
    id: "CR-005",
    title: "仕訳自動転換機能",
    business: ["一般会計"],
    areas: ["GL"],
    status: "レビュー中",
    versions: ["未適用"],
    date: "2024-02-20",
  },
];


export default function TicketsPage() {
  const router = useRouter();

  const handleRowClick = (ticketId: string) => {
    router.push(`/tickets/${ticketId}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              変更要求一覧
            </h1>
            <p className="text-[13px] text-slate-500">
              仕様変更のチケットを管理
            </p>
          </div>

          {/* ツールバー */}
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="変更要求を検索..."
                className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
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
                <SelectItem value="ar">AR</SelectItem>
                <SelectItem value="ap">AP</SelectItem>
                <SelectItem value="gl">GL</SelectItem>
              </SelectContent>
            </Select>
            <Link href="/tickets/create">
              <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </Link>
          </div>

          {/* テーブル */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">ID</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">タイトル</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">影響業務</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">影響領域</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">ステータス</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">適用先版</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">起票日</TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    onClick={() => handleRowClick(ticket.id)}
                  >
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[12px] text-slate-400">{ticket.id}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-[14px] font-medium text-slate-900">{ticket.title}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.business.map((b, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]"
                          >
                            {b}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.areas.map((area, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.versions.map((v, i) => (
                          <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                            {v}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-[13px] text-slate-700">{ticket.date}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/tickets/${ticket.id}`}>
                          <Button size="icon" variant="outline" title="照会" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/tickets/${ticket.id}/edit`}>
                          <Button size="icon" variant="outline" title="編集" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button size="icon" variant="outline" title="削除" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900">
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
