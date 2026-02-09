"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, Globe, Zap, FileText } from "lucide-react";
import type { SideEffect } from "@/lib/domain/schemas/side-effects";

interface SideEffectsViewerProps {
  sideEffects: SideEffect;
}

export function SideEffectsViewer({ sideEffects }: SideEffectsViewerProps): ReactNode {
  const hasDbOperations = sideEffects.dbOperations && sideEffects.dbOperations.length > 0;
  const hasExternalApiCalls = sideEffects.externalApiCalls && sideEffects.externalApiCalls.length > 0;
  const hasEvents = sideEffects.events && sideEffects.events.length > 0;
  const hasFileOutputs = sideEffects.fileOutputs && sideEffects.fileOutputs.length > 0;

  if (!hasDbOperations && !hasExternalApiCalls && !hasEvents && !hasFileOutputs) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-slate-400 italic">
          {sideEffects.description || "副作用なし"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sideEffects.description && sideEffects.description !== "副作用なし" && (
        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{sideEffects.description}</div>
      )}

      {/* DB操作 */}
      {hasDbOperations && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Database className="h-4 w-4 text-slate-500" />
            DB操作
          </div>
          <div className="space-y-2">
            {sideEffects.dbOperations!.map((op, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">{op.operation}</Badge>
                <span className="font-mono text-slate-700">{op.table}</span>
                {op.condition && (
                  <span className="text-slate-500 text-xs">{op.condition}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 外部API呼び出し */}
      {hasExternalApiCalls && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Globe className="h-4 w-4 text-slate-500" />
            外部API呼び出し
          </div>
          <div className="space-y-2">
            {sideEffects.externalApiCalls!.map((api, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="font-mono text-xs">{api.method}</Badge>
                <span className="font-mono text-slate-700">{api.endpoint}</span>
                {api.retryPolicy && (
                  <span className="text-slate-500 text-xs">
                    リトライ: {api.retryPolicy.maxRetries}回
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* イベント発行 */}
      {hasEvents && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Zap className="h-4 w-4 text-slate-500" />
            イベント発行
          </div>
          <div className="space-y-2">
            {sideEffects.events!.map((event, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">{event.destination}</Badge>
                <span className="font-medium">{event.eventType}</span>
                {event.delayMs !== undefined && event.delayMs > 0 && (
                  <span className="text-slate-500 text-xs">遅延: {event.delayMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ファイル出力 */}
      {hasFileOutputs && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileText className="h-4 w-4 text-slate-500" />
            ファイル出力
          </div>
          <div className="space-y-2">
            {sideEffects.fileOutputs!.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="text-xs">{file.format}</Badge>
                <span className="font-mono text-slate-700">{file.path}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
