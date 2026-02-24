import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getBaselineByVersion } from "@/lib/mock/data/baselines";
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from "@/lib/constants/project";

export default async function BaselineDetailPage({
  params,
}: {
  params: Promise<{ version: string }>;
}) {
  const { version } = await params;
  const cookieStore = await cookies();
  const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;

  const baseline = getBaselineByVersion(projectId, version);

  if (!baseline) notFound();

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-4">
          <div className="flex items-center gap-3">
            <Link href="/baseline">
              <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50">
                戻る
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
                ベースライン {baseline.version}
              </h1>
              {baseline.isLatest && (
                <Badge
                  variant="outline"
                  className="font-mono text-[12px] font-medium border-slate-200 bg-slate-50 text-slate-600 px-2 py-0.5"
                >
                  最新
                </Badge>
              )}
            </div>
          </div>

          <Card className="p-4 space-y-2">
            <p className="text-[14px] font-medium text-slate-900">{baseline.summary}</p>
            <div className="flex flex-wrap gap-6 text-[13px]">
              <div>
                <span className="text-slate-500">作成日:</span>
                <span className="ml-2 font-mono text-slate-900">{baseline.date}</span>
              </div>
              <div>
                <span className="text-slate-500">変更要求数:</span>
                <span className="ml-2 font-mono text-slate-900">{baseline.changeRequestIds.length}</span>
              </div>
            </div>
            <p className="text-[12px] text-slate-500">
              プロジェクト: <span className="font-mono text-slate-900">{baseline.projectId}</span>
            </p>
            <p className="text-[12px] text-slate-500">
              NOTE: ここはMVPの詳細画面やで。ベースラインの永続化（DB接続）と差分表示は未実装。
            </p>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-4">
              <h2 className="text-[14px] font-semibold text-slate-900 mb-2">紐づく変更要求</h2>
              <p className="text-[13px] text-slate-500">未実装（将来的に変更要求一覧へのリンクを表示）</p>
            </Card>
            <Card className="p-4">
              <h2 className="text-[14px] font-semibold text-slate-900 mb-2">版間差分</h2>
              <p className="text-[13px] text-slate-500">未実装（将来的に差分の対象と比較版を選択）</p>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
