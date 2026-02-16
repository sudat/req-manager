import type { DesignDocument } from "@/lib/domain";
import { extractForeignKeyReference } from "@/lib/utils/foreign-key-helpers";

type Relationship = {
  target?: string;
  type?: string;
  description?: string;
  columnMappings?: Array<{ source?: string; target?: string }>;
};

type Attribute = {
  name?: string;
  constraints?: string;
  type?: string;
  primaryKey?: boolean;
  foreignKey?: boolean;
  logicalName?: string;
};

type ModelTypeDetail = {
  entityName?: string;
  entityLogicalName?: string;
  attributes?: Attribute[];
  relationships?: Relationship[];
};

/**
 * model型の設計書からMermaidのER図DSLを生成する
 *
 * @param dds - 設計書の配列
 * @returns Mermaidのerダイアグラム文字列
 */
export function modelDDsToMermaidErDiagram(dds: DesignDocument[]): string {
  // 1. type='model' のみフィルタ
  const models = dds.filter((dd) => dd.type === "model");

  if (models.length === 0) {
    return "erDiagram\n  %% エンティティが見つかりません";
  }

  // 2. Mermaid ER図のヘッダー
  let mermaid = "erDiagram\n";

  // 3. relationships から関連線を生成
  for (const model of models) {
    const typeDetail = getModelTypeDetail(model);
    if (!typeDetail) continue;

    const entityName = typeDetail.entityName || "Unknown";
    const relationships = (typeDetail.relationships || []) as Relationship[];
    const attributes = (typeDetail.attributes || []) as Attribute[];

    for (const rel of relationships) {
      const symbol = relationshipTypeToMermaidSymbol(rel.type);
      const targetEntityName = rel.target || "Unknown";
      const { label, unresolvedReason } = buildRelationshipLabel(rel, attributes);

      mermaid += `  ${entityName} ${symbol} ${targetEntityName} : "${label}"\n`;
      if (unresolvedReason) {
        mermaid += `  %% WARN: ${entityName} -> ${targetEntityName} ${unresolvedReason}\n`;
      }
    }
  }

  // 4. attributes からエンティティ定義を生成
  for (const model of models) {
    const typeDetail = getModelTypeDetail(model);
    if (!typeDetail) continue;

    const entityName = typeDetail.entityName || "Unknown";
    const entityLogicalName = typeDetail.entityLogicalName || "";
    const attributes = typeDetail.attributes || [];

    // エンティティ名（論理名があれば併記）
    const displayName = entityLogicalName
      ? `${entityName}["${entityLogicalName}"]`
      : entityName;

    mermaid += `  ${displayName} {\n`;

    // 属性リスト
    for (const attr of attributes) {
      // Mermaid erDiagram では、制約は PK または FK のみサポート
      // UNIQUE や NOT_NULL はコメントに含める
      let constraint = "";
      if (attr.primaryKey) {
        constraint = " PK";
      } else if (attr.foreignKey) {
        constraint = " FK";
      }

      // 論理名をコメントとして追加
      const comment = attr.logicalName ? ` "${attr.logicalName}"` : "";

      mermaid += `    ${attr.type} ${attr.name}${constraint}${comment}\n`;
    }

    mermaid += `  }\n`;
  }

  return mermaid;
}

function getModelTypeDetail(model: DesignDocument): ModelTypeDetail | null {
  if (!model.details || typeof model.details !== "object") return null;
  if (!("typeDetail" in model.details)) return null;
  const detail = (model.details as { typeDetail?: unknown }).typeDetail;
  if (!detail || typeof detail !== "object") return null;
  return detail as ModelTypeDetail;
}

/**
 * 関連線のラベルを組み立てる。
 * 優先順位:
 * 1. relationships[].columnMappings
 * 2. attributes[].constraints の FK 参照
 * 3. description
 * 4. "UNRESOLVED_MAPPING"
 */
type RelationshipLabelResult = {
  label: string;
  unresolvedReason?: string;
};

function buildRelationshipLabel(
  relationship: Relationship,
  attributes: Attribute[]
): RelationshipLabelResult {
  const mappingLabels = collectMappingLabels(relationship, attributes);
  const description = relationship.description?.trim();

  if (mappingLabels.length > 0 && description) {
    return { label: `${mappingLabels.join(", ")} (${description})` };
  }
  if (mappingLabels.length > 0) {
    return { label: mappingLabels.join(", ") };
  }
  if (description) {
    return { label: description };
  }

  return {
    label: "UNRESOLVED_MAPPING",
    unresolvedReason:
      "columnMappings / FK constraints / description のいずれかを設定してください",
  };
}

function collectMappingLabels(
  relationship: Relationship,
  attributes: Attribute[]
): string[] {
  const explicitMappings =
    relationship.columnMappings
      ?.filter((mapping) => mapping.source && mapping.target)
      .map((mapping) => `${mapping.source} -> ${mapping.target}`) || [];

  if (explicitMappings.length > 0) {
    return [...new Set(explicitMappings)];
  }

  const fallbackMappings = attributes
    .map((attribute) => {
      if (!attribute.constraints || !attribute.name) return null;
      const fkRef = extractForeignKeyReference(attribute.constraints);
      if (!fkRef) return null;
      if (fkRef.entity !== relationship.target) return null;
      return `${attribute.name} -> ${fkRef.attribute}`;
    })
    .filter((mapping): mapping is string => Boolean(mapping));

  return [...new Set(fallbackMappings)];
}

/**
 * リレーションシップのタイプをMermaidのER図記号に変換する
 *
 * @param type - リレーションシップのタイプ（1:1, 1:N, N:1, N:M）
 * @returns Mermaidのリレーション記号
 */
function relationshipTypeToMermaidSymbol(type?: string): string {
  switch (type) {
    case "1:1":
      return "||--||";
    case "1:N":
      return "||--o{";
    case "N:1":
      return "}o--||";
    case "N:M":
      return "}o--o{";
    default:
      return "||--||"; // デフォルトは1:1
  }
}
