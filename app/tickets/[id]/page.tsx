import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Globe, Pencil } from "lucide-react";
import { getTicketById } from "@/lib/mock/data/tickets/tickets";
import { businesses } from "@/lib/mock/data";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticket = getTicketById(id);

  if (!ticket) {
    notFound();
  }

  // ステータス表示値マッピング
  const statusLabels: Record<string, string> = {
    open: "未対応",
    review: "レビュー中",
    approved: "承認済",
    applied: "適用済",
  };

  // 優先度表示値マッピング
  const priorityLabels: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };

  // ビジネス名取得
  const getBusinessNames = (businessIds: string[]): string[] => {
    return businessIds.map((id) => {
      const biz = businesses.find((b) => b.id === id);
      return biz?.name || id;
    });
  };

  // 日付フォーマット（ISO → YYYY-MM-DD）
  const formatDate = (isoDate: string): string => {
    return isoDate.split("T")[0];
  };

  return (
    <>
      <MobileHeader />
      <div className="flex-1 min-h-screen bg-white">
        <div className="mx-auto max-w-[1400px] px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/tickets" className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              変更要求一覧に戻る
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/tickets/${id}/edit`}>
                <Button variant="outline" className="h-8 px-4 text-[14px] font-medium border-slate-200 hover:bg-slate-50 gap-2">
                  <Pencil className="h-4 w-4" />
                  編集
                </Button>
              </Link>
              <Button className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800">
                <CheckCircle2 className="h-4 w-4" />
                ベースラインに反映
              </Button>
            </div>
          </div>

          <h1 className="text-[32px] font-semibold tracking-tight text-slate-900 mb-4">{ticket.title}</h1>

          <div className="space-y-4">
            {/* 基本情報 */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2.5">
                <div className="flex items-center gap-3 text-[12px] text-slate-500">
                  <span className="font-mono">{ticket.id}</span>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                  <div>
                    <span className="text-slate-500">ステータス</span>
                    <Badge variant="outline" className="ml-2 border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                      {statusLabels[ticket.status] || ticket.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-500">優先度</span>
                    <span className="ml-2 text-slate-900">{priorityLabels[ticket.priority] || ticket.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">起票者</span>
                    <span className="ml-2 text-slate-900">{ticket.requestedBy}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">起票日</span>
                    <span className="ml-2 text-slate-900">{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>

                {ticket.description && (
                  <div className="border-t border-slate-100 pt-2 mt-2">
                    <p className="text-[14px] text-slate-700 leading-relaxed">{ticket.description}</p>
                  </div>
                )}

                {ticket.background && (
                  <div className="border-t border-slate-100 pt-2 mt-2 space-y-0.5">
                    <div className="text-[12px] font-medium text-slate-500">背景・目的</div>
                    <p className="text-[14px] text-slate-700 leading-relaxed">{ticket.background}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 影響範囲 */}
            <Card className="rounded-md border border-slate-200">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-[14px] font-semibold text-slate-900">影響範囲</h3>
                  <Button variant="outline" size="sm" className="h-7 gap-2 text-[12px]">
                    <Globe className="h-4 w-4" />
                    AI影響分析
                  </Button>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                  <div className="text-[12px] font-medium text-slate-500">影響業務</div>
                  <div className="flex flex-wrap gap-1.5">
                    {getBusinessNames(ticket.businessIds).map((name) => (
                      <Badge key={name} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 space-y-1">
                  <div className="text-[12px] font-medium text-slate-500">影響領域</div>
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.areas.map((area) => (
                      <Badge key={area} variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                {ticket.impactRequirements && ticket.impactRequirements.length > 0 && (
                  <div className="border-t border-slate-100 pt-2 mt-2 space-y-2">
                    <div className="text-[12px] font-medium text-slate-500">影響要件</div>
                    <div className="space-y-2">
                      {ticket.impactRequirements.map((req) => (
                        <div key={req.id} className="rounded-md border border-slate-200 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-mono text-[11px] text-slate-400">{req.id}</div>
                              <div className="text-[13px] text-slate-700 mt-1">{req.title}</div>
                            </div>
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] font-medium px-2 py-0.5">
                              {req.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 関連概念（AI候補） */}
            {ticket.relatedConcepts && ticket.relatedConcepts.length > 0 && (
              <Card className="rounded-md border border-slate-200">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-[14px] font-semibold text-slate-900">関連概念（AI候補）</h3>
                  </div>

                  <div className="space-y-2">
                    {ticket.relatedConcepts.map((concept) => (
                      <div key={concept.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-200 p-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/ideas/${concept.id}`}>
                            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px] hover:bg-slate-100">
                              {concept.name}
                            </Badge>
                          </Link>
                          <span className="font-mono text-[11px] text-slate-400">({concept.id})</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{concept.status}</Badge>
                          <Button size="sm" className="h-7 text-[12px] bg-slate-900 hover:bg-slate-800">承認</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[12px]">修正</Button>
                          <Button size="sm" variant="outline" className="h-7 text-[12px]">却下</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 版適用履歴 */}
            {ticket.versionHistory && ticket.versionHistory.length > 0 && (
              <Card className="rounded-md border border-slate-200">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-[14px] font-semibold text-slate-900">版適用履歴</h3>
                  </div>

                  <div className="space-y-2">
                    {ticket.versionHistory.map((ver) => (
                      <div key={ver.version} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
                        <div className="space-y-0.5">
                          <div className="text-[14px] font-semibold text-slate-900">{ver.version}</div>
                          <div className="text-[11px] text-slate-400">適用日: {ver.appliedDate}</div>
                        </div>
                        <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">{ver.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ターゲットバージョン情報 */}
            {ticket.targetVersions && ticket.targetVersions.length > 0 && (
              <Card className="rounded-md border border-slate-200">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="text-[14px] font-semibold text-slate-900">ターゲットバージョン</h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ticket.targetVersions.map((version) => (
                      <Badge key={version} variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {version}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
