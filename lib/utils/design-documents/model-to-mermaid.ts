import type { DesignDocument } from "@/lib/domain";

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
    const typeDetail = model.details?.typeDetail as any;
    if (!typeDetail) continue;

    const entityName = typeDetail.entityName || "Unknown";
    const relationships = typeDetail.relationships || [];

    for (const rel of relationships) {
      const symbol = relationshipTypeToMermaidSymbol(rel.type);
      const description = rel.description || "relates";
      mermaid += `  ${entityName} ${symbol} ${rel.target} : "${description}"\n`;
    }
  }

  // 4. attributes からエンティティ定義を生成
  for (const model of models) {
    const typeDetail = model.details?.typeDetail as any;
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

/**
 * リレーションシップのタイプをMermaidのER図記号に変換する
 *
 * @param type - リレーションシップのタイプ（1:1, 1:N, N:1, N:M）
 * @returns Mermaidのリレーション記号
 */
function relationshipTypeToMermaidSymbol(type: string): string {
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
