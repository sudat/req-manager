"use client"

import { MobileHeader } from "@/components/layout/mobile-header";
import { SettingsLayout } from "@/components/layout/settings-layout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
    </div>
  );
}

export default function NotificationSettingsPage() {
  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
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
                title="通知設定"
                description="プロジェクト内の活動に関する通知を管理します"
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
                  <div className="space-y-1">
                    <div className="text-[14px] font-medium text-slate-900">変更要求の更新通知</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">変更要求のステータスが変更されたときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
                  <div className="space-y-1">
                    <div className="text-[14px] font-medium text-slate-900">suspect link通知</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">要再確認リンクが発生したときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
                  <div className="space-y-1">
                    <div className="text-[14px] font-medium text-slate-900">レビュー依頼通知</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">レビューが依頼されたときに通知します</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between rounded-md border border-slate-200/60 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200">
                  <div className="space-y-1">
                    <div className="text-[14px] font-medium text-slate-900">週次サマリー</div>
                    <div className="text-[13px] text-slate-500 leading-relaxed">毎週月曜日にプロジェクトのサマリーを送信します</div>
                  </div>
                  <Switch />
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
