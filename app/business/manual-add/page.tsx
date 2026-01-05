"use client"

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function ManualAddPage() {
  const searchParams = useSearchParams();
  const bizId = searchParams.get("id") || "BIZ-001";

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href={`/business/${bizId}/tasks`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            業務一覧（詳細）に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">業務タスクを手動追加</h1>

          <Card className="p-6">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label>業務ID</Label>
                <Input value={bizId} disabled />
              </div>

              <div className="space-y-2">
                <Label>
                  業務タスクID<span className="text-rose-500">*</span>
                </Label>
                <Input value="TASK-009" disabled required />
              </div>

              <div className="space-y-2">
                <Label>
                  業務タスク<span className="text-rose-500">*</span>
                </Label>
                <Input placeholder="例: 請求書発行" required />
              </div>

              <div className="space-y-2">
                <Label>業務概要</Label>
                <Textarea
                  placeholder="この業務タスクで何をするのかを入力してください"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>担当者</Label>
                <Input placeholder="例: 経理担当" />
              </div>

              <div className="space-y-2">
                <Label>インプット</Label>
                <Textarea
                  placeholder="例: 請求対象データ、契約情報"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>アウトプット</Label>
                <Textarea
                  placeholder="例: 請求書（PDF/電子）"
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-3">
                <Link href={`/business/${bizId}/tasks`}>
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-brand hover:bg-brand-600">
                  追加
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
