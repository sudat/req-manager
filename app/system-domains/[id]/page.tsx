"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
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
import { ArrowLeft, Plus, Eye, Pencil, Trash2, Search } from "lucide-react";
import type { SystemFunction, SrfCategory, SrfStatus } from "@/lib/mock/data/types";
import { listSystemFunctionsByDomain, deleteSystemFunction } from "@/lib/data/system-functions";
import { confirmDelete } from "@/lib/ui/confirm";
import { getSystemDomainById } from "@/lib/data/system-domains";

const statusLabels: Record<string, string> = {
  not_implemented: "未実装",
  implementing: "実装中",
  testing: "テスト中",
  implemented: "実装済",
};

const categoryLabels: Record<string, string> = {
  screen: "画面",
  internal: "内部",
  interface: "IF",
};

export default function SystemDomainFunctionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<SystemFunction[]>([]);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SrfStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<SrfCategory | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRowClick = (srfId: string) => {
    router.push(`/system-domains/${id}/functions/${srfId}`);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: domain, error: domainError }, { data, error: fetchError }] = await Promise.all([
        getSystemDomainById(id),
        listSystemFunctionsByDomain(id),
      ]);
      if (!active) return;
      const mergedError = domainError ?? fetchError;
      if (mergedError) {
        setError(mergedError);
        setItems([]);
        setDomainName(null);
      } else {
        setError(null);
        setDomainName(domain?.name ?? null);
        setItems(data ?? []);
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
    return items.filter((item) => {
      const matchesQuery = normalized
        ? [item.id, item.designDocNo, item.summary].join(" ").toLowerCase().includes(normalized)
        : true;
      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesCategory = categoryFilter === "all" ? true : item.category === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [items, query, statusFilter, categoryFilter]);

  const handleDelete = async (srf: SystemFunction) => {
    if (!confirmDelete(`${srf.summary}（${srf.id}）`)) return;
    const { error: deleteError } = await deleteSystemFunction(srf.id);
    if (deleteError) {
      alert(deleteError);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== srf.id));
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* Page Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
                システム機能一覧
              </h1>
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5">
                {id}
              </Badge>
            </div>
            <p className="text-[13px] text-slate-500">
              {domainName ? `${domainName} のシステム機能` : "システム機能を一覧管理"}
            </p>
          </div>

          {/* ツールバー */}
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="システム機能を検索..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SrfStatus | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="すべてのステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべてのステータス</SelectItem>
                <SelectItem value="implemented">実装済</SelectItem>
                <SelectItem value="implementing">実装中</SelectItem>
                <SelectItem value="testing">テスト中</SelectItem>
                <SelectItem value="not_implemented">未実装</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as SrfCategory | "all")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="すべての機能分類" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての機能分類</SelectItem>
                <SelectItem value="screen">画面</SelectItem>
                <SelectItem value="internal">内部</SelectItem>
                <SelectItem value="interface">IF</SelectItem>
              </SelectContent>
            </Select>
            <Link href={`/system-domains/${id}/functions/create`}>
              <Button className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800 gap-2">
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </Link>
            <Link href="/system-domains">
              <Button variant="outline" className="h-8 gap-2 text-[14px]">
                <ArrowLeft className="h-4 w-4" />
                システム領域一覧へ
              </Button>
            </Link>
          </div>

          {/* テーブル */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    設計書No
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    機能分類
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    機能概要
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    ステータス
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-slate-500">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-rose-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="px-4 py-10 text-center text-[14px] text-slate-500">
                      該当するシステム機能がありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((srf) => (
                    <TableRow
                      key={srf.id}
                      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                      onClick={() => handleRowClick(srf.id)}
                    >
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-[12px] text-slate-400">{srf.id}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-[13px] text-slate-700">{srf.designDocNo}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                          {categoryLabels[srf.category]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-[14px] font-medium text-slate-900">{srf.summary}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                          {statusLabels[srf.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Link href={`/system-domains/${id}/functions/${srf.id}`}>
                            <Button
                              size="icon"
                              variant="outline"
                              title="照会"
                              className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/system-domains/${id}/functions/${srf.id}/edit`}>
                            <Button
                              size="icon"
                              variant="outline"
                              title="編集"
                              className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="outline"
                            title="削除"
                            className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                            onClick={() => handleDelete(srf)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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
