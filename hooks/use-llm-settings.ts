import {
  defaultProjectLlmSettings,
  getProjectLlmSettings,
  updateProjectLlmSettings,
} from "@/lib/data/llm-settings";
import type { ProjectLlmSettings } from "@/lib/domain";
import { useSettingsManager } from "./use-settings-manager";

const fns = {
  fetch: getProjectLlmSettings,
  save: updateProjectLlmSettings,
  defaultValue: defaultProjectLlmSettings,
};

/**
 * LLM設定の読み込み・保存を管理するカスタムフック
 */
export function useLlmSettings(projectId: string | null) {
  return useSettingsManager<ProjectLlmSettings>(projectId, fns);
}
