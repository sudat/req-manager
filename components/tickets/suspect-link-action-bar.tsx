"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X, Loader2 } from "lucide-react";
import { resolveSuspectLink } from "@/lib/data/requirement-links";

interface SuspectLinkActionBarProps {
  linkId: string;
  projectId: string;
  onResolved: () => void;
}

export function SuspectLinkActionBar({ linkId, projectId, onResolved }: SuspectLinkActionBarProps) {
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      await resolveSuspectLink(linkId, projectId);
      onResolved();
    } catch (error) {
      console.error("Failed to resolve suspect link:", error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-3 text-[13px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
        onClick={handleResolve}
        disabled={isResolving}
      >
        {isResolving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        確認して維持
      </Button>
    </div>
  );
}
