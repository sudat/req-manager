"use client"

import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Info } from "lucide-react";
import { useState } from "react";

export default function TicketCreatePage() {
  const [selectedBusiness, setSelectedBusiness] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  const toggleBusiness = (item: string) => {
    setSelectedBusiness(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleArea = (area: string) => {
    setSelectedAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href="/tickets" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            変更要求一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">変更要求を起票</h1>

          <Card className="p-6">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label>
                  タイトル<span className="text-rose-500">*</span>
                </Label>
                <Input placeholder="例: インボイス制度対応" required />
              </div>

              <div className="space-y-2">
                <Label>
                  背景・目的<span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  placeholder="変更要求の背景や目的を記述してください"
                  className="min-h-[120px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>影響業務</Label>
                <div className="flex flex-wrap gap-2">
                  {["請求業務", "経理業務", "購買業務", "在庫管理業務", "販売業務", "経費精算業務"].map((item) => (
                    <Button
                      key={item}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleBusiness(item)}
                      className={selectedBusiness.includes(item) ? "bg-brand-50 text-brand-700 border-brand-200" : ""}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  影響を受ける業務を選択してください。後からAI影響分析で自動抽出も可能です。
                </p>
              </div>

              <div className="space-y-2">
                <Label>影響領域</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "FI", class: "bg-sky-50 text-sky-700 border-sky-200" },
                    { key: "SD", class: "bg-indigo-50 text-indigo-700 border-indigo-200" },
                    { key: "MM", class: "bg-amber-50 text-amber-700 border-amber-200" },
                    { key: "HR", class: "bg-rose-50 text-rose-700 border-rose-200" },
                  ].map((area) => (
                    <Button
                      key={area.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleArea(area.key)}
                      className={selectedAreas.includes(area.key) ? area.class : ""}
                    >
                      {area.key}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  影響を受ける領域を選択してください。後からAI影響分析で自動抽出も可能です。
                </p>
              </div>

              <Card className="border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-900">AI影響分析について</div>
                    <div className="text-xs text-amber-700 mt-1">
                      起票後、変更要求詳細画面で「AI影響分析」を実行すると、影響を受ける業務・要件・概念を自動的に提案します。
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Link href="/tickets">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-brand hover:bg-brand-600">
                  起票
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
