"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { structuredExceptionSchema } from "@/lib/domain/schemas/exceptions";
import type { z } from "zod";

type StructuredException = z.infer<typeof structuredExceptionSchema>;

interface ExceptionsViewerProps {
  exceptions: StructuredException[];
}

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  validation: "バリデーション",
  state: "状態",
  permission: "権限",
  external: "外部",
  timeout: "タイムアウト",
  conflict: "競合",
};

const RECOVERY_TYPE_LABELS: Record<string, string> = {
  none: "なし",
  retry_immediate: "即時再試行",
  retry_with_backoff: "バックオフ付き再試行",
  fallback: "フォールバック",
  manual_intervention: "手動介入",
  circuit_breaker: "サーキットブレーカー",
};

export function ExceptionsViewer({ exceptions }: ExceptionsViewerProps): ReactNode {
  if (exceptions.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        未設定
      </div>
    );
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
