import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic } from "lucide-react";

export default function QueryPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <PageHeader
            title="照会"
            description="自然言語で要件・仕様を検索"
          />

          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="mb-4 text-sm font-semibold text-slate-600">
                質問を入力してください
              </div>
              <div className="flex flex-wrap items-start gap-3">
                <div className="relative flex-1">
                  <Textarea
                    placeholder="例: インボイス制度に関連する要件を教えてください"
                    className="min-h-[120px] resize-y pr-12"
                  />
                  <button className="absolute right-4 top-4 text-slate-400 hover:text-brand transition">
                    <Mic className="h-5 w-5" />
                  </button>
                </div>
                <Button className="bg-brand hover:bg-brand-600">
                  検索
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <div className="mb-4 text-sm font-semibold text-slate-600">
                検索結果（サンプル）
              </div>
              <div className="space-y-4">
                {[
                  {
                    id: "BR-001",
                    title: "請求書にインボイス番号を表示する",
                    type: "業務要件",
                    concepts: ["C001", "C002"],
                  },
                  {
                    id: "SR-023",
                    title: "インボイス制度対応の税額計算ロジック",
                    type: "システム要件",
                    concepts: ["C001", "C003"],
                  },
                ].map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-100 bg-white p-4">
                    <div className="text-xs text-slate-400">{item.id}</div>
                    <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                    <div className="mt-2 text-xs text-slate-500">根拠: 関連概念</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.concepts.map((conceptId) => (
                        <Link
                          key={conceptId}
                          href={`/ideas/${conceptId}`}
                          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                        >
                          {conceptId}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">種別: {item.type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
