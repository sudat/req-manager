import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { statusLabels, priorityLabels, formatDate } from "@/lib/utils/ticket-labels";
import type { Ticket } from "@/lib/mock/data/types";

interface TicketBasicInfoCardProps {
  ticket: Ticket;
}

export function TicketBasicInfoCard({ ticket }: TicketBasicInfoCardProps) {
  return (
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

        {(ticket.changeSummary || ticket.expectedBenefit) && (
          <div className="border-t border-slate-100 pt-2 mt-2 space-y-1.5">
            {ticket.changeSummary && (
              <div className="text-[13px] text-slate-700">
                <span className="text-slate-500">変更要約</span>
                <span className="ml-2 text-slate-900">{ticket.changeSummary}</span>
              </div>
            )}
            {ticket.expectedBenefit && (
              <div className="text-[13px] text-slate-700">
                <span className="text-slate-500">期待効果</span>
                <span className="ml-2 text-slate-900">{ticket.expectedBenefit}</span>
              </div>
            )}
          </div>
        )}

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
  );
}
