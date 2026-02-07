"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface InvestigateButtonProps {
  changeRequestId: string;
}

export function InvestigateButton({ changeRequestId }: InvestigateButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setIsRunning(true);
    try {
      const response = await fetch(`/api/tickets/${changeRequestId}/investigate`, {
        method: "POST",
      });
      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "影響調査に失敗しました");
        return;
      }
      // ページリロードで結果を表示
      router.refresh();
    } catch (error) {
      console.error("Investigation failed:", error);
      alert("影響調査に失敗しました");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="h-8 px-4 text-[14px] font-medium border-brand text-brand hover:bg-brand-50 gap-2"
      onClick={handleClick}
      disabled={isRunning}
    >
      {isRunning ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Search className="h-4 w-4" />
      )}
      {isRunning ? "調査中..." : "影響調査開始"}
    </Button>
  );
}
