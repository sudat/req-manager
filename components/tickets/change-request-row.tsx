"use client"

import { useEffect, useState } from "react"
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChangeRequestActions } from "./change-request-actions";
import type { ChangeRequest } from "@/lib/domain/value-objects";
import { getAcceptanceConfirmationCompletionStatus } from "@/lib/data/acceptance-confirmations";
import { CheckCircle2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  open: "オープン",
  review: "レビュー中",
  approved: "承認済",
  applied: "適用済",
};

const priorityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

export interface ChangeRequestRowProps {
  request: ChangeRequest;
  onRowClick: (ticketId: string) => void;
  onDelete: (id: string, ticketId: string) => void;
}

export function ChangeRequestRow({
  request,
  onRowClick,
  onDelete,
}: ChangeRequestRowProps) {
  const [completionStatus, setCompletionStatus] = useState<{ total: number; verified: number; completionRate: number } | null>(null);

  useEffect(() => {
    getAcceptanceConfirmationCompletionStatus(request.id).then((res) => {
      if (res.data) {
        setCompletionStatus({
          total: res.data.total,
          verified: res.data.verified,
          completionRate: res.data.completionRate,
        });
      }
    });
  }, [request.id]);

  const isNorthStarMet = completionStatus && completionStatus.total > 0 && completionStatus.verified === completionStatus.total;

  return (
    <TableRow
      key={request.id}
      className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
      onClick={() => onRowClick(request.id)}
    >
      <TableCell className="px-4 py-3">
        <span className="font-mono text-[12px] text-slate-400">{request.ticketId}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[14px] font-medium text-slate-900">{request.title}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]"
        >
          {priorityLabels[request.priority]}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <Badge
          variant="outline"
          className="border-slate-200 bg-slate-50 text-slate-600 text-[12px]"
        >
          {statusLabels[request.status]}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[13px] text-slate-700">{request.requestedBy ?? "-"}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex items-center gap-2">
          {completionStatus && completionStatus.total > 0 ? (
            <>
              <span className="text-[13px] text-slate-700">
                {completionStatus.verified}/{completionStatus.total}
              </span>
              <Badge
                variant="outline"
                className={`text-[12px] ${
                  isNorthStarMet
                    ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                    : "border-amber-200 bg-amber-50 text-amber-600"
                }`}
              >
                {completionStatus.completionRate.toFixed(0)}%
              </Badge>
              {isNorthStarMet && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </>
          ) : (
            <span className="text-[13px] text-slate-400">-</span>
          )}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <span className="text-[13px] text-slate-700">{request.createdAt.split("T")[0]}</span>
      </TableCell>
      <TableCell className="px-4 py-3">
        <ChangeRequestActions
          id={request.id}
          ticketId={request.ticketId}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
