import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Globe } from "lucide-react";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/tickets" className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              変更要求一覧に戻る
            </Link>
            <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
              <CheckCircle2 className="h-4 w-4" />
              ベースラインに反映
            </Button>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-6">インボイス制度対応</h1>

          <div className="space-y-4">
            {/* 基本情報 */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-center gap-3 text-[12px] text-slate-500">
                  <span className="font-mono">{id}</span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                  <div>
                    <span className="text-slate-500">ステータス</span>
                    <Badge variant="outline" className="ml-2 border-slate-200 bg-slate-50 text-slate-600 text-[12px]">承認済</Badge>
                  </div>
                  <div>
                    <span className="text-slate-500">起票日</span>
                    <span className="ml-2 text-slate-900">2024-01-15</span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-0.5">
                  <div className="text-[12px] font-medium text-slate-500">背景・目的</div>
                  <p className="text-[14px] text-slate-700 leading-relaxed">
                    2023年10月より開始されるインボイス制度に対応するため、請求書フォーマットの変更および税額計算ロジックの改修が必要。
                    適格請求書発行事業者の登録番号を請求書に表示し、税率ごとの消費税額を明記する必要がある。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 影響範囲 */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[14px] font-semibold text-slate-900">影響範囲</h3>
                  <Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]">
                    <Globe className="h-4 w-4" />
                    AI影響分析
                  </Button>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                  <div className="text-[12px] font-medium text-slate-500">影響業務</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">債権管理</Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">一般会計</Badge>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                  <div className="text-[12px] font-medium text-slate-500">影響領域</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">AR</Badge>
                    <Badge variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">GL</Badge>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-2">
                  <div className="text-[12px] font-medium text-slate-500">影響要件</div>
                  <div className="space-y-2">
                    {[
                      { id: "BR-001", text: "請求書にインボイス番号を表示する", type: "業務要件" },
                      { id: "SR-012", text: "インボイス番号の自動採番機能", type: "システム要件" },
                      { id: "SR-023", text: "インボイス制度対応の税額計算ロジック", type: "システム要件" },
                    ].map((req) => (
                      <div key={req.id} className="rounded-md border border-slate-200 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-mono text-[11px] text-slate-400">{req.id}</div>
                            <div className="text-[13px] text-slate-700 mt-1">{req.text}</div>
                          </div>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                            {req.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 関連概念（AI候補） */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[14px] font-semibold text-slate-900">関連概念（AI候補）</h3>
                </div>

                <div className="space-y-2">
                  {[
                    { id: "C001", name: "インボイス制度", status: "レビュー中" },
                    { id: "C002", name: "請求書発行", status: "レビュー中" },
                    { id: "C003", name: "消費税計算", status: "レビュー中" },
                  ].map((concept) => (
                    <div key={concept.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/ideas/${concept.id}`}>
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                            {concept.name}
                          </Badge>
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400">({concept.id})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{concept.status}</Badge>
                        <Button size="sm" className="h-7 text-[12px] bg-slate-900 hover:bg-slate-800">承認</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[12px]">修正</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[12px]">却下</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 版適用履歴 */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[14px] font-semibold text-slate-900">版適用履歴</h3>
                </div>

                <div className="space-y-2">
                  {[
                    { version: "v2.0", date: "2024-01-20", status: "適用済" },
                    { version: "v2.1", date: "2024-02-15", status: "適用済" },
                  ].map((ver) => (
                    <div key={ver.version} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                      <div className="space-y-0.5">
                        <div className="text-[14px] font-semibold text-slate-900">{ver.version}</div>
                        <div className="text-[11px] text-slate-400">適用日: {ver.date}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{ver.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
