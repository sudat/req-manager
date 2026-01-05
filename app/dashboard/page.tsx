import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Search, Clock, Plus } from "lucide-react";

export default function DashboardPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="ダッシュボード"
            description="プロジェクト全体のサマリーとクイックアクション"
            badge="ベースライン v1.2"
            badgeMeta="現在のベースライン: v1.2 / 作成: 2026-01-05"
          />

          {/* サマリーカード */}
          <div className="flex flex-wrap items-stretch gap-4 mb-6">
            <Card className="flex min-w-[240px] flex-1 flex-col p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-brand-700 mb-3">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="text-3xl font-semibold text-slate-900">12</div>
              <div className="text-xs text-slate-600">オープン変更要求</div>
              <div className="text-xs text-slate-400 mt-1">次回リリースまで 27日</div>
            </Card>

            <Card className="flex min-w-[360px] flex-[2] flex-col gap-3 p-4">
              <div className="text-xs font-semibold text-slate-600">要再確認リンク(重大度)</div>
              <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-100">
                <div className="min-h-[96px] bg-rose-50 p-4">
                  <div className="mb-2 text-xs font-semibold text-rose-700">重大度: 高</div>
                  <div className="text-2xl font-semibold text-rose-700">8 件</div>
                </div>
                <div className="min-h-[96px] bg-amber-50 p-4 border-l border-slate-100">
                  <div className="mb-2 text-xs font-semibold text-amber-700">重大度: 中</div>
                  <div className="text-2xl font-semibold text-amber-700">15 件</div>
                </div>
              </div>
            </Card>

            <Card className="flex min-w-[260px] flex-col gap-3 p-4">
              <div className="text-xs text-slate-600 font-semibold">クイックアクション</div>
              <div className="flex flex-col gap-2">
                <Button className="bg-brand hover:bg-brand-600 gap-2">
                  <Search className="h-4 w-4" />
                  照会
                </Button>
                <Button variant="outline" className="gap-2">
                  <Clock className="h-4 w-4" />
                  ベースライン参照
                </Button>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  変更要求起票
                </Button>
              </div>
            </Card>
          </div>

          {/* メインコンテンツ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* レビュー待ち変更要求 */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">レビュー待ち変更要求(優先順)</CardTitle>
                <p className="text-xs text-slate-500 mt-1">優先度: リリース日が近い順 → 重大度</p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-4">
                  {[
                    {
                      id: "CR-2026-031",
                      title: "インボイス制度対応",
                      category: "請求業務",
                      release: "2026-01-12",
                      days: 7,
                      severity: "高",
                    },
                    {
                      id: "CR-2026-030",
                      title: "電子帳簿保存法対応",
                      category: "会計業務",
                      release: "2026-01-20",
                      days: 15,
                      severity: "中",
                    },
                    {
                      id: "CR-2026-029",
                      title: "多通貨対応機能追加",
                      category: "販売業務",
                      release: "2026-02-01",
                      days: 27,
                      severity: "中",
                    },
                  ].map((item) => (
                    <li key={item.id} className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <div className="mb-1 text-xs text-slate-400">
                          {item.id}
                          <Badge className="ml-2 bg-sky-50 text-sky-700 hover:bg-sky-100">レビュー中</Badge>
                        </div>
                        <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="text-xs text-slate-500">{item.category}</div>
                      </div>
                      <div className="flex min-w-[220px] flex-col items-end gap-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Badge variant="outline" className="text-xs">リリース: {item.release}</Badge>
                          <Badge variant="outline" className={item.days < 10 ? "border-rose-100 bg-rose-50 text-rose-700" : "border-amber-100 bg-amber-50 text-amber-700"}>
                            残り: {item.days}日
                          </Badge>
                          <Badge variant="outline" className={item.severity === "高" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-amber-100 bg-amber-50 text-amber-700"}>
                            重大度: {item.severity}
                          </Badge>
                        </div>
                        <div className="flex w-full gap-2">
                          <Button size="sm" className="flex-1 bg-brand hover:bg-brand-600">承認</Button>
                          <Button size="sm" variant="outline" className="flex-1">否認</Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 業務領域別要件分布 */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-base">業務領域別 要件分布</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "請求/販売", count: 52, percent: 33 },
                    { label: "会計", count: 41, percent: 26 },
                    { label: "購買", count: 28, percent: 18 },
                    { label: "在庫", count: 22, percent: 14 },
                    { label: "共通", count: 13, percent: 9 },
                  ].map((item) => (
                    <div key={item.label} className="grid grid-cols-[140px_1fr_80px] items-center gap-3">
                      <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${item.percent}%` }} />
                      </div>
                      <div className="text-right text-xs text-slate-500">{item.count}件 ({item.percent}%)</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-400">※ サンプル表示(合計: 156件)</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
