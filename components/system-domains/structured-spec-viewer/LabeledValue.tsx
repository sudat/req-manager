"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LabeledValueProps {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
}

export function LabeledValue({
  label,
  children,
  className,
  labelClassName,
  valueClassName,
}: LabeledValueProps): ReactNode {
  return (
    <div className={cn("space-y-1", className)}>
      <div className={cn("text-xs text-slate-500", labelClassName)}>{label}</div>
      <div className={cn("text-sm", valueClassName)}>{children}</div>
    </div>
  );
}
