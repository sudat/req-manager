import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          {/* ページヘッダー */}
          <div className="mb-6">
            <div className="flex items-baseline justify-between mb-2">
              <h1 className="text-[32px] font-semibold tracking-tight text-slate-900">
                ダッシュボード
              </h1>
              <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1">
                <span className="text-[11px] font-medium text-slate-700">ベースライン v1.2</span>
              </div>
            </div>
            <p className="text-[13px] text-slate-500">作成: 2026-01-05</p>
          </div>

          {/* コンパクトメトリクスバー */}
          <div className="mb-6 flex items-center gap-6 rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-slate-500">オープン変更要求</span>
              <span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">12</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-slate-500">レビュー待ち</span>
              <span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">3</span>
            </div>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] font-medium text-slate-500">次回リリースまで</span>
              <span className="font-mono text-[18px] font-semibold tabular-nums text-slate-900">27</span>
              <span className="text-[11px] text-slate-500">日</span>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* レビュー待ち変更要求 */}
            <Card className="rounded-md border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 px-4 py-3">
                <CardTitle className="text-[15px] font-semibold text-slate-900">
                  レビュー待ち変更要求
                </CardTitle>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  優先度: リリース日が近い順 → 重大度
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-slate-100">
                  {[
                    {
                      id: "CR-2026-031",
                      title: "インボイス制度対応",
                      category: "債権管理",
                      release: "2026-01-12",
                      days: 7,
                      severity: "高",
                    },
                    {
                      id: "CR-2026-030",
                      title: "電子帳簿保存法対応",
                      category: "一般会計",
                      release: "2026-01-20",
                      days: 15,
                      severity: "中",
                    },
                    {
                      id: "CR-2026-029",
                      title: "支払処理自動化",
                      category: "債務管理",
                      release: "2026-02-01",
                      days: 27,
                      severity: "中",
                    },
                  ].map((item) => (
                    <li key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[11px] text-slate-400">{item.id}</span>
                            <Badge
                              variant="outline"
                              className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] px-1.5 py-0 font-medium"
                            >
                              レビュー中
                            </Badge>
                          </div>
                          <div className="text-[14px] font-medium text-slate-900 mb-0.5">
                            {item.title}
                          </div>
                          <div className="text-[13px] text-slate-500">{item.category}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-mono px-2 py-0.5"
                        >
                          {item.release}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
                        >
                          残り {item.days}日
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5"
                        >
                          重大度: {item.severity}
                        </Badge>
                        <div className="flex gap-1.5 ml-auto">
                          <Button
                            size="sm"
                            className="h-7 px-3 text-[14px] font-medium bg-slate-900 hover:bg-slate-800"
                          >
                            承認
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-[14px] font-medium border-slate-200 hover:bg-slate-50"
                          >
                            否認
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* 業務領域別要件分布 */}
            <Card className="rounded-md border border-slate-200 bg-white">
              <CardHeader className="border-b border-slate-100 px-4 py-3">
                <CardTitle className="text-[15px] font-semibold text-slate-900">
                  業務領域別 要件分布
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  {[
                    { label: "AR（債権管理）", count: 45, percent: 38 },
                    { label: "AP（債務管理）", count: 38, percent: 32 },
                    { label: "GL（一般会計）", count: 35, percent: 30 },
                  ].map((item) => (
                    <div key={item.label} className="grid grid-cols-[100px_1fr_100px] items-center gap-3">
                      <div className="text-[12px] font-medium text-slate-700">{item.label}</div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-slate-600 transition-all duration-300"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[12px] font-semibold tabular-nums text-slate-900">{item.count}</span>
                        <span className="text-[11px] text-slate-500 ml-1">({item.percent}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">
                    合計: <span className="font-mono font-semibold text-slate-900">118</span> 件
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
