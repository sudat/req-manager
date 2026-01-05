"use client"

import Link from "next/link";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function IdeaAddPage() {
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  const toggleDomain = (domain: string) => {
    setSelectedDomains(prev =>
      prev.includes(domain) ? prev.filter(d => d !== domain) : [...prev, domain]
    );
  };

  return (
    <>
      <Sidebar />
      <div className="ml-[280px] flex-1 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-[1400px] p-8">
          <Link href="/ideas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4" />
            概念一覧に戻る
          </Link>

          <h1 className="text-2xl font-semibold text-slate-900 mb-6">概念を新規追加</h1>

          <Card className="p-6">
            <form className="space-y-6">
              <div className="space-y-2">
                <Label>概念ID</Label>
                <Input placeholder="自動採番されます" disabled />
                <p className="text-xs text-slate-500">概念IDは保存時に自動的に採番されます</p>
              </div>

              <div className="space-y-2">
                <Label>
                  概念名<span className="text-rose-500">*</span>
                </Label>
                <Input placeholder="例: 適格請求書発行事業者" required />
              </div>

              <div className="space-y-2">
                <Label>同義語</Label>
                <Textarea
                  placeholder="カンマ区切りで複数入力可能&#10;例: 登録事業者, インボイス発行事業者"
                  className="min-h-[100px]"
                />
                <p className="text-xs text-slate-500">カンマ区切りで複数入力可能</p>
              </div>

              <div className="space-y-2">
                <Label>
                  影響領域<span className="text-rose-500">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "FI", class: "border-sky-200 bg-sky-50 text-sky-700" },
                    { key: "SD", class: "border-indigo-200 bg-indigo-50 text-indigo-700" },
                    { key: "MM", class: "border-amber-200 bg-amber-50 text-amber-700" },
                    { key: "HR", class: "border-rose-200 bg-rose-50 text-rose-700" },
                  ].map((domain) => (
                    <Button
                      key={domain.key}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDomain(domain.key)}
                      className={`${selectedDomains.includes(domain.key) ? domain.class : ""}`}
                    >
                      {domain.key}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Link href="/ideas">
                  <Button type="button" variant="outline">
                    キャンセル
                  </Button>
                </Link>
                <Button type="submit" className="bg-brand hover:bg-brand-600">
                  保存
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
