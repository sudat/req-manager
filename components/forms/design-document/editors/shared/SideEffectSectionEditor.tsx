import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabelWithTooltip } from "@/components/forms/design-document/FoldableStructuredSection";

interface SideEffectSectionEditorProps {
  label: string;
  tooltip: string;
  description: string;
  onAdd: () => void;
  disabled?: boolean;
  addLabel?: string;
  children: ReactNode;
}

export function SideEffectSectionEditor({
  label,
  tooltip,
  description,
  onAdd,
  disabled = false,
  addLabel = "追加",
  children,
}: SideEffectSectionEditorProps): ReactNode {
  return (
    <div className="space-y-2 rounded-md border border-slate-200 p-3">
      <div>
        <div className="flex items-center justify-between">
          <SectionLabelWithTooltip label={label} tooltip={tooltip} />
          <Button
            variant="default"
            size="sm"
            className="h-7 gap-2 text-[12px]"
            onClick={onAdd}
            disabled={disabled}
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {children}
    </div>
  );
}
