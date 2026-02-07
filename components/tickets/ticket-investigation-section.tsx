"use client";

import { useState, useCallback, useEffect } from "react";
import { TicketInvestigationResultCard } from "./ticket-investigation-result-card";
import { TicketSuspectLinksCard } from "./ticket-suspect-links-card";
import { getInvestigationResultByChangeRequestId } from "@/lib/data/investigation-results";
import type { InvestigationResult } from "@/lib/domain/value-objects";

/**
 * 影響調査結果表示セクション（クライアント）
 * ページリフレッシュ時に最新データを再取得する
 */
interface TicketInvestigationSectionProps {
  changeRequestId: string;
  projectId: string;
  initialResult: InvestigationResult | null;
}

export function TicketInvestigationSection({ changeRequestId, projectId, initialResult }: TicketInvestigationSectionProps) {
  const [result, setResult] = useState<InvestigationResult | null>(initialResult);

  const fetchResult = useCallback(async () => {
    const { data } = await getInvestigationResultByChangeRequestId(changeRequestId, projectId);
    if (data) setResult(data);
  }, [changeRequestId, projectId]);

  // マウント時に最新データを取得（リフレッシュ対応）
  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  const handleResolved = () => {
    fetchResult();
  };

  if (!result) return null;

  return (
    <div className="space-y-4">
      <TicketInvestigationResultCard result={result} />
      <TicketSuspectLinksCard
        suspectLinks={result.suspectLinksDetected}
        projectId={projectId}
        onResolved={handleResolved}
      />
    </div>
  );
}
