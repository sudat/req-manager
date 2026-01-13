"use client"

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
import { Eye, Pencil, Trash2, Search } from "lucide-react";
import { listBusinesses, deleteBusiness } from "@/lib/data/businesses";
import type { Business } from "@/lib/mock/data/types";
import { confirmDelete } from "@/lib/ui/confirm";

export default function BusinessPage() {
  const router = useRouter();
  const [items, setItems] = useState<Business[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleRowClick = (bizId: string) => {
    router.push(`/business/${bizId}/tasks`);
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await listBusinesses();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setItems([]);
      } else {
        setError(null);
        setItems(data ?? []);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((biz) => {
      const haystack = [
        biz.id,
        biz.name,
        biz.area,
        biz.summary,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  const handleDelete = async (biz: Business) => {
    if (!confirmDelete(`${biz.name}（${biz.id}）`)) return;
    const { error: deleteError } = await deleteBusiness(biz.id);
    if (deleteError) {
      alert(deleteError);
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== biz.id));
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          {/* Page Header */}
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
                業務一覧
              </h1>
            </div>
            <p className="text-[13px] text-slate-500">
              業務体系の管理（ベースライン/仕様）
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6 flex items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="業務名、ID、領域で検索..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Link href="/business/add">
              <Button className="h-8 px-4 text-[14px] font-medium bg-slate-900 hover:bg-slate-800">
                追加
              </Button>
            </Link>
          </div>

          {/* Table Container */}
          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    業務名
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    領域
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    業務要件数
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    システム要件数
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
                      該当する業務がありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((biz) => (
                  <TableRow
                    key={biz.id}
                    className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                    onClick={() => handleRowClick(biz.id)}
                  >
                    <TableCell className="px-4 py-3">
                      <span className="font-mono text-[12px] text-slate-400">
                        {biz.id}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-[14px] font-medium text-slate-900">
                        {biz.name}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-[12px] font-medium border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5">
                        {biz.area}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">
                          {biz.businessReqCount}
                        </span>
                        <span className="text-[11px] text-slate-400">件</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">
                          {biz.systemReqCount}
                        </span>
                        <span className="text-[11px] text-slate-400">件</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Link href={`/business/${biz.id}/tasks`}>
                          <Button
                            size="icon"
                            variant="outline"
                            title="照会"
                            className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/business/${biz.id}/edit`}>
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
                          onClick={() => handleDelete(biz)}
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
