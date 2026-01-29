"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectInvestigationSettings } from "@/lib/domain";

type ExplorationSettingsSectionProps = {
  settings: ProjectInvestigationSettings;
  includePatternsText: string;
  excludePatternsText: string;
  onIncludePatternsChange: (value: string) => void;
  onExcludePatternsChange: (value: string) => void;
};

export function ExplorationSettingsSection({
  settings,
  includePatternsText,
  excludePatternsText,
  onIncludePatternsChange,
  onExcludePatternsChange,
}: ExplorationSettingsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-[15px] font-semibold text-slate-900">探索設定</h3>
        <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">
          コード探索時のデフォルトパターンを設定します
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <div className="space-y-2 md:col-span-3">
          <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            含めるパターン
          </Label>
          <Textarea
            value={includePatternsText}
            onChange={(e) => onIncludePatternsChange(e.target.value)}
            placeholder={"src/**\napp/**"}
            className="min-h-[88px]"
          />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
            除外パターン
          </Label>
          <Textarea
            value={excludePatternsText}
            onChange={(e) => onExcludePatternsChange(e.target.value)}
            placeholder={"node_modules/**\n**/*.test.*"}
            className="min-h-[88px]"
          />
        </div>
      </div>
    </div>
  );
}
