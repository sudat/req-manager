"use client";

import { AlertTriangle } from "lucide-react";
import { SuspectLinkActionBar } from "./suspect-link-action-bar";
import type { InvestigationResult } from "@/lib/domain/value-objects";

const NODE_TYPE_LABELS: Record<string, string> = {
  br: "業務要件",
  sf: "システム機能",
  sr: "システム要件",
  ac: "受入基準",
  dd: "設計ドキュメント",
};

interface TicketSuspectLinksCardProps {
  suspectLinks: InvestigationResult["suspectLinksDetected"];
  projectId: string;
  onResolved: () => void;
}

export function TicketSuspectLinksCard({ suspectLinks, projectId, onResolved }: TicketSuspectLinksCardProps) {
  if (suspectLinks.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-[14px] font-semibold text-slate-900">検出された疑義リンク</h3>
        <span className="text-[12px] text-amber-700 font-medium ml-auto">{suspectLinks.length} 件</span>
      </div>

      <div className="space-y-3">
        {suspectLinks.map((link) => (
          <div key={link.id} className="rounded border border-amber-200 bg-white p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] text-slate-500">{NODE_TYPE_LABELS[link.sourceType] ?? link.sourceType}</span>
              <span className="font-mono text-[12px] font-semibold text-slate-900">{link.sourceId}</span>
              <span className="text-[11px] text-slate-400">→</span>
              <span className="text-[11px] text-slate-500">{NODE_TYPE_LABELS[link.targetType] ?? link.targetType}</span>
              <span className="font-mono text-[12px] font-semibold text-slate-900">{link.targetId}</span>
            </div>
            {link.suspectReason && (
              <p className="text-[11px] text-amber-700 mb-2">
                <span className="font-medium">理由:</span> {link.suspectReason}
              </p>
            )}
            <SuspectLinkActionBar linkId={link.id} projectId={projectId} onResolved={onResolved} />
          </div>
        ))}
      </div>
    </div>
  );
}
