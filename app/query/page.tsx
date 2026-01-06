import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Search } from "lucide-react";

export default function QueryPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-white">
        {/* Hero Search Section */}
        <div className="mx-auto max-w-[900px] px-6 pt-16 pb-12">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-2">
              照会
            </h1>
            <p className="text-[13px] text-slate-500">
              自然言語で要件・仕様を検索
            </p>
          </div>

          {/* Search Interface */}
          <div className="relative">
            <div className="relative bg-white rounded-md border border-slate-200">
              <Textarea
                placeholder="例: インボイス制度に関連する要件を教えてください"
                className="min-h-[140px] resize-none border-0 rounded-md px-4 py-3 text-[14px] focus:ring-0 focus:shadow-none"
              />
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <button className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors group">
                  <div className="w-8 h-8 rounded-md bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <Mic className="h-4 w-4" />
                  </div>
                  <span className="text-[13px] font-medium">音声入力</span>
                </button>
                <Button className="bg-slate-900 hover:bg-slate-800 px-6 h-8 text-[14px] font-medium">
                  <Search className="h-4 w-4 mr-2" />
                  検索
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="mx-auto max-w-[1400px] px-6 pb-12">
          <div className="border-t border-slate-200 pt-8 mb-6">
            <h2 className="text-[15px] font-semibold text-slate-900">
              検索結果（サンプル）
            </h2>
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Result Card 1 */}
            <div className="group">
              <div className="h-full rounded-md border border-slate-200 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200 cursor-pointer flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-[11px] text-slate-400">BR-001</span>
                  <span className="text-[11px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md">
                    業務要件
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-3 leading-snug flex-1">
                  請求書にインボイス番号を表示する
                </h3>
                <div className="mb-3">
                  <div className="text-[11px] text-slate-500 mb-1.5">根拠: 関連概念</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["C001", "C002"].map((conceptId) => (
                      <Link
                        key={conceptId}
                        href={`/ideas/${conceptId}`}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {conceptId}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">種別: 業務要件</div>
                </div>
              </div>
            </div>

            {/* Result Card 2 */}
            <div className="group">
              <div className="h-full rounded-md border border-slate-200 bg-white p-4 hover:border-slate-300/60 transition-colors duration-200 cursor-pointer flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-[11px] text-slate-400">SR-023</span>
                  <span className="text-[11px] font-semibold bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md">
                    システム要件
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold text-slate-900 mb-3 leading-snug flex-1">
                  インボイス制度対応の税額計算ロジック
                </h3>
                <div className="mb-3">
                  <div className="text-[11px] text-slate-500 mb-1.5">根拠: 関連概念</div>
                  <div className="flex flex-wrap gap-1.5">
                    {["C001", "C003"].map((conceptId) => (
                      <Link
                        key={conceptId}
                        href={`/ideas/${conceptId}`}
                        className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {conceptId}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] text-slate-500">種別: システム要件</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
