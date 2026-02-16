"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

type RunSaveOptions = {
  onSuccess?: () => void;
  navigateOnSuccess?: boolean;
};

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useEditFormLifecycle(successPath: string, initialLoading = true) {
  const router = useRouter();
  const [loading, setLoading] = useState(initialLoading);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runLoad = useCallback(async (loader: () => Promise<void>): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await loader();
    } catch (e) {
      setError(toErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const runSave = useCallback(
    async (
      saver: () => Promise<string | null | undefined>,
      options?: RunSaveOptions
    ): Promise<boolean> => {
      setSaving(true);
      setError(null);

      try {
        const saveError = await saver();
        if (saveError) {
          setError(saveError);
          return false;
        }

        options?.onSuccess?.();

        if (options?.navigateOnSuccess ?? true) {
          router.push(successPath);
        }

        return true;
      } catch (e) {
        setError(toErrorMessage(e));
        return false;
      } finally {
        setSaving(false);
      }
    },
    [router, successPath]
  );

  const navigateToSuccess = useCallback(() => {
    router.push(successPath);
  }, [router, successPath]);

  return {
    loading,
    saving,
    error,
    setLoading,
    setError,
    runLoad,
    runSave,
    navigateToSuccess,
  };
}
