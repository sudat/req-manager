"use client"

import { use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Pencil, ExternalLink, Github } from "lucide-react";
import { srfData, SystemFunction, getRequirementsBySrfId } from "@/lib/mock/srf-knowledge";

export default function SrfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const srf = srfData.find((s) => s.id === id);

  if (!srf) {
    return (
      <>
        <Sidebar />
        <div className="ml-[280px] flex-1 min-h-screen bg-white">
          <div className="mx-auto max-w-[1400px] px-8 py-6">
            <div className="text-center py-20">
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">システム機能が見つかりません</h1>
              <Link href="/srf">
                <Button className="bg-slate-900 hover:bg-slate-800">システム機能一覧に戻る</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/srf" className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              システム機能一覧に戻る
            </Link>
            <Link href={`/srf/${id}/edit`}>
              <Button variant="outline" className="h-8 gap-2 text-[14px]">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              システム機能: {srf.id}
            </h1>
            <p className="text-[13px] text-slate-500">
              システム機能の詳細情報
            </p>
          </div>

          <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <CardContent className="p-0">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <h2 className="text-[15px] font-semibold text-slate-900">基本情報</h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">システム機能ID</div>
                    <div className="mt-1 font-mono text-[14px] font-semibold text-slate-900">{srf.id}</div>
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">設計書No</div>
                    <div className="mt-1 text-[13px] font-semibold text-slate-900">{srf.designDocNo}</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">機能分類</div>
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      {srf.category}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">ステータス</div>
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      {srf.status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">機能概要</div>
                  <div className="text-[13px] text-slate-700 leading-relaxed">{srf.summary}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">システム要件</h2>
            </div>
            <CardContent className="p-4 space-y-3">
              {(() => {
                const requirements = getRequirementsBySrfId(srf.id);
                if (requirements.length === 0) {
                  return <div className="text-[13px] text-slate-500">まだ登録されていません。</div>;
                }
                return requirements.map((req) => (
                  <div key={req.id} className="rounded-md border border-slate-200 bg-white p-3 hover:border-slate-300/60 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-[11px] text-slate-400">{req.id}</div>
                        <div className="text-[14px] font-medium text-slate-900 mt-1">{req.title}</div>
                        <div className="mt-1 text-[13px] text-slate-600">{req.summary}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                        {req.type}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">影響領域</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {req.impacts.map((impact) => (
                            <Badge key={impact} variant="outline" className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] px-2 py-0.5">
                              {impact}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">関連概念</div>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {req.concepts.map((concept) => (
                            <Link key={concept.id} href={`/ideas/${concept.id}`}>
                              <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100 px-2 py-0.5">
                                {concept.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    {req.related.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">関連要件</div>
                        <div className="flex flex-wrap gap-1.5">
                          {req.related.map((rel) => (
                            <Badge key={rel} variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] px-2 py-0.5">
                              {rel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 border-t border-slate-100 pt-3">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">受入条件</div>
                      <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-0.5">
                        {req.acceptanceCriteria.map((ac, i) => (
                          <li key={i}>{ac}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">システム設計</h2>
            </div>
            <CardContent className="p-4">
              <div className="text-[13px] text-slate-500">設計書情報は準備中です。</div>
            </CardContent>
          </Card>

          <Card className="mt-4 rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
            <div className="px-4 py-2.5 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">実装</h2>
            </div>
            <CardContent className="p-4 space-y-3">
              {srf.codeRefs.length === 0 ? (
                <div className="text-[13px] text-slate-500">まだ登録されていません。</div>
              ) : (
                srf.codeRefs.map((ref, index) => (
                  <div key={index} className="rounded-md border border-slate-200 bg-white p-3">
                    {ref.githubUrl && (
                      <div className="mb-3">
                        <a
                          href={ref.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:underline"
                        >
                          <Github className="h-4 w-4" />
                          GitHubリポジトリ
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {ref.note && (
                      <div className="mb-3 text-[12px] text-slate-600">{ref.note}</div>
                    )}
                    <div className="space-y-2">
                      {ref.paths.map((path, i) => (
                        <div key={i} className="rounded-md bg-slate-50 p-3">
                          <code className="text-[13px] text-slate-800 font-mono">{path}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
