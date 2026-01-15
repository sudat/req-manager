import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { TicketChangeItem } from "@/lib/domain";

interface TicketChangeItemsCardProps {
  changeItems: TicketChangeItem[];
}

export function TicketChangeItemsCard({ changeItems }: TicketChangeItemsCardProps) {
  if (!changeItems || changeItems.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[14px] font-semibold text-slate-900">変更内容</h3>
        </div>

        <div className="space-y-3">
          {changeItems.map((item) => {
            const beforeCollapsible = item.beforeText.length > 120;
            const afterCollapsible = item.afterText.length > 120;
            return (
              <div key={item.refId} className="rounded-md border border-slate-200 p-3 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-mono text-[11px] text-slate-400">{item.refId}</div>
                    <div className="text-[13px] text-slate-700 mt-1">{item.refTitle}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                      {item.changeType}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                      {item.refType}
                    </Badge>
                    {item.businessName && (
                      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {item.businessName}
                      </Badge>
                    )}
                    {item.area && (
                      <Badge variant="outline" className="font-mono border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
                        {item.area}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-md border border-slate-200 bg-slate-50/50 p-2.5">
                    <div className="text-[11px] font-medium text-slate-500">現行</div>
                    {beforeCollapsible ? (
                      <details className="group mt-1">
                        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <div className="text-[13px] text-slate-700">
                            <span className="block group-open:hidden line-clamp-3">{item.beforeText}</span>
                            <span className="hidden group-open:block">{item.beforeText}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 group-open:hidden">もっと見る</div>
                          <div className="mt-1 hidden text-[11px] text-slate-400 group-open:block">閉じる</div>
                        </summary>
                      </details>
                    ) : (
                      <p className="mt-1 text-[13px] text-slate-700">{item.beforeText}</p>
                    )}
                  </div>

                  <div className="rounded-md border border-slate-200 bg-white p-2.5">
                    <div className="text-[11px] font-medium text-slate-500">変更後</div>
                    {afterCollapsible ? (
                      <details className="group mt-1">
                        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                          <div className="text-[13px] text-slate-700">
                            <span className="block group-open:hidden line-clamp-3">{item.afterText}</span>
                            <span className="hidden group-open:block">{item.afterText}</span>
                          </div>
                          <div className="mt-1 text-[11px] text-slate-400 group-open:hidden">もっと見る</div>
                          <div className="mt-1 hidden text-[11px] text-slate-400 group-open:block">閉じる</div>
                        </summary>
                      </details>
                    ) : (
                      <p className="mt-1 text-[13px] text-slate-700">{item.afterText}</p>
                    )}
                  </div>
                </div>

                {item.acceptanceCriteria && item.acceptanceCriteria.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[11px] font-medium text-slate-500">受入条件</div>
                    <ul className="list-disc pl-4 text-[12px] text-slate-700">
                      {item.acceptanceCriteria.map((criteria, index) => (
                        <li key={`${item.refId}-criteria-${index}`}>{criteria}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
