import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, FileText, Plus, Scissors, Trash2 } from "lucide-react";

export default async function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <Link href="/ideas" className="inline-flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              概念辞書に戻る
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/ideas}/${id}/edit`}>
                <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50 gap-2">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </Link>
              <div className="h-8 w-px bg-slate-200 mx-2" />
              <Button variant="ghost" className="h-8 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 gap-2">
                <Plus className="h-4 w-4" />
                統合
              </Button>
              <Button variant="ghost" className="h-8 px-4 text-[14px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 gap-2">
                <Scissors className="h-4 w-4" />
                分割
              </Button>
              <Button variant="ghost" className="h-8 px-4 text-[14px] font-medium text-red-600 hover:bg-red-50 hover:text-red-700 gap-2">
                <Trash2 className="h-4 w-4" />
                廃止
              </Button>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              概念詳細: インボイス制度
            </h1>
            <p className="text-[13px] text-slate-500">ID: {id}</p>
          </div>

          <div className="space-y-4">
            {/* 基本情報 */}
            <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
              <CardContent className="p-0">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      概念ID
                    </div>
                    <div className="font-mono text-[14px] text-slate-900">{id}</div>
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                      使用要件数
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono text-[16px] font-semibold text-slate-900 tabular-nums">24</span>
                      <span className="text-[11px] text-slate-400">件</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    同義語
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      適格請求書
                    </Badge>
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      適格請求書等保存方式
                    </Badge>
                    <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      Invoice System
                    </Badge>
                  </div>
                </div>

                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    影響領域
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      FI
                    </Badge>
                    <Badge variant="outline" className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      SD
                    </Badge>
                    <Badge variant="outline" className="font-mono border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                      MM
                    </Badge>
                  </div>
                </div>

                <div className="px-4 py-2.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    必読ドキュメント
                  </div>
                  <div className="space-y-1.5">
                    <a href="#" className="flex items-center gap-2 text-[13px] text-slate-700 hover:text-slate-900 transition-colors">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>国税庁ガイドライン</span>
                    </a>
                    <a href="#" className="flex items-center gap-2 text-[13px] text-slate-700 hover:text-slate-900 transition-colors">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>経理規程改定案</span>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 使用している要件 */}
            <Card className="rounded-md border border-slate-200/60 bg-white hover:border-slate-300/60 transition-colors">
              <CardHeader className="border-b border-slate-100 px-4 py-2.5">
                <CardTitle className="text-[15px] font-semibold text-slate-900">使用している要件</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <ul className="space-y-2">
                  {[
                    { id: "BR-001", text: "請求書にインボイス番号を表示する", type: "業務要件" },
                    { id: "SR-012", text: "インボイス番号の自動採番機能", type: "システム要件" },
                    { id: "SR-023", text: "インボイス制度対応の税額計算ロジック", type: "システム要件" },
                  ].map((req) => (
                    <li key={req.id} className="flex items-start justify-between gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 hover:border-slate-200/60 transition-colors">
                      <div className="flex-1">
                        <div className="font-mono text-[12px] text-slate-400">{req.id}</div>
                        <div className="text-[13px] text-slate-700">{req.text}</div>
                      </div>
                      <Badge variant="outline" className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                        {req.type}
                      </Badge>
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
