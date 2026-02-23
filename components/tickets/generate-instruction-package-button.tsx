"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";

interface GenerateInstructionPackageButtonProps {
  changeRequestId: string;
  disabled?: boolean;
}

export function GenerateInstructionPackageButton({
  changeRequestId,
  disabled = false,
}: GenerateInstructionPackageButtonProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/tickets/${changeRequestId}/instruction-package?format=markdown`,
        { method: "POST" }
      );

      if (!response.ok) {
        const payload = await response.json();
        alert(payload.error || "改修指示パッケージの生成に失敗しました");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `instruction-package-${changeRequestId}.md`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      router.refresh();
    } catch (error) {
      console.error("Instruction package generation failed:", error);
      alert("改修指示パッケージの生成に失敗しました");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      className="h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800"
      onClick={handleGenerate}
      disabled={disabled || isGenerating}
      title={disabled ? "影響調査完了かつ疑義リンク解消後に実行できます" : undefined}
    >
      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {isGenerating ? "生成中..." : "改修指示パッケージ生成"}
    </Button>
  );
}
