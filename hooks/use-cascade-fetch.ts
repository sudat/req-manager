import { useEffect, useState, useRef, useCallback } from "react";
import { useProject } from "@/components/project/project-context";

/**
 * 3段階カスケードデータフェッチの設定
 */
export type CascadeFetchConfig<L1, L2, L3> = {
  /** Level 1 データのフェッチ関数 */
  fetchLevel1: (projectId: string) => Promise<{ data: L1[] | null; error: string | null }>;

  /** Level 2 データのフェッチ関数（Level 1 のIDを受け取る） */
  fetchLevel2: (level1Id: string, projectId: string) => Promise<{ data: L2[] | null; error: string | null }>;

  /** Level 3 データのフェッチ関数（Level 2 のIDを受け取る） */
  fetchLevel3: (level2Id: string, projectId: string) => Promise<{ data: L3[] | null; error: string | null }>;
};

/**
 * 3段階カスケードデータフェッチの返り値
 */
export type CascadeFetchReturn<L1, L2, L3> = {
  // Level 1
  level1Items: L1[];
  selectedLevel1Id: string | null;
  selectLevel1Id: (id: string | null) => void;

  // Level 2
  level2Items: L2[];
  selectedLevel2Id: string | null;
  selectLevel2Id: (id: string | null) => void;

  // Level 3
  level3Items: L3[];

  // 共通
  loading: boolean;
  error: string | null;
};

/**
 * 3段階カスケードデータフェッチフック
 *
 * Level1 → Level2 → Level3 の連動読み込みを管理する汎用フック
 *
 * @example
 * ```ts
 * const {
 *   level1Items: businesses,
 *   selectLevel1Id: selectBusinessId,
 *   level2Items: tasks,
 *   selectLevel2Id: selectTaskId,
 *   level3Items: businessReqs,
 *   loading,
 *   error,
 * } = useCascadeFetch({
 *   fetchLevel1: (projectId) => listBusinesses(projectId),
 *   fetchLevel2: (businessId, projectId) => listTasksByBusinessId(businessId, projectId),
 *   fetchLevel3: (taskId, projectId) => listBusinessRequirementsByTaskId(taskId, projectId),
 * });
 * ```
 */
export function useCascadeFetch<L1, L2, L3>(
  config: CascadeFetchConfig<L1, L2, L3>
): CascadeFetchReturn<L1, L2, L3> {
  const { fetchLevel1, fetchLevel2, fetchLevel3 } = config;

  const [level1Items, setLevel1Items] = useState<L1[]>([]);
  const [selectedLevel1Id, setSelectedLevel1Id] = useState<string | null>(null);
  const [level2Items, setLevel2Items] = useState<L2[]>([]);
  const [selectedLevel2Id, setSelectedLevel2Id] = useState<string | null>(null);
  const [level3Items, setLevel3Items] = useState<L3[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentProjectId, loading: projectLoading } = useProject();

  // 前回の選択値を追跡（useCallback の依存関係問題を回避）
  const prevLevel1IdRef = useRef<string | null>(null);

  // Level 1 データ読み込み
  useEffect(() => {
    if (projectLoading) return;
    if (!currentProjectId) {
      setError("プロジェクトが選択されていません");
      setLevel1Items([]);
      setLoading(false);
      return;
    }

    let active = true;
    const loadLevel1 = async () => {
      setLoading(true);
      const { data, error: err } = await fetchLevel1(currentProjectId);
      if (!active) return;
      if (err) {
        setError(err);
      } else {
        setLevel1Items(data ?? []);
      }
      setLoading(false);
    };

    loadLevel1();
    return () => {
      active = false;
    };
  }, [currentProjectId, projectLoading, fetchLevel1]);

  // Level 2 データ読み込み
  useEffect(() => {
    if (!selectedLevel1Id) {
      setLevel2Items([]);
      setLevel3Items([]);
      return;
    }
    if (projectLoading || !currentProjectId) {
      setError("プロジェクトが選択されていません");
      setLevel2Items([]);
      setLevel3Items([]);
      return;
    }

    let active = true;
    const loadLevel2 = async () => {
      const { data, error: err } = await fetchLevel2(selectedLevel1Id, currentProjectId);
      if (!active) return;
      if (err) {
        setError(err);
      } else {
        setLevel2Items(data ?? []);
      }
    };

    loadLevel2();
    return () => {
      active = false;
    };
  }, [selectedLevel1Id, currentProjectId, projectLoading, fetchLevel2]);

  // Level 3 データ読み込み
  useEffect(() => {
    if (!selectedLevel2Id) {
      setLevel3Items([]);
      return;
    }
    if (projectLoading || !currentProjectId) {
      setError("プロジェクトが選択されていません");
      setLevel3Items([]);
      return;
    }

    let active = true;
    const loadLevel3 = async () => {
      const { data, error: err } = await fetchLevel3(selectedLevel2Id, currentProjectId);
      if (!active) return;
      if (err) {
        setError(err);
      } else {
        setLevel3Items(data ?? []);
      }
    };

    loadLevel3();
    return () => {
      active = false;
    };
  }, [selectedLevel2Id, currentProjectId, projectLoading, fetchLevel3]);

  // カスケードクリア付きのセッター（依存関係なし）
  const selectLevel1Id = useCallback((id: string | null) => {
    // 前回と異なる値で、かつ前回が null でない場合のみ下流をクリア
    if (prevLevel1IdRef.current !== null && prevLevel1IdRef.current !== id) {
      setSelectedLevel2Id(null);
    }
    prevLevel1IdRef.current = id;
    setSelectedLevel1Id(id);
  }, []);

  const selectLevel2Id = useCallback((id: string | null) => {
    setSelectedLevel2Id(id);
  }, []);

  return {
    level1Items,
    selectedLevel1Id,
    selectLevel1Id,
    level2Items,
    selectedLevel2Id,
    selectLevel2Id,
    level3Items,
    loading,
    error,
  };
}
