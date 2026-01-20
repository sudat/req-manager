import { useState, useEffect } from "react";
import {
  listAcceptanceConfirmationsByChangeRequestId,
  updateAcceptanceConfirmationStatus,
} from "@/lib/data/acceptance-confirmations";
import type {
  AcceptanceConfirmation,
  AcceptanceConfirmationStatus,
} from "@/lib/domain/value-objects";

export interface CompletionStatus {
  total: number;
  verified: number;
  pending: number;
  completionRate: number;
}

export interface UseAcceptanceConfirmationsReturn {
  confirmations: AcceptanceConfirmation[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  clearError: () => void;
  updateStatus: (
    id: string,
    status: AcceptanceConfirmationStatus,
    verifiedBy: string,
    evidence?: string
  ) => Promise<void>;
  bulkUpdateStatus: (
    ids: Set<string>,
    status: AcceptanceConfirmationStatus,
    onSuccess: () => void
  ) => Promise<void>;
}

export interface UseAcceptanceConfirmationsProps {
  changeRequestId: string;
  onCompletionChange?: (status: CompletionStatus) => void;
}

export function useAcceptanceConfirmations({
  changeRequestId,
  onCompletionChange,
}: UseAcceptanceConfirmationsProps): UseAcceptanceConfirmationsReturn {
  const [confirmations, setConfirmations] = useState<AcceptanceConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // データ取得
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } =
        await listAcceptanceConfirmationsByChangeRequestId(changeRequestId);
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
      } else {
        setConfirmations(data ?? []);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [changeRequestId]);

  // 完了状況を監視して親に通知
  useEffect(() => {
    if (!loading && confirmations.length > 0 && onCompletionChange) {
      const total = confirmations.length;
      const verified = confirmations.filter(
        (c) => c.status === "verified_ok"
      ).length;
      const pending = total - verified;
      const completionRate = total > 0 ? (verified / total) * 100 : 100;
      onCompletionChange({ total, verified, pending, completionRate });
    }
  }, [confirmations, loading, onCompletionChange]);

  const clearError = () => {
    setError(null);
  };

  // 個別ステータス更新
  const updateStatus = async (
    id: string,
    newStatus: AcceptanceConfirmationStatus,
    verifiedBy: string,
    evidence?: string
  ) => {
    setSaving(true);
    setError(null);

    const { data, error: updateError } =
      await updateAcceptanceConfirmationStatus(
        id,
        newStatus,
        verifiedBy || "システム",
        evidence || undefined
      );

    setSaving(false);

    if (updateError || !data) {
      setError(updateError ?? "更新に失敗しました");
      return;
    }

    // ローカル状態を更新
    setConfirmations((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...data,
              verifiedBy: verifiedBy || "システム",
              verifiedAt: new Date().toISOString(),
              evidence: evidence || null,
            }
          : c
      )
    );
  };

  // 一括ステータス更新
  const bulkUpdateStatus = async (
    ids: Set<string>,
    status: AcceptanceConfirmationStatus,
    onSuccess: () => void
  ) => {
    const promises = Array.from(ids).map((id) =>
      updateAcceptanceConfirmationStatus(id, status, "システム", undefined)
    );

    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error).map((r) => r.error);

    if (errors.length > 0) {
      setError(`一部の更新に失敗しました: ${errors.join(", ")}`);
      return;
    }

    // 成功したものをローカル状態で更新
    setConfirmations((prev) =>
      prev.map((c) =>
        ids.has(c.id)
          ? {
              ...c,
              status,
              verifiedBy: "システム",
              verifiedAt: new Date().toISOString(),
            }
          : c
      )
    );
    onSuccess();
  };

  return {
    confirmations,
    loading,
    error,
    saving,
    clearError,
    updateStatus,
    bulkUpdateStatus,
  };
}
