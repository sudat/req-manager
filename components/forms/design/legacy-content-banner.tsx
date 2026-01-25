"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import type { SystemDesignItem } from "@/lib/domain/enums";
import { formatLegacyItemForDisplay } from "@/lib/data/system-design-migration";

interface LegacyContentBannerProps {
  legacyItems: SystemDesignItem[];
}

export function LegacyContentBanner({ legacyItems }: LegacyContentBannerProps) {
  if (legacyItems.length === 0) {
    return null;
  }

  return (
    <Alert className="mb-4">
      <InfoIcon className="h-4 w-4" />
      <AlertTitle>旧形式のデータがあります</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          以下の{legacyItems.length}
          件は旧形式のデータです。新形式に移行する際の参考にしてください。
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {legacyItems.map((item) => (
            <li key={item.id}>{formatLegacyItemForDisplay(item)}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
