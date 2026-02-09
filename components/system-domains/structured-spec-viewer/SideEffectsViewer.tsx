"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Database, Globe, Zap, FileText } from "lucide-react";
import type { SideEffect } from "@/lib/domain/schemas/side-effects";
import { EmptyState } from "./EmptyState";

interface SideEffectsViewerProps {
  sideEffects: SideEffect;
}

interface SideEffectSectionProps<T> {
  title: string;
  icon: ReactNode;
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
}

function SideEffectSection<T>({
  title,
  icon,
  items,
  renderItem,
}: SideEffectSectionProps<T>): ReactNode {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{items.map(renderItem)}</div>
    </div>
  );
}

export function SideEffectsViewer({ sideEffects }: SideEffectsViewerProps): ReactNode {
  const dbOperations = sideEffects.dbOperations ?? [];
  const externalApiCalls = sideEffects.externalApiCalls ?? [];
  const events = sideEffects.events ?? [];
  const fileOutputs = sideEffects.fileOutputs ?? [];
  const hasOperations =
    dbOperations.length > 0 ||
    externalApiCalls.length > 0 ||
    events.length > 0 ||
    fileOutputs.length > 0;

  if (!hasOperations) {
    return <EmptyState message={sideEffects.description || "副作用なし"} variant="inline" />;
  }

  return (
    <div className="space-y-4">
      {sideEffects.description && sideEffects.description !== "副作用なし" && (
        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded">{sideEffects.description}</div>
      )}

      <SideEffectSection
        title="DB操作"
        icon={<Database className="h-4 w-4 text-slate-500" />}
        items={dbOperations}
        renderItem={(operation, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono text-xs">
              {operation.operation}
            </Badge>
            <span className="font-mono text-slate-700">{operation.table}</span>
            {operation.condition && (
              <span className="text-xs text-slate-500">{operation.condition}</span>
            )}
          </div>
        )}
      />

      <SideEffectSection
        title="外部API呼び出し"
        icon={<Globe className="h-4 w-4 text-slate-500" />}
        items={externalApiCalls}
        renderItem={(apiCall, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono text-xs">
              {apiCall.method}
            </Badge>
            <span className="font-mono text-slate-700">{apiCall.endpoint}</span>
            {apiCall.retryPolicy && (
              <span className="text-xs text-slate-500">
                リトライ: {apiCall.retryPolicy.maxRetries}回
              </span>
            )}
          </div>
        )}
      />

      <SideEffectSection
        title="イベント発行"
        icon={<Zap className="h-4 w-4 text-slate-500" />}
        items={events}
        renderItem={(event, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {event.destination}
            </Badge>
            <span className="font-medium">{event.eventType}</span>
            {event.delayMs !== undefined && event.delayMs > 0 && (
              <span className="text-xs text-slate-500">遅延: {event.delayMs}ms</span>
            )}
          </div>
        )}
      />

      <SideEffectSection
        title="ファイル出力"
        icon={<FileText className="h-4 w-4 text-slate-500" />}
        items={fileOutputs}
        renderItem={(fileOutput, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="text-xs">
              {fileOutput.format}
            </Badge>
            <span className="font-mono text-slate-700">{fileOutput.path}</span>
          </div>
        )}
      />
    </div>
  );
}
