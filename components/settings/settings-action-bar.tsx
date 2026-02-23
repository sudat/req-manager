"use client";

import { Button } from "@/components/ui/button";

type SettingsActionBarProps = {
  saving: boolean;
  onReset: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveClassName?: string;
  wrapperClassName?: string;
};

export function SettingsActionBar({
  saving,
  onReset,
  onSave,
  saveDisabled = false,
  saveClassName,
  wrapperClassName = "pt-4",
}: SettingsActionBarProps) {
  return (
    <div className={`flex justify-end gap-3 ${wrapperClassName}`}>
      <Button
        variant="outline"
        onClick={onReset}
        disabled={saving}
        className="h-8 px-6"
      >
        リセット
      </Button>
      <Button
        onClick={onSave}
        disabled={saving || saveDisabled}
        className={saveClassName ?? "bg-slate-900 hover:bg-slate-800 h-8 px-6"}
      >
        {saving ? "保存中..." : "保存"}
      </Button>
    </div>
  );
}
