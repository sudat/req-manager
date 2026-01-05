import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Pencil, FileText, Plus, Scissors, Trash2 } from "lucide-react";

export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              概念辞書に戻る
            </Link>
            <Link href={`/ideas/${params.id}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">概念詳細: インボイス制度</h1>

          <div className="space-y-6">
            {/* 基本情報 */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-semibold text-slate-500">概念ID</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{params.id}</div>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                    <div className="text-xs font-semibold text-slate-500">使用要件数</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">24</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">同義語</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">適格請求書</Badge>
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">適格請求書等保存方式</Badge>
                      <Badge variant="outline" className="bg-slate-100 text-slate-600">Invoice System</Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">影響領域</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-sky-50 text-sky-700 hover:bg-sky-100">FI</Badge>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">SD</Badge>
                      <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100">MM</Badge>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">必読ドキュメント</div>
                    <div className="space-y-2">
                      <a href="#" className="flex items-center gap-2 text-sm text-brand hover:text-brand-600">
                        <FileText className="h-4 w-4" />
                        <span>国税庁ガイドライン</span>
                      </a>
                      <a href="#" className="flex items-center gap-2 text-sm text-brand hover:text-brand-600">
                        <FileText className="h-4 w-4" />
                        <span>経理規程改定案</span>
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 使用している要件 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">使用している要件</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* 概念の操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">概念の操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    統合
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Scissors className="h-4 w-4" />
                    分割
                  </Button>
                  <Button variant="outline" className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    廃止
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
