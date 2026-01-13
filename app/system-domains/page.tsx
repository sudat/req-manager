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
import { Search, Settings } from "lucide-react";
import { listSystemDomains } from "@/lib/data/system-domains";
import { listSystemFunctions } from "@/lib/data/system-functions";
import type { SystemDomain } from "@/lib/data/system-domains";
import type { SystemFunction } from "@/lib/mock/data/types";

export default function SystemDomainsPage() {
  const router = useRouter();
  const [domains, setDomains] = useState<SystemDomain[]>([]);
  const [functions, setFunctions] = useState<SystemFunction[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: domainRows, error: domainError }, { data: functionRows, error: functionError }] = await Promise.all([
        listSystemDomains(),
        listSystemFunctions(),
      ]);
      if (!active) return;
      const fetchError = domainError ?? functionError;
      if (fetchError) {
        setError(fetchError);
        setDomains([]);
        setFunctions([]);
      } else {
        setError(null);
        setDomains(domainRows ?? []);
        setFunctions(functionRows ?? []);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    functions.forEach((fn) => {
      const domainId = fn.systemDomainId ?? "";
      if (!domainId) return;
      map.set(domainId, (map.get(domainId) ?? 0) + 1);
    });
    return map;
  }, [functions]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return domains;
    return domains.filter((domain) => `${domain.id} ${domain.name} ${domain.description}`.toLowerCase().includes(normalized));
  }, [domains, query]);

  const handleRowClick = (domainId: string) => {
    router.push(`/system-domains/${domainId}`);
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <div className="mb-4">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              システム領域一覧
            </h1>
            <p className="text-[13px] text-slate-500">
              システム領域ごとに機能を整理します
            </p>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="システム領域を検索..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Link href="/settings/system-domains">
              <Button variant="outline" className="h-8 gap-2 text-[14px]">
                <Settings className="h-4 w-4" />
                マスタ管理
              </Button>
            </Link>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200">
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    ID
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    システム領域
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    説明
                  </TableHead>
                  <TableHead className="text-[11px] font-medium text-slate-500 uppercase tracking-wide px-4 py-3">
                    機能数
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-4 py-10 text-center text-[14px] text-slate-500">
                      読み込み中...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-4 py-10 text-center text-[14px] text-rose-600">
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="px-4 py-10 text-center text-[14px] text-slate-500">
                      該当するシステム領域がありません。
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((domain) => (
                    <TableRow
                      key={domain.id}
                      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                      onClick={() => handleRowClick(domain.id)}
                    >
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
                          {domain.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-[14px] font-medium text-slate-900">{domain.name}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="text-[13px] text-slate-600">{domain.description}</span>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className="font-mono text-[13px] text-slate-700">{counts.get(domain.id) ?? 0}</span>
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
