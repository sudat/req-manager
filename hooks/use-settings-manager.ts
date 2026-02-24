import { useEffect, useState, useCallback } from "react";

type SettingsFns<T> = {
  fetch: (projectId: string) => Promise<{ data: T | null; error: string | null }>;
  save: (projectId: string, settings: T) => Promise<{ error: string | null }>;
  defaultValue: T;
};

/**
 * 設定管理の共通カスタムフック
 * fetch/save関数とデフォルト値を渡すだけで、読み込み・保存・リセットを提供する
 */
export function useSettingsManager<T>(projectId: string | null, fns: SettingsFns<T>) {
  const [settings, setSettings] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 設定の読み込み
  useEffect(() => {
    if (!projectId) {
      setSettings(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const fetchSettings = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error: fetchError } = await fns.fetch(projectId);
      if (!mounted) return;

      if (fetchError || !data) {
        setError(fetchError ?? "設定の取得に失敗しました");
        setSettings({ ...fns.defaultValue });
        setLoading(false);
        return;
      }

      setSettings(data);
      setLoading(false);
    };

    fetchSettings();
    return () => {
      mounted = false;
    };
  }, [projectId, fns]);

  // 設定の更新（楽観的更新）
  const updateSettings = useCallback((updater: (prev: T) => T) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  // 設定の保存
  const saveSettings = useCallback(async (nextSettings?: T) => {
    const targetSettings = nextSettings ?? settings;

    if (!projectId || !targetSettings) {
      setError("プロジェクトまたは設定が選択されていません");
      return false;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: saveError } = await fns.save(projectId, targetSettings);

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return false;
    }

    if (nextSettings) {
      setSettings(nextSettings);
    }

    setSuccess("設定を保存しました");
    setSaving(false);
    return true;
  }, [projectId, settings, fns]);

  // 設定のリセット
  const resetSettings = useCallback(() => {
    if (!projectId) return;

    const refetch = async () => {
      const { data } = await fns.fetch(projectId);
      if (data) {
        setSettings(data);
      }
    };
    refetch();
    setSuccess(null);
    setError(null);
  }, [projectId, fns]);

  return {
    settings,
    loading,
    saving,
    error,
    success,
    updateSettings,
    saveSettings,
    resetSettings,
    setError,
    setSuccess,
  };
}
