import { supabase, getSupabaseConfigError } from "@/lib/supabase/client";

/**
 * Supabase CRUD操作の共通戻り値型
 * 成功時、失敗時、データなしの3パターン
 */
export type DataResult<T> =
  | { data: T; error: null }
  | { data: null; error: string }
  | { data: null; error: null };

/**
 * CRUD操作の設定
 */
export type CrudConfig<Row, Entity, Input> = {
  /** Supabaseのテーブル名 */
  tableName: string;
  /** 主キーのカラム名（デフォルト: "id"） */
  idColumn?: string;

  /** Row → Entity変換関数 */
  toEntity: (row: Row) => Entity;

  /** Input → Row変換関数（create用） */
  toRow: (input: Input) => Partial<Row>;

  /** ソート順カラム（デフォルト: ["id"]） */
  orderBy?: string[];

  /** created_atカラム名（デフォルト: "created_at"） */
  createdAtColumn?: string;

  /** updated_atカラム名（デフォルト: "updated_at"） */
  updatedAtColumn?: string;

  /** project_idカラム名（デフォルト: "project_id"） */
  projectIdColumn?: string;
};

/**
 * Supabase設定エラーチェック
 *
 * Supabase接続設定が正しく設定されているかチェックする。
 * 設定エラーがある場合はエラーオブジェクトを返す。
 *
 * @returns 設定エラーがある場合は { data: null, error: string }、正常な場合は null
 *
 * @example
 * ```ts
 * const configError = failIfMissingConfig();
 * if (configError) return configError;
 * // 以降のSupabase操作を実行
 * ```
 */
export const failIfMissingConfig = (): DataResult<never> | null => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

/**
 * projectIdフィルタ付きクエリ実行ヘルパー
 *
 * 設定チェック、projectIdフィルタ適用、エンティティ変換を一括処理する。
 * ドメイン固有のロジック（マージ処理など）が必要な場合は、
 * このヘルパーで基本的なクエリ実行を行い、その後に追加処理を適用できる。
 *
 * @param queryBuilder クエリ構築関数（supabase.from(...).select(...)など）
 * @param projectId プロジェクトID（指定時はフィルタ適用）
 * @param toEntity Row → Entity 変換関数
 * @param projectIdColumn project_idカラム名（デフォルト: "project_id"）
 * @returns クエリ実行結果
 *
 * @example
 * ```ts
 * // 基本的な使い方
 * const result = await executeListQuery(
 *   () => supabase.from("tasks").select("*").order("sort_order"),
 *   projectId,
 *   toTask
 * );
 *
 * // 追加のドメインロジックを適用
 * if (result.error || !result.data) return result;
 * const mergedData = applyMergeLogic(result.data);
 * return { data: mergedData, error: null };
 * ```
 */
export async function executeListQuery<Row, Entity>(
  queryBuilder: () => any, // Supabaseのクエリビルダー型（anyで柔軟に対応）
  projectId: string | undefined,
  toEntity: (row: Row) => Entity,
  projectIdColumn = "project_id"
): Promise<DataResult<Entity[]>> {
  const configError = failIfMissingConfig();
  if (configError) return configError;

  let query = queryBuilder();
  if (projectId) {
    query = query.eq(projectIdColumn, projectId);
  }
  const { data, error } = await query;
  if (error) return { data: null, error: error.message };
  return { data: (data as Row[]).map(toEntity), error: null };
}

/**
 * CRUD操作ファクトリ関数
 *
 * @example
 * ```ts
 * const businessCrud = createCrudOperations({
 *   tableName: "business_domains",
 *   toEntity: toBusiness,
 *   toRow: toBusinessRow,
 * });
 *
 * export const { list, getById, create, update, delete: deleteBusiness } = businessCrud;
 * ```
 */
export function createCrudOperations<Row extends Record<string, any>, Entity, Input>(
  config: CrudConfig<Row, Entity, Input>
) {
  const {
    tableName,
    toEntity,
    toRow,
    orderBy = ["id"],
    createdAtColumn = "created_at",
    updatedAtColumn = "updated_at",
    projectIdColumn = "project_id",
    idColumn = "id",
  } = config;

  /**
   * 一覧取得
   */
  const list = async (projectId?: string): Promise<DataResult<Entity[]>> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    let query = supabase
      .from(tableName)
      .select("*");

    // orderBy適用
    for (const col of orderBy) {
      query = query.order(col);
    }

    if (projectId) {
      query = query.eq(projectIdColumn, projectId);
    }

    const { data, error } = await query;

    if (error) return { data: null, error: error.message };
    return { data: (data as Row[]).map(toEntity), error: null };
  };

  /**
   * ID指定取得
   */
  const getById = async (id: string, projectId?: string): Promise<DataResult<Entity>> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    let query = supabase
      .from(tableName)
      .select("*")
      .eq(idColumn, id);

    if (projectId) {
      query = query.eq(projectIdColumn, projectId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) return { data: null, error: error.message };
    if (!data) return { data: null, error: null };
    return { data: toEntity(data as Row), error: null };
  };

  /**
   * 新規作成
   */
  const create = async (
    input: Input & { projectId: string }
  ): Promise<DataResult<Entity>> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    const now = new Date().toISOString();
    const payload = {
      ...toRow(input),
      [projectIdColumn]: input.projectId,
      [createdAtColumn]: now,
      [updatedAtColumn]: now,
    };

    const { data, error } = await supabase
      .from(tableName)
      .insert(payload)
      .select("*")
      .single();

    if (error) return { data: null, error: error.message };
    return { data: toEntity(data as Row), error: null };
  };

  /**
   * 更新
   */
  const update = async (
    id: string,
    input: Partial<Input>,
    projectId?: string
  ): Promise<DataResult<Entity>> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    const now = new Date().toISOString();
    const payload = {
      ...toRow(input as Input),
      [updatedAtColumn]: now,
    };

    let query = supabase
      .from(tableName)
      .update(payload)
      .eq(idColumn, id);

    if (projectId) {
      query = query.eq(projectIdColumn, projectId);
    }

    const { data, error } = await query
      .select("*")
      .single();

    if (error) return { data: null, error: error.message };
    return { data: toEntity(data as Row), error: null };
  };

  /**
   * 削除
   */
  const deleteById = async (id: string, projectId?: string): Promise<DataResult<boolean>> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    let query = supabase
      .from(tableName)
      .delete()
      .eq(idColumn, id);

    if (projectId) {
      query = query.eq(projectIdColumn, projectId);
    }

    const { error } = await query;

    if (error) return { data: null, error: error.message };
    return { data: true, error: null };
  };

  return {
    list,
    getById,
    create,
    update,
    delete: deleteById,
  };
}

/**
 * 並び替え用の共通型
 */
export type SortOrderUpdate = {
  id: string;
  sortOrder: number;
};

/**
 * 並び替え一括更新関数のファクトリ
 *
 * 各エンティティの並び替え更新関数を生成する。
 * テーブル名を引数に取り、sort_order + updated_atの一括更新を行う。
 *
 * @param tableName Supabaseのテーブル名
 * @returns 並び替え一括更新関数
 *
 * @example
 * ```ts
 * export const updateBusinessesSortOrder = createSortOrderUpdater("business_domains");
 * ```
 */
export function createSortOrderUpdater(tableName: string, idColumn = "id") {
  return async (
    updates: SortOrderUpdate[],
    projectId?: string
  ): Promise<{ data: boolean | null; error: string | null }> => {
    const configError = failIfMissingConfig();
    if (configError) return configError;

    const updatePromises = updates.map((update) => {
      let query = supabase
        .from(tableName)
        .update({ sort_order: update.sortOrder, updated_at: new Date().toISOString() })
        .eq(idColumn, update.id);

      if (projectId) {
        query = query.eq("project_id", projectId);
      }

      return query;
    });

    const results = await Promise.all(updatePromises);

    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return { data: null, error: firstError.message };

    return { data: true, error: null };
  };
}
