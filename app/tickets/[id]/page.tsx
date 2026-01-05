import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Globe } from "lucide-react";

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            変更要求一覧に戻る
          </Link>

          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">インボイス制度対応</h1>
            </div>
            <Button className="bg-brand hover:bg-brand-600 gap-2">
              <CheckCircle2 className="h-4 w-4" />
              ベースラインに反映
            </Button>
          </div>

          <div className="space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">基本情報</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-semibold text-slate-500">変更要求ID</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{params.id}</div>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-semibold text-slate-500">ステータス</div>
                    <div className="mt-1">
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">承認済</Badge>
                    </div>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-semibold text-slate-500">起票日</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">2024-01-15</div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500 mb-2">背景・目的</div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    2023年10月より開始されるインボイス制度に対応するため、請求書フォーマットの変更および税額計算ロジックの改修が必要。
                    適格請求書発行事業者の登録番号を請求書に表示し、税率ごとの消費税額を明記する必要がある。
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 影響範囲 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">影響範囲</CardTitle>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    AI影響分析
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">影響業務</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-brand-50 text-brand-700 hover:bg-brand-100">請求業務</Badge>
                    <Badge className="bg-brand-50 text-brand-700 hover:bg-brand-100">経理業務</Badge>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">影響領域</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-100">FI</Badge>
                    <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">SD</Badge>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">影響要件</div>
                  <ul className="space-y-3">
                    {[
                      { id: "BR-001", text: "請求書にインボイス番号を表示する", type: "業務要件" },
                      { id: "SR-012", text: "インボイス番号の自動採番機能", type: "システム要件" },
                      { id: "SR-023", text: "インボイス制度対応の税額計算ロジック", type: "システム要件" },
                    ].map((req) => (
                      <li key={req.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white p-4">
                        <div className="flex-1">
                          <div className="text-xs text-slate-400">{req.id}</div>
                          <div className="text-xs text-slate-700">{req.text}</div>
                        </div>
                        <Badge className={req.type === "業務要件" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}>
                          {req.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 関連概念 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">関連概念</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">インボイス制度</Badge>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">請求書発行</Badge>
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">消費税計算</Badge>
                </div>
              </CardContent>
            </Card>

            {/* 版適用履歴 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">版適用履歴</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    { version: "v2.0", date: "2024-01-20", status: "適用済" },
                    { version: "v2.1", date: "2024-02-15", status: "適用済" },
                  ].map((ver) => (
                    <li key={ver.version} className="flex items-center justify-between rounded-md border border-slate-100 bg-white p-4">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900">{ver.version}</div>
                        <div className="text-xs text-slate-400">適用日: {ver.date}</div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600">{ver.status}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
