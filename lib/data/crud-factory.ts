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
 */
const failIfMissingConfig = () => {
  const error = getSupabaseConfigError();
  if (error) {
    return { data: null, error };
  }
  return null;
};

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
      .eq("id", id);

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
      .eq("id", id);

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
      .eq("id", id);

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
