"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
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
              <h2 className="text-xl font-semibold text-slate-900 mb-6">プロジェクト設定</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">プロジェクト名</Label>
                  <Input
                    id="projectName"
                    defaultValue="ERP要件管理プロジェクト"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectDescription">プロジェクト説明</Label>
                  <Textarea
                    id="projectDescription"
                    className="min-h-[100px]"
                    defaultValue="ERP級の大規模システムにおける要件管理プロジェクト。LLMを活用した効率的なトレーサビリティ管理を実現します。"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="suspectThreshold">suspect link判定基準</Label>
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
                  <p className="text-xs text-slate-500">要件更新時に関連リンクを「要再確認」とする基準を設定します</p>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900">自動保存</div>
                    <div className="text-xs text-slate-500">編集内容を自動的に保存します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex justify-end">
                  <Button className="bg-brand hover:bg-brand-600">変更を保存</Button>
                </div>
              </div>
            </div>
          </SettingsLayout>
        </div>
      </div>
    </>
  );
}
