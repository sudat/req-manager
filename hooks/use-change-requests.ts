import { useEffect, useState } from "react";
import { listChangeRequests, deleteChangeRequest } from "@/lib/data/change-requests";
import type { ChangeRequest } from "@/lib/domain/value-objects";

export interface UseChangeRequestsReturn {
  changeRequests: ChangeRequest[];
  loading: boolean;
  error: string | null;
  deleteRequest: (id: string, ticketId: string) => Promise<void>;
  clearError: () => void;
}

export function useChangeRequests(): UseChangeRequestsReturn {
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const { data, error: fetchError } = await listChangeRequests();
      if (!active) return;
      if (fetchError) {
        setError(fetchError);
        setChangeRequests([]);
      } else {
        setError(null);
        setChangeRequests(data ?? []);
      }
      setLoading(false);
    };
    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const deleteRequest = async (id: string, ticketId: string) => {
    const { error: deleteError } = await deleteChangeRequest(id);
    if (deleteError) {
      setError(`削除に失敗しました: ${deleteError}`);
      return;
    }
    setChangeRequests((prev) => prev.filter((cr) => cr.id !== id));
    setError(null);
  };

  const clearError = () => setError(null);

  return {
    changeRequests,
    loading,
    error,
    deleteRequest,
    clearError,
  };
}
