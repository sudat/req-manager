"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { StructuredSpecViewer } from "@/components/system-domains/structured-spec-viewer";
import type { DesignDocument, EntryPoint } from "@/lib/domain";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";

interface DdDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ddId: string;
  projectId: string;
}

export function DdDetailDialog({ isOpen, onClose, ddId, projectId }: DdDetailDialogProps) {
  const [dd, setDd] = useState<DesignDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !ddId) return;

    // projectIdが空文字列の場合は早期リターン
    if (!projectId || projectId === "") {
      console.error("[DdDetailDialog] Invalid projectId:", projectId);
      setError("プロジェクトIDが設定されていません");
      setLoading(false);
      return;
    }

    const fetchDd = async () => {
      setLoading(true);
      setError(null);

      console.log("[DdDetailDialog] Fetching DD:", { ddId, projectId });

      try {
        const response = await fetch(
          `/api/design-documents/${ddId}?projectId=${projectId}`
        );

        console.log("[DdDetailDialog] Response status:", response.status);

        if (!response.ok) {
          const contentType = response.headers.get("content-type") ?? "";
          let message = `DDの取得に失敗しました (HTTP ${response.status})`;

          if (contentType.includes("application/json")) {
            const errorData = await response.json().catch(() => null);
            console.error("[DdDetailDialog] Error response:", errorData);
            if (
              errorData &&
              typeof errorData === "object" &&
              "error" in errorData &&
              typeof errorData.error === "string" &&
              errorData.error.trim() !== ""
            ) {
              message = errorData.error;
            }
          } else {
            const rawText = await response.text().catch(() => "");
            const preview = rawText.trim().slice(0, 120);
            console.error("[DdDetailDialog] Non-JSON error response:", {
              status: response.status,
              statusText: response.statusText,
              preview,
            });
            if (response.statusText) {
              message = `${message}: ${response.statusText}`;
            }
          }

          throw new Error(message);
        }

        const data = await response.json();
        console.log("[DdDetailDialog] DD data:", data);
        setDd(data.dd);
      } catch (err) {
        console.error("Failed to fetch DD:", err);
        setError(err instanceof Error ? err.message : "DDの取得に失敗しました");
        setDd(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDd();
  }, [isOpen, ddId, projectId]);

  const entryPoints: EntryPoint[] = dd?.entryPoints ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl sm:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dd?.name ?? ddId} の詳細</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
            <span className="ml-3 text-slate-600">読み込み中...</span>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : dd ? (
          <StructuredSpecViewer
            spec={dd.details as StructuredDesignDocumentSpec}
            entryPoints={entryPoints}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
