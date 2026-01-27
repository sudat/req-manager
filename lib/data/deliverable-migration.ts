/**
 * 既存データから deliverables への移行ロジック
 */

import type { SystemDesignItem } from "../domain/enums";
import type { SystemDesignItemV2 } from "../domain/schemas/system-design";
import type { EntryPoint } from "../domain/value-objects";
import type { Deliverable, DeliverableDesign } from "../domain/schemas/deliverable";
import { isV2Item, isLegacyItem } from "../domain/schemas/system-design";

/**
 * 既存の SystemDesignItem[] + EntryPoint[] を Deliverable[] に変換
 *
 * 変換ルール:
 * 1. V2形式のSystemDesignItemをグルーピング（target.name単位）
 * 2. 同じtarget.nameを持つitemを1つのDeliverableに統合
 * 3. レガシー形式の各項目を個別のDeliverableとして扱う
 * 4. EntryPointsを該当するDeliverableに紐づけ（path -> entryPoint）
 */
export function migrateToDeliverables(
  systemDesign: (SystemDesignItem | SystemDesignItemV2)[] | Record<string, unknown>,
  entryPoints: EntryPoint[] | Record<string, unknown> = []
): Deliverable[] {
  // オブジェクト型の場合は配列に変換（空オブジェクトは空配列に）
  const designArray = Array.isArray(systemDesign) ? systemDesign : (
    Object.keys(systemDesign).length > 0 ? [systemDesign as any] : []
  );
  const entryArray = Array.isArray(entryPoints) ? entryPoints : (
    Object.keys(entryPoints).length > 0 ? [entryPoints as any] : []
  );

  // V2形式のアイテムとレガシー形式のアイテムを分離
  const v2Items = designArray.filter(isV2Item) as SystemDesignItemV2[];
  const legacyItems = designArray.filter(isLegacyItem) as SystemDesignItem[];

  // target.name でグルーピング
  const groupedByTarget = new Map<string, SystemDesignItemV2[]>();

  for (const item of v2Items) {
    const targetName = item.target.name;
    if (!groupedByTarget.has(targetName)) {
      groupedByTarget.set(targetName, []);
    }
    groupedByTarget.get(targetName)!.push(item);
  }

  // グループごとに Deliverable を生成
  const deliverables: Deliverable[] = [];

  for (const [targetName, items] of groupedByTarget.entries()) {
    // 最初のitemからtarget情報を取得
    const firstItem = items[0];
    const target = firstItem.target;

    // 各観点のcontentを統合
    const design: DeliverableDesign = {
      function: null,
      data: null,
      exception: null,
      auth: null,
      non_functional: null,
    };

    for (const item of items) {
      switch (item.category) {
        case "function":
          if ("input" in item.content && "process" in item.content && "output" in item.content) {
            design.function = {
              input: item.content.input,
              process: item.content.process,
              output: item.content.output,
              sideEffects: item.content.sideEffects,
            };
          }
          break;
        case "data":
          if ("fields" in item.content) {
            design.data = {
              fields: item.content.fields,
              tables: item.content.tables,
              constraints: item.content.constraints,
              migration: item.content.migration,
            };
          }
          break;
        case "exception":
          if ("errorCases" in item.content) {
            design.exception = {
              errorCases: item.content.errorCases,
              userNotification: item.content.userNotification,
              logging: item.content.logging,
              recovery: item.content.recovery,
            };
          }
          break;
        case "auth":
          if ("roles" in item.content && "operations" in item.content) {
            design.auth = {
              roles: item.content.roles,
              operations: item.content.operations,
              boundary: item.content.boundary,
            };
          }
          break;
        case "non_functional":
          // 旧 NonFunctionalDesignContent は performance, availability, monitoring のみ
          // security, scalability は null
          design.non_functional = {
            performance: "performance" in item.content ? item.content.performance : undefined,
            availability: "availability" in item.content ? item.content.availability : undefined,
            monitoring: "monitoring" in item.content ? item.content.monitoring : undefined,
            security: undefined,
            scalability: undefined,
          };
          break;
      }
    }

    // EntryPointを探す（target.nameとpath/responsibilityで照合）
    // 簡易実装: 最初のentryPointのpathを使用
    const entryPoint = entryArray.length > 0 ? entryArray[0].path : target.entryPoint || null;

    const deliverable: Deliverable = {
      id: firstItem.id, // 最初のitemのIDを使用（ユニーク性を保証）
      name: targetName,
      type: target.type,
      entryPoint,
      design,
    };

    deliverables.push(deliverable);
  }

  // レガシー形式の各項目を個別のDeliverableとして変換
  // カテゴリからタイプへのマッピング
  const categoryToTypeMap: Record<string, Deliverable["type"]> = {
    ui: "screen",
    batch: "batch",
    api: "api",
    job: "job",
    template: "template",
  };

  for (const item of legacyItems) {
    // カテゴリに応じて適切な観点にdescriptionを配置
    const design: DeliverableDesign = {
      function: null,
      data: null,
      exception: null,
      auth: null,
      non_functional: null,
    };

    // categoryに基づいて適切なdesign観点にdescriptionを配置
    switch (item.category) {
      case "database":
        design.data = {
          fields: item.description || "",
          tables: [],
          constraints: undefined,
          migration: undefined,
        };
        break;
      case "error_handling":
        design.exception = {
          errorCases: item.description || "",
          userNotification: undefined,
          logging: undefined,
          recovery: undefined,
        };
        break;
      case "logic":
      case "integration":
        design.function = {
          input: item.description || "",
          process: "",
          output: "",
          sideEffects: undefined,
        };
        break;
      default:
        // ui, batch, api, job, template は基本的に機能観点
        design.function = {
          input: item.description || "",
          process: "",
          output: "",
          sideEffects: undefined,
        };
    }

    const deliverable: Deliverable = {
      id: item.id,
      name: item.title,
      type: categoryToTypeMap[item.category] || "service",
      entryPoint: null,
      design,
    };

    deliverables.push(deliverable);
  }

  return deliverables;
}

/**
 * Deliverable[] から SystemDesignItemV2[] への逆変換
 * （ロールバック時や互換性維持のため）
 */
export function convertDeliverablestoSystemDesign(
  deliverables: Deliverable[]
): SystemDesignItemV2[] {
  const systemDesignItems: SystemDesignItemV2[] = [];

  for (const deliverable of deliverables) {
    const target = {
      name: deliverable.name,
      type: deliverable.type,
      entryPoint: deliverable.entryPoint,
    };

    // 各観点をSystemDesignItemに変換
    if (deliverable.design.function) {
      systemDesignItems.push({
        id: crypto.randomUUID(),
        category: "function",
        title: `${deliverable.name} - 機能観点`,
        target,
        content: deliverable.design.function,
        priority: "medium",
      });
    }

    if (deliverable.design.data) {
      systemDesignItems.push({
        id: crypto.randomUUID(),
        category: "data",
        title: `${deliverable.name} - データ観点`,
        target,
        content: deliverable.design.data,
        priority: "medium",
      });
    }

    if (deliverable.design.exception) {
      systemDesignItems.push({
        id: crypto.randomUUID(),
        category: "exception",
        title: `${deliverable.name} - 例外観点`,
        target,
        content: deliverable.design.exception,
        priority: "medium",
      });
    }

    if (deliverable.design.auth) {
      systemDesignItems.push({
        id: crypto.randomUUID(),
        category: "auth",
        title: `${deliverable.name} - 認証・認可観点`,
        target,
        content: deliverable.design.auth,
        priority: "medium",
      });
    }

    if (deliverable.design.non_functional) {
      systemDesignItems.push({
        id: crypto.randomUUID(),
        category: "non_functional",
        title: `${deliverable.name} - 非機能観点`,
        target,
        content: deliverable.design.non_functional,
        priority: "medium",
      });
    }
  }

  return systemDesignItems;
}
