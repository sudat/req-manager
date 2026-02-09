"use client";

import type { ReactNode } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function FoldableStructuredSection({
  title,
  description,
  titleTooltip,
  children,
  defaultOpen = false,
}: {
  title: string;
  description: string;
  titleTooltip?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}): ReactNode {
  return (
    <Collapsible defaultOpen={defaultOpen} className="rounded-md border border-slate-200 bg-white p-3">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="group w-full flex items-start justify-between gap-3 text-left cursor-pointer"
        >
          <div>
            <div className="inline-flex items-center gap-1.5">
              <Label className="cursor-pointer">{title}</Label>
              {titleTooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex items-center text-muted-foreground"
                      aria-label={`${title} の説明`}
                    >
                      <CircleHelp className="h-3.5 w-3.5" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[min(90vw,48rem)] whitespace-normal leading-relaxed">
                    {titleTooltip}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SectionLabelWithTooltip({
  label,
  tooltip,
  className,
}: {
  label: string;
  tooltip: string;
  className?: string;
}): ReactNode {
  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center text-muted-foreground" aria-label={`${label} の説明`}>
            <CircleHelp className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[min(90vw,48rem)] whitespace-normal leading-relaxed">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
