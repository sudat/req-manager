"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  message: string;
  variant?: "boxed" | "inline";
  className?: string;
}

const EMPTY_STATE_CLASSNAMES: Record<NonNullable<EmptyStateProps["variant"]>, string> = {
  boxed: "rounded-md border border-dashed p-4 text-sm text-muted-foreground",
  inline: "text-sm text-slate-400 italic",
};

export function EmptyState({
  message,
  variant = "boxed",
  className,
}: EmptyStateProps): ReactNode {
  return <div className={cn(EMPTY_STATE_CLASSNAMES[variant], className)}>{message}</div>;
}
