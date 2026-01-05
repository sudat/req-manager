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
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <div className="text-sm text-slate-500">
                  質問を入力して検索を実行してください
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
