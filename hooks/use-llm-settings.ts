import { useEffect, useState, useCallback } from "react";
import {
  defaultProjectLlmSettings,
  getProjectLlmSettings,
  updateProjectLlmSettings,
} from "@/lib/data/llm-settings";
import type { ProjectLlmSettings } from "@/lib/domain";

/**
 * LLM設定の読み込み・保存を管理するカスタムフック
 */
export function useLlmSettings(projectId: string | null) {
  const [settings, setSettings] = useState<ProjectLlmSettings | null>(null);
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

      const { data, error: fetchError } = await getProjectLlmSettings(projectId);
      if (!mounted) return;

      if (fetchError || !data) {
        setError(fetchError ?? "設定の取得に失敗しました");
        setSettings({ ...defaultProjectLlmSettings });
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
  }, [projectId]);

  // 設定の更新（楽観的更新）
  const updateSettings = useCallback((updater: (prev: ProjectLlmSettings) => ProjectLlmSettings) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return updater(prev);
    });
  }, []);

  // 設定の保存
  const saveSettings = useCallback(async () => {
    if (!projectId || !settings) {
      setError("プロジェクトまたは設定が選択されていません");
      return false;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const { error: saveError } = await updateProjectLlmSettings(projectId, settings);

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return false;
    }

    setSuccess("設定を保存しました");
    setSaving(false);
    return true;
  }, [projectId, settings]);

  // 設定のリセット
  const resetSettings = useCallback(() => {
    if (!projectId) return;

    const refetch = async () => {
      const { data } = await getProjectLlmSettings(projectId);
      if (data) {
        setSettings(data);
      }
    };
    refetch();
    setSuccess(null);
    setError(null);
  }, [projectId]);

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
