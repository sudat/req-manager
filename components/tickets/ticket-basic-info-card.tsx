'use client';

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CircleDot, Flag, User, Calendar } from "lucide-react";
import { statusLabels, priorityLabels, formatDate } from "@/lib/utils/ticket-labels";
import type { ChangeRequest, ChangeRequestStatus } from "@/lib/domain/value-objects";
import { updateTicketStatus } from "@/app/(with-sidebar)/tickets/[id]/actions";

interface TicketBasicInfoCardProps {
  changeRequest: ChangeRequest;
}

export function TicketBasicInfoCard({ changeRequest }: TicketBasicInfoCardProps) {
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState<ChangeRequestStatus>(changeRequest.status);

  const handleStatusChange = (newStatus: ChangeRequestStatus) => {
    startTransition(async () => {
      // 楽観的UI更新
      setCurrentStatus(newStatus);

      const result = await updateTicketStatus(changeRequest.id, newStatus);

      if (!result.success) {
        // エラー時は元に戻す
        setCurrentStatus(changeRequest.status);
        alert(`ステータスの更新に失敗しました: ${result.error}`);
      }
      // 成功時はrevalidatePathでページが自動更新される
    });
  };
  return (
    <Card className="rounded-md border border-slate-200/60 shadow-sm hover:border-slate-300/60 transition-colors">
      <CardContent className="p-6 space-y-3">
        <div className="id-label--brand">
          <span>{changeRequest.ticketId}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-center gap-2 text-[13px]">
            <CircleDot className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">ステータス</span>
            <Select value={currentStatus} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger className="h-7 w-[120px] text-[12px] border-slate-200 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{statusLabels.open}</SelectItem>
                <SelectItem value="review">{statusLabels.review}</SelectItem>
                <SelectItem value="approved">{statusLabels.approved}</SelectItem>
                <SelectItem value="applied">{statusLabels.applied}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <Flag className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">優先度</span>
            <span className="text-slate-900">{priorityLabels[changeRequest.priority]}</span>
          </div>
          {changeRequest.requestedBy && (
            <div className="flex items-center gap-2 text-[13px]">
              <User className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">起票者</span>
              <span className="text-slate-900">{changeRequest.requestedBy}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-[13px]">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">起票日</span>
            <span className="text-slate-900">{formatDate(changeRequest.createdAt)}</span>
          </div>
        </div>

        {changeRequest.expectedBenefit && (
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
            <div className="text-[12px] font-medium text-slate-500">期待効果</div>
            <p className="text-[14px] text-slate-700 leading-relaxed">{changeRequest.expectedBenefit}</p>
          </div>
        )}

        {changeRequest.description && (
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
            <div className="text-[12px] font-medium text-slate-500">修正内容</div>
            <p className="text-[14px] text-slate-700 leading-relaxed">{changeRequest.description}</p>
          </div>
        )}

        {changeRequest.background && (
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-1">
            <div className="text-[12px] font-medium text-slate-500">背景・目的</div>
            <p className="text-[14px] text-slate-700 leading-relaxed">{changeRequest.background}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
