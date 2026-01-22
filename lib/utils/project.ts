export const PROJECT_REQUIRED_MESSAGE = "プロジェクトが選択されていません";

type RequireProjectIdOptions = {
  currentProjectId: string | null;
  projectLoading?: boolean;
  onMissing?: (message: string) => void;
};

export function requireProjectId({
  currentProjectId,
  projectLoading,
  onMissing,
}: RequireProjectIdOptions): string | null {
  if (projectLoading) return null;
  if (!currentProjectId) {
    onMissing?.(PROJECT_REQUIRED_MESSAGE);
    return null;
  }
  return currentProjectId;
}
