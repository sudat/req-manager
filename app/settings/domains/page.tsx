"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
          {description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

const domains = [
  {
    code: "AR",
    name: "債権管理",
    description: "売掛金管理、請求書発行、入金消込、債権回収",
  },
  {
    code: "AP",
    name: "債務管理",
    description: "買掛金管理、支払処理、仕入先管理、支払依頼",
  },
  {
    code: "GL",
    name: "一般会計",
    description: "仕訳転記、総勘定元帳、財務諸表、試算表",
  },
];

export default function DomainsSettingsPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1200px] px-8 py-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              設定
            </h1>
            <p className="text-[13px] text-slate-500">
              プロジェクトとシステムの設定を管理
            </p>
          </div>

          <SettingsLayout>
            <div className="rounded-md border border-slate-200 bg-white p-6">
              <SectionHeader
                title="影響領域マスタ"
                description="要件定義書の影響領域（ドメイン）を管理します"
                action={
                  <Button className="bg-slate-900 hover:bg-slate-800 gap-2 h-8 px-6 text-[14px]">
                    <Plus className="h-4 w-4" />
                    領域を追加
                  </Button>
                }
              />

              <div className="space-y-4">
                {domains.map((domain) => (
                  <div
                    key={domain.code}
                    className="flex items-center gap-4 rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200"
                  >
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 font-mono text-[12px] font-medium px-2 py-0.5">
                      {domain.code}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold text-slate-900">{domain.name}</div>
                      <div className="text-[13px] text-slate-500 mt-0.5 leading-relaxed">{domain.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900" title="編集">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900" title="削除">
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
