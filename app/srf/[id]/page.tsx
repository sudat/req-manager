"use client"

import { use } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, ExternalLink, Github } from "lucide-react";
import { srfData, SystemFunction, getRequirementsBySrfId } from "@/lib/mock/srf-knowledge";

export default function SrfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const srf = srfData.find((s) => s.id === id);

  if (!srf) {
    return (
      <>
        <Sidebar />
        <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
          <div className="mx-auto max-w-[1400px] p-8">
            <div className="text-center py-20">
              <h1 className="text-2xl font-semibold text-slate-900 mb-4">システム機能が見つかりません</h1>
              <Link href="/srf">
                <Button>システム機能一覧に戻る</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "実装済":
        return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
      case "実装中":
        return "bg-sky-50 text-sky-700 hover:bg-sky-100";
      case "テスト中":
        return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
      case "未実装":
        return "bg-slate-50 text-slate-700 hover:bg-slate-100";
      default:
        return "";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "画面":
        return "bg-indigo-50 text-indigo-700 hover:bg-indigo-100";
      case "内部":
        return "bg-amber-50 text-amber-700 hover:bg-amber-100";
      case "IF":
        return "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
      default:
        return "bg-slate-50 text-slate-700 hover:bg-slate-100";
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/srf" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              システム機能一覧に戻る
            </Link>
            <Link href={`/srf/${id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>

          <PageHeader
            title={`システム機能: ${srf.id}`}
            description="システム機能の詳細情報"
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-xs font-semibold text-slate-500">システム機能ID</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{srf.id}</div>
                </div>
                <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-xs font-semibold text-slate-500">設計書No</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{srf.designDocNo}</div>
                </div>
              </div>

              <div className="flex gap-3">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">機能分類</div>
                  <Badge className={getCategoryColor(srf.category)}>
                    {srf.category}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">ステータス</div>
                  <Badge className={getStatusVariant(srf.status)}>
                    {srf.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-500">機能概要</div>
                <div className="text-sm text-slate-700">{srf.summary}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">システム要件</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(() => {
                const requirements = getRequirementsBySrfId(srf.id);
                if (requirements.length === 0) {
                  return <div className="text-sm text-slate-500">まだ登録されていません。</div>;
                }
                return requirements.map((req) => (
                  <div key={req.id} className="rounded-lg border border-slate-100 bg-white p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-400">{req.id}</div>
                        <div className="text-sm font-semibold text-slate-900">{req.title}</div>
                        <div className="mt-1 text-xs text-slate-600">{req.summary}</div>
                      </div>
                      <Badge variant="outline" className="bg-slate-50">{req.type}</Badge>
                    </div>
                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold text-slate-500">影響領域</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {req.impacts.map((impact) => (
                            <Badge key={impact} variant="outline">{impact}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-500">関連概念</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {req.concepts.map((concept) => (
                            <Link key={concept.id} href={`/ideas/${concept.id}`}>
                              <Badge variant="outline" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                                {concept.name}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                    {req.related.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-500">関連要件</div>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {req.related.map((rel) => (
                            <Badge key={rel} variant="outline" className="bg-white">{rel}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-500">受入条件</div>
                      <ul className="mt-1 list-disc pl-5 text-xs text-slate-700">
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

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">システム設計</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-500">設計書情報は準備中です。</div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">実装</CardTitle>
              <Link href={`/srf/${id}/edit`}>
                <Button variant="outline" size="sm">追加/編集</Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {srf.codeRefs.length === 0 ? (
                <div className="text-sm text-slate-500">まだ登録されていません。</div>
              ) : (
                srf.codeRefs.map((ref, index) => (
                  <div key={index} className="rounded-lg border border-slate-100 bg-white p-4">
                    {ref.githubUrl && (
                      <div className="mb-3">
                        <a
                          href={ref.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-600 hover:underline"
                        >
                          <Github className="h-4 w-4" />
                          GitHubリポジトリ
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                    {ref.note && (
                      <div className="mb-3 text-xs text-slate-600">{ref.note}</div>
                    )}
                    <div className="space-y-2">
                      {ref.paths.map((path, i) => (
                        <div key={i} className="rounded-md bg-slate-50 p-3">
                          <code className="text-sm text-slate-800">{path}</code>
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
