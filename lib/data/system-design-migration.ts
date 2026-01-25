import type { SystemDesignItem } from "../domain/enums";
import type {
  SystemDesignItemV2,
  DesignPerspective,
  DesignTarget,
  DesignTargetType,
} from "../domain/schemas/system-design";
import { isV2Item, isLegacyItem } from "../domain/schemas/system-design";

/**
 * 旧カテゴリ→新観点マッピング
 */
const CATEGORY_MAP: Record<string, DesignPerspective> = {
  database: "data",
  api: "function",
  logic: "function",
  ui: "function",
  integration: "function",
  batch: "function",
  error_handling: "exception",
};

/**
 * システム設計項目の配列をV2とレガシーに分類
 */
export function classifyDesignItems(items: unknown[]): {
  v2Items: SystemDesignItemV2[];
  legacyItems: SystemDesignItem[];
} {
  const v2Items: SystemDesignItemV2[] = [];
  const legacyItems: SystemDesignItem[] = [];

  for (const item of items) {
    if (isV2Item(item)) {
      v2Items.push(item);
    } else if (isLegacyItem(item)) {
      legacyItems.push(item);
    }
  }

  return { v2Items, legacyItems };
}

/**
 * レガシー項目を新観点にマッピング
 * （移行時の参考情報として使用）
 */
export function suggestPerspectiveForLegacy(
  item: SystemDesignItem
): DesignPerspective {
  return CATEGORY_MAP[item.category] || "function";
}

/**
 * レガシー項目から対象物名を推測
 */
export function extractTargetNameFromLegacy(item: SystemDesignItem): string {
  // titleから対象物を抽出する簡易ロジック
  // 例: "ユーザー登録画面のDB設計" → "ユーザー登録画面"
  const match = item.title.match(/^(.+?)(の|：|:)/);
  return match ? match[1] : item.title;
}

/**
 * レガシーデータの参考表示用テキスト生成
 */
export function formatLegacyItemForDisplay(item: SystemDesignItem): string {
  const categoryLabels: Record<string, string> = {
    database: "データベース",
    api: "API",
    logic: "ロジック",
    ui: "UI",
    integration: "連携",
    batch: "バッチ",
    error_handling: "エラー処理",
  };

  return `[${categoryLabels[item.category] || item.category}] ${item.title}: ${item.description}`;
}

/**
 * レガシーシステム設計項目から対象物リストを抽出
 */
export function extractTargetsFromLegacyItems(
  legacyItems: SystemDesignItem[]
): DesignTarget[] {
  const targetMap = new Map<string, DesignTarget>();

  for (const item of legacyItems) {
    const targetName = extractTargetNameFromLegacy(item);

    if (!targetMap.has(targetName)) {
      const targetType = inferTargetTypeFromCategory(item.category);

      targetMap.set(targetName, {
        name: targetName,
        type: targetType,
        entryPoint: null,
      });
    }
  }

  return Array.from(targetMap.values());
}

/**
 * カテゴリから対象物種別を推測
 */
function inferTargetTypeFromCategory(category: string): DesignTargetType {
  const categoryToTypeMap: Record<string, DesignTargetType> = {
    ui: "screen",
    api: "api",
    batch: "batch",
    database: "screen",
    logic: "screen",
    integration: "api",
    error_handling: "screen",
  };

  return categoryToTypeMap[category] || "screen";
}
