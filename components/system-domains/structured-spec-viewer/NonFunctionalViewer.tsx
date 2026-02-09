"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { structuredNonFunctionalSchema } from "@/lib/domain/schemas/non-functional";
import type { z } from "zod";

type NonFunctional = z.infer<typeof structuredNonFunctionalSchema>;

interface NonFunctionalViewerProps {
  nonFunctional: NonFunctional;
}

export function NonFunctionalViewer({ nonFunctional }: NonFunctionalViewerProps): ReactNode {
  const hasData = 
    nonFunctional.responseTimeP95 ||
    nonFunctional.uptime ||
    nonFunctional.authMethod ||
    nonFunctional.authorizationBoundary;

  if (!hasData) {
    return <div className="text-sm text-slate-400 italic">未設定</div>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {nonFunctional.responseTimeP95 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">応答時間（P95）</div>
            <div className="text-sm font-medium">{nonFunctional.responseTimeP95}</div>
          </div>
        )}

        {nonFunctional.uptime && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">稼働率</div>
            <div className="text-sm font-medium">{nonFunctional.uptime}</div>
          </div>
        )}

        {nonFunctional.authMethod && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">認証方式</div>
            <Badge variant="outline">{nonFunctional.authMethod}</Badge>
          </div>
        )}

        {nonFunctional.authorizationBoundary && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">認可境界</div>
            <div className="text-sm font-medium">{nonFunctional.authorizationBoundary}</div>
          </div>
        )}
      </div>
    </div>
  );
}
