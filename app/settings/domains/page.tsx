"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

const domains = [
  {
    code: "FI",
    name: "財務会計",
    description: "会計伝票、総勘定元帳、財務諸表",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
  {
    code: "SD",
    name: "販売管理",
    description: "受注、出荷、請求、売掛金管理",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    code: "MM",
    name: "購買在庫",
    description: "発注、入庫、在庫管理、買掛金管理",
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  {
    code: "HR",
    name: "人事給与",
    description: "人事情報、勤怠、給与計算",
    color: "bg-rose-50 text-rose-700 border-rose-200",
  },
];

export default function DomainsSettingsPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="設定"
            description="プロジェクトとシステムの設定を管理"
          />

          <SettingsLayout>
            <div className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">影響領域マスタ</h2>
                <Button className="bg-brand hover:bg-brand-600 gap-2">
                  <Plus className="h-4 w-4" />
                  領域を追加
                </Button>
              </div>

              <div className="space-y-3">
                {domains.map((domain) => (
                  <div
                    key={domain.code}
                    className="flex items-center gap-4 rounded-lg border border-slate-100 bg-white p-4 hover:bg-slate-50/50 transition"
                  >
                    <Badge className={`${domain.color} font-semibold`}>
                      {domain.code}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-slate-900">{domain.name}</div>
                      <div className="text-xs text-slate-500">{domain.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" title="編集">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" title="削除">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SettingsLayout>
        </div>
      </div>
    </>
  );
}
