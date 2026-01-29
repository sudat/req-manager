import { useEffect, useState, useCallback } from "react";
import {
  defaultProjectInvestigationSettings,
  getProjectInvestigationSettings,
  updateProjectInvestigationSettings,
} from "@/lib/data/project-settings";
import type { ProjectInvestigationSettings } from "@/lib/domain";

/**
 * プロジェクト設定の読み込み・保存を管理するカスタムフック
 */
export function useProjectSettings(projectId: string | null) {
  const [settings, setSettings] = useState<ProjectInvestigationSettings | null>(null);
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

      const { data, error: fetchError } = await getProjectInvestigationSettings(projectId);
      if (!mounted) return;

      if (fetchError || !data) {
        setError(fetchError ?? "設定の取得に失敗しました");
        setSettings({ ...defaultProjectInvestigationSettings });
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
  const updateSettings = useCallback((updater: (prev: ProjectInvestigationSettings) => ProjectInvestigationSettings) => {
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

    const { error: saveError } = await updateProjectInvestigationSettings(projectId, settings);

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

    // サーバーから再読み込み
    const refetch = async () => {
      const { data } = await getProjectInvestigationSettings(projectId);
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
