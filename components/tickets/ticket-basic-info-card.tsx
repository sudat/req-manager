import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { statusLabels, priorityLabels, formatDate } from "@/lib/utils/ticket-labels";
import type { ChangeRequest } from "@/lib/domain/value-objects";

interface TicketBasicInfoCardProps {
  changeRequest: ChangeRequest;
}

export function TicketBasicInfoCard({ changeRequest }: TicketBasicInfoCardProps) {
  return (
    <Card className="rounded-md border border-slate-200">
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center gap-3 text-[12px] text-slate-500">
          <span className="font-mono">{changeRequest.ticketId}</span>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
          <div>
            <span className="text-slate-500">ステータス</span>
            <Badge variant="outline" className="ml-2 border-slate-200 bg-slate-50 text-slate-600 text-[12px]">
              {statusLabels[changeRequest.status]}
            </Badge>
          </div>
          <div>
            <span className="text-slate-500">優先度</span>
            <span className="ml-2 text-slate-900">{priorityLabels[changeRequest.priority]}</span>
          </div>
          {changeRequest.requestedBy && (
            <div>
              <span className="text-slate-500">起票者</span>
              <span className="ml-2 text-slate-900">{changeRequest.requestedBy}</span>
            </div>
          )}
          <div>
            <span className="text-slate-500">起票日</span>
            <span className="ml-2 text-slate-900">{formatDate(changeRequest.createdAt)}</span>
          </div>
        </div>

        {changeRequest.expectedBenefit && (
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
            <div className="text-[13px] text-slate-700">
              <span className="text-slate-500">期待効果</span>
              <span className="ml-2 text-slate-900">{changeRequest.expectedBenefit}</span>
            </div>
          </div>
        )}

        {changeRequest.description && (
          <div className="border-t border-slate-100 pt-2 mt-2">
            <p className="text-[14px] text-slate-700 leading-relaxed">{changeRequest.description}</p>
          </div>
        )}

        {changeRequest.background && (
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-0.5">
            <div className="text-[12px] font-medium text-slate-500">背景・目的</div>
            <p className="text-[14px] text-slate-700 leading-relaxed">{changeRequest.background}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
