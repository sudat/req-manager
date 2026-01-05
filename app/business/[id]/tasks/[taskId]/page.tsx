"use client"

import { use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = use(params);

  // サンプルデータ
  const taskData = {
    id: taskId,
    bizId: id,
    name: "請求書発行",
    summary: "請求対象を抽出し、請求書を生成して発行する。",
    person: "経理担当",
    input: "請求対象データ、契約情報",
    output: "請求書（PDF/電子）",
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/business/${id}/tasks`} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              業務一覧（詳細）に戻る
            </Link>
            <Link href={`/business/${id}/tasks/${taskId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">業務タスク詳細</h1>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-xs font-semibold text-slate-500">業務ID</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{taskData.bizId}</div>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-xs font-semibold text-slate-500">業務タスクID</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{taskData.id}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">業務タスク</div>
                <div className="text-sm text-slate-900">{taskData.name}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">業務概要</div>
                <div className="text-sm text-slate-700">{taskData.summary}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">担当者</div>
                <div className="text-sm text-slate-700">{taskData.person}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">インプット</div>
                <div className="text-sm text-slate-700">{taskData.input}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">アウトプット</div>
                <div className="text-sm text-slate-700">{taskData.output}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
