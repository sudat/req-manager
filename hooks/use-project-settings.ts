import {
  defaultProjectInvestigationSettings,
  getProjectInvestigationSettings,
  updateProjectInvestigationSettings,
} from "@/lib/data/project-settings";
import type { ProjectInvestigationSettings } from "@/lib/domain";
import { useSettingsManager } from "./use-settings-manager";

const fns = {
  fetch: getProjectInvestigationSettings,
  save: updateProjectInvestigationSettings,
  defaultValue: defaultProjectInvestigationSettings,
};

/**
 * プロジェクト設定の読み込み・保存を管理するカスタムフック
 */
export function useProjectSettings(projectId: string | null) {
  return useSettingsManager<ProjectInvestigationSettings>(projectId, fns);
}
