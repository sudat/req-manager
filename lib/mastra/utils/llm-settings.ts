import type { OpenAIModel } from '@/lib/mastra/utils/llm-helpers';
import { defaultProjectLlmSettings, getProjectLlmSettings } from '@/lib/data/llm-settings';

export type ProjectLlmRuntimeSettings = {
  provider: 'openai' | 'zai' | string;
  model: OpenAIModel;
  temperature?: number;
  baseUrl?: string;
  verbosity?: 'low' | 'medium' | 'high';
};

const normalizeAgentModel = (provider: string, model: string) => {
  if (model.includes('/')) return model;
  return `${provider}/${model}`;
};

export async function resolveProjectLlmRuntimeSettings(
  projectId?: string | null
): Promise<ProjectLlmRuntimeSettings> {
  if (!projectId) {
    return {
      provider: defaultProjectLlmSettings.provider,
      model: defaultProjectLlmSettings.model as OpenAIModel,
      temperature: defaultProjectLlmSettings.temperature,
      baseUrl: defaultProjectLlmSettings.base_url,
      verbosity: defaultProjectLlmSettings.verbosity,
    };
  }

  const { data } = await getProjectLlmSettings(projectId);
  const settings = data ?? defaultProjectLlmSettings;

  if (settings.provider !== 'openai' && settings.provider !== 'zai') {
    return {
      provider: defaultProjectLlmSettings.provider,
      model: defaultProjectLlmSettings.model as OpenAIModel,
      temperature: defaultProjectLlmSettings.temperature,
      baseUrl: defaultProjectLlmSettings.base_url,
      verbosity: defaultProjectLlmSettings.verbosity,
    };
  }

  return {
    provider: settings.provider,
    model: settings.model as OpenAIModel,
    temperature: settings.temperature,
    baseUrl: settings.base_url,
    verbosity: settings.verbosity,
  };
}

export async function resolveProjectAgentModel(
  projectId?: string | null
): Promise<string> {
  const settings = await resolveProjectLlmRuntimeSettings(projectId);
  const normalizedProvider = settings.provider === 'zai' ? 'openai' : settings.provider;
  return normalizeAgentModel(normalizedProvider, settings.model);
}
