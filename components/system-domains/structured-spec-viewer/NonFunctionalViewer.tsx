"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { structuredNonFunctionalSchema } from "@/lib/domain/schemas/non-functional";
import type { z } from "zod";
import { EmptyState } from "./EmptyState";
import { LabeledValue } from "./LabeledValue";

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
    return <EmptyState message="未設定" variant="inline" />;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {nonFunctional.responseTimeP95 && (
          <LabeledValue label="応答時間（P95）" valueClassName="font-medium">
            {nonFunctional.responseTimeP95}
          </LabeledValue>
        )}

        {nonFunctional.uptime && (
          <LabeledValue label="稼働率" valueClassName="font-medium">
            {nonFunctional.uptime}
          </LabeledValue>
        )}

        {nonFunctional.authMethod && (
          <LabeledValue label="認証方式" valueClassName="">
            <Badge variant="outline">{nonFunctional.authMethod}</Badge>
          </LabeledValue>
        )}

        {nonFunctional.authorizationBoundary && (
          <LabeledValue label="認可境界" valueClassName="font-medium">
            {nonFunctional.authorizationBoundary}
          </LabeledValue>
        )}
      </div>
    </div>
  );
}
