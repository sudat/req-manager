"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
    </div>
  );
}

export default function SettingsPage() {
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
                title="プロジェクト設定"
                description="プロジェクトの基本情報と動作設定を管理します"
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">プロジェクト名</Label>
                  <Input
                    id="projectName"
                    defaultValue="ERP要件管理プロジェクト"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">プロジェクト説明</Label>
                  <Textarea
                    id="projectDescription"
                    className="min-h-[120px] resize-none"
                    defaultValue="ERP級の大規模システムにおける要件管理プロジェクト。LLMを活用した効率的なトレーサビリティ管理を実現します。"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="suspectThreshold" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">suspect link判定基準</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger id="suspectThreshold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低（緩い）</SelectItem>
                      <SelectItem value="medium">中（標準）</SelectItem>
                      <SelectItem value="high">高（厳密）</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[13px] text-slate-500 leading-relaxed">要件更新時に関連リンクを「要再確認」とする基準を設定します</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[13px] font-medium text-slate-900">自動保存</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">編集内容を自動的に保存します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end pt-4">
                  <Button className="bg-slate-900 hover:bg-slate-800 h-8 px-6 text-[14px]">変更を保存</Button>
                </div>
              </div>
            </div>
          </SettingsLayout>
        </div>
      </div>
    </>
  );
}
