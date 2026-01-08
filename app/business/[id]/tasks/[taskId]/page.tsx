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
import { getSystemFunctionById } from "@/lib/mock/data";

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
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href={`/business/${id}/tasks`} className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              業務一覧（詳細）に戻る
            </Link>
            <Link href={`/business/${id}/tasks/${taskId}/edit`}>
              <Button variant="outline" className="h-8 gap-2 text-[14px]">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">業務タスク詳細</h1>

          <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-3 text-[12px] text-slate-500">
                <span className="font-mono">{knowledge.bizId}</span>
                <span className="text-slate-300">/</span>
                <span className="font-mono">{knowledge.taskId}</span>
              </div>

              <h2 className="text-[20px] font-semibold text-slate-900 leading-tight">
                {knowledge.taskName}
              </h2>

              <p className="text-[14px] text-slate-700 leading-relaxed">
                {knowledge.taskSummary}
              </p>

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-100 text-[13px]">
                <div>
                  <span className="text-slate-500">担当者</span>
                  <span className="ml-2 text-slate-900">{knowledge.person ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500">インプット</span>
                  <span className="ml-2 text-slate-900">{knowledge.input ?? "—"}</span>
                </div>
                <div>
                  <span className="text-slate-500">アウトプット</span>
                  <span className="ml-2 text-slate-900">{knowledge.output ?? "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <h3 className="text-[14px] font-semibold text-slate-900">業務要件</h3>
                <Badge variant="outline" className="font-mono text-[11px] border-slate-200 bg-slate-50 text-slate-600 px-1.5 py-0">
                  {knowledge.businessRequirements.length}
                </Badge>
              </div>
              {knowledge.businessRequirements.length === 0 ? (
                <div className="text-[14px] text-slate-500">まだ登録されていません。</div>
              ) : (
                knowledge.businessRequirements.map((req) => {
                  const srfId = req.srfId;
                  const systemFunction = srfId ? getSystemFunctionById(srfId) : undefined;
                  const systemFunctionName = systemFunction?.summary?.split("：")[0] || "システム機能";

                  return (
                  <div key={req.id} className="rounded-md border border-slate-200 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-[11px] text-slate-400">{req.id}</div>
                        <div className="text-[14px] font-medium text-slate-900 mt-1">{req.title}</div>
                        <div className="mt-1 text-[13px] text-slate-600">{req.summary}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">{req.type}</Badge>
                    </div>
                    {req.concepts && req.concepts.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <div className="text-[12px] font-medium text-slate-500">関連概念</div>
                        <div className="flex flex-wrap gap-1.5">
                          {req.concepts.map((concept) => (
                            <Link key={concept.id} href={`/ideas/${concept.id}`}>
                              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                                {concept.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {srfId && systemFunction && (
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <div className="text-[12px] font-medium text-slate-500">関連システム機能</div>
                        <div className="flex flex-wrap gap-1.5">
                          <Link href={`/srf/${srfId}`}>
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                              {systemFunctionName}
                            </Badge>
                          </Link>
                        </div>
                      </div>
                    )}
                    {req.impacts && req.impacts.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <div className="text-[12px] font-medium text-slate-500">影響領域</div>
                        <div className="flex flex-wrap gap-1.5">
                          {req.impacts.map((impact, i) => (
                            <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                              {impact}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {req.related && req.related.length > 0 && (
                      <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                        <div className="text-[12px] font-medium text-slate-500">関連要件</div>
                        <div className="flex flex-wrap gap-1.5">
                          {req.related.map((relId, i) => (
                            <Badge key={i} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                              {relId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                      <div className="text-[12px] font-medium text-slate-500">受入条件</div>
                      <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
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
