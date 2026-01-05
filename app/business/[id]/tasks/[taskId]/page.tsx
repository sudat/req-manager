"use client"

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil } from "lucide-react";
import type { TaskKnowledge } from "@/lib/mock/task-knowledge";
import { getDefaultTaskKnowledge } from "@/lib/mock/task-knowledge";
import { getSystemFunctionById } from "@/lib/mock/srf-knowledge";

export default function TaskDetailPage({ params }: { params: Promise<{ id: string; taskId: string }> }) {
  const { id, taskId } = use(params);

  const storageKey = `task-knowledge:${id}:${taskId}`;
  const defaultKnowledge = useMemo(
    () => getDefaultTaskKnowledge({ bizId: id, taskId }),
    [id, taskId],
  );

  const [knowledge] = useState<TaskKnowledge>(() => {
    if (typeof window === "undefined") return defaultKnowledge;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return defaultKnowledge;
      const parsed = JSON.parse(raw) as TaskKnowledge;
      if (parsed?.bizId !== id || parsed?.taskId !== taskId) return defaultKnowledge;
      return parsed;
    } catch {
      return defaultKnowledge;
    }
  });

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
                  <div className="mt-1 text-sm font-semibold text-slate-900">{knowledge.bizId}</div>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-xs font-semibold text-slate-500">業務タスクID</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{knowledge.taskId}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">業務タスク</div>
                <div className="text-sm text-slate-900">{knowledge.taskName}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">業務概要</div>
                <div className="text-sm text-slate-700">{knowledge.taskSummary}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">担当者</div>
                <div className="text-sm text-slate-700">{knowledge.person ?? "—"}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">インプット</div>
                <div className="text-sm text-slate-700">{knowledge.input ?? "—"}</div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">アウトプット</div>
                <div className="text-sm text-slate-700">{knowledge.output ?? "—"}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">業務要件</CardTitle>
              <Link href={`/business/${id}/tasks/${taskId}/edit`}>
                <Button variant="outline" size="sm">追加/編集</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {knowledge.businessRequirements.length === 0 ? (
                <div className="text-sm text-slate-500">まだ登録されていません。</div>
              ) : (
                knowledge.businessRequirements.map((req) => {
                  const srfId = req.srfId;
                  const systemFunction = srfId ? getSystemFunctionById(srfId) : undefined;
                  const systemFunctionName = systemFunction?.summary?.split("：")[0] || "システム機能";

                  return (
                  <div key={req.id} className="rounded-lg border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">{req.id}</div>
                        <div className="text-sm font-semibold text-slate-900">{req.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{req.summary}</div>
                      </div>
                      <Badge variant="outline" className="bg-slate-50">{req.type}</Badge>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500">関連概念</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {req.concepts.map((concept) => (
                          <Link key={concept.id} href={`/ideas/${concept.id}`}>
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                              {concept.name}
                            </Badge>
                          </Link>
                        ))}
                        {srfId && systemFunction && (
                          <Link href={`/srf/${srfId}`}>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                              {systemFunctionName}
                            </Badge>
                          </Link>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500">受入条件</div>
                      <ul className="mt-1 list-disc pl-5 text-xs text-slate-700">
                        {req.acceptanceCriteria.map((ac, i) => (
                          <li key={i}>{ac}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
