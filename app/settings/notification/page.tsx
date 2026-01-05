"use client"

import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function NotificationSettingsPage() {
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
              <h2 className="text-xl font-semibold text-slate-900 mb-6">通知設定</h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900">変更要求の更新通知</div>
                    <div className="text-xs text-slate-500">変更要求のステータスが変更されたときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900">suspect link通知</div>
                    <div className="text-xs text-slate-500">要再確認リンクが発生したときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900">レビュー依頼通知</div>
                    <div className="text-xs text-slate-500">レビューが依頼されたときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 p-4">
                  <div className="space-y-0.5">
                    <div className="text-sm font-semibold text-slate-900">週次サマリー</div>
                    <div className="text-xs text-slate-500">毎週月曜日にプロジェクトのサマリーを送信します</div>
                  </div>
                  <Switch />
                </div>

                <div className="flex justify-end pt-4">
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
