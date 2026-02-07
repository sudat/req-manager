"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { RequirementLink } from "@/lib/domain";
import { SuspectLinkActionBar } from "./suspect-link-action-bar";

const NODE_TYPE_LABELS: Record<string, string> = {
  bd: "業務領域",
  bt: "業務タスク",
  br: "業務要件",
  sd: "システム領域",
  sf: "システム機能",
  sr: "システム要件",
  ac: "受入基準",
  dd: "設計ドキュメント",
};

const LINK_TYPE_LABELS: Record<string, string> = {
  derived_from: "派生から",
  realizes: "実現する",
};

interface SuspectLinkCardProps {
  link: RequirementLink;
  projectId: string;
  onResolved: () => void;
}

export function SuspectLinkCard({ link, projectId, onResolved }: SuspectLinkCardProps) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50/60 p-4">
      {/* 疑義アイコン + リンク種別 */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-800 text-[12px] font-medium px-2 py-0.5">
          {LINK_TYPE_LABELS[link.linkType] ?? link.linkType}
        </Badge>
      </div>

      {/* source → target 視覚表現 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500">{NODE_TYPE_LABELS[link.sourceType] ?? link.sourceType}</span>
          <span className="font-mono text-[13px] font-semibold text-slate-900">{link.sourceId}</span>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
        <div className="flex flex-col">
          <span className="text-[11px] text-slate-500">{NODE_TYPE_LABELS[link.targetType] ?? link.targetType}</span>
          <span className="font-mono text-[13px] font-semibold text-slate-900">{link.targetId}</span>
        </div>
      </div>

      {/* 疑義理由 */}
      {link.suspectReason && (
        <p className="text-[12px] text-amber-700 mb-3">
          <span className="font-medium">疑義理由:</span> {link.suspectReason}
        </p>
      )}

      {/* アクション */}
      <SuspectLinkActionBar linkId={link.id} projectId={projectId} onResolved={onResolved} />
    </div>
  );
}
