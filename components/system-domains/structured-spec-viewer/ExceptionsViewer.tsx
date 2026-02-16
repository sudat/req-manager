"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { structuredExceptionSchema } from "@/lib/domain/schemas/exceptions";
import { EXCEPTION_TYPE_LABELS, RECOVERY_TYPE_LABELS } from "@/lib/domain/labels";
import type { z } from "zod";
import { EmptyState } from "./EmptyState";

type StructuredException = z.infer<typeof structuredExceptionSchema>;

interface ExceptionsViewerProps {
  exceptions: StructuredException[];
}

export function ExceptionsViewer({ exceptions }: ExceptionsViewerProps): ReactNode {
  if (exceptions.length === 0) {
    return <EmptyState message="未設定" />;
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="w-[15%] px-3 py-2 text-left font-medium">エラー</th>
            <th className="w-[12%] px-3 py-2 text-left font-medium">タイプ</th>
            <th className="w-[8%] px-3 py-2 text-left font-medium">HTTP</th>
            <th className="w-[20%] px-3 py-2 text-left font-medium">発生条件</th>
            <th className="w-[20%] px-3 py-2 text-left font-medium">メッセージ</th>
            <th className="w-[15%] px-3 py-2 text-left font-medium">リカバリ</th>
          </tr>
        </thead>
        <tbody>
          {exceptions.map((exception, index) => (
            <tr key={index} className="border-t">
              <td className="px-3 py-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                  {exception.errorCode && (
                    <Badge variant="outline" className="text-xs font-mono border-red-200">
                      {exception.errorCode}
                    </Badge>
                  )}
                </div>
              </td>
              <td className="px-3 py-2">
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 border-red-200">
                  {EXCEPTION_TYPE_LABELS[exception.type] || exception.type}
                </Badge>
              </td>
              <td className="px-3 py-2">
                {exception.httpStatus && (
                  <Badge variant="destructive" className="text-xs">
                    {exception.httpStatus}
                  </Badge>
                )}
              </td>
              <td className="px-3 py-2 text-xs">
                {exception.condition}
              </td>
              <td className="px-3 py-2 text-xs">
                {exception.message}
              </td>
              <td className="px-3 py-2">
                {exception.recovery && exception.recovery !== "none" && (
                  <Badge variant="outline" className="text-xs">
                    {RECOVERY_TYPE_LABELS[exception.recovery] || exception.recovery}
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
