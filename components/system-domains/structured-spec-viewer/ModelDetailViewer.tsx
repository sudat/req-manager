import type { StructuredTypeDetail } from "@/lib/domain/schemas/design-document-structured";
import { Badge } from "@/components/ui/badge";
import {
  extractForeignKeyReference,
  extractCheckConstraints,
} from "@/lib/utils/foreign-key-helpers";

interface ModelDetailViewerProps {
  typeDetail: Extract<StructuredTypeDetail, { ioType: "model" }>;
}

const relationshipTypeLabels: Record<string, string> = {
  "1:1": "1対1",
  "1:N": "1対多",
  "N:1": "多対1",
  "N:M": "多対多",
};

export function ModelDetailViewer({ typeDetail }: ModelDetailViewerProps) {
  const hasContent =
    typeDetail.entityName ||
    typeDetail.attributes?.length ||
    typeDetail.relationships?.length;

  if (!hasContent) {
    return (
      <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
        エンティティ定義が記述されていません
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* エンティティ名と説明 */}
      {typeDetail.entityName && (
        <div>
          <h4 className="font-medium mb-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">テーブル</Badge>
            {typeDetail.entityName}
            {typeDetail.entityLogicalName && (
              <span className="font-normal text-muted-foreground"> ( {typeDetail.entityLogicalName} )</span>
            )}
          </h4>
          {typeDetail.entityDescription && (
            <p className="text-sm text-muted-foreground">{typeDetail.entityDescription}</p>
          )}
        </div>
      )}

      {/* 属性リスト */}
      {typeDetail.attributes && typeDetail.attributes.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">属性</h5>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="w-[20%] px-3 py-2 text-left font-medium">名前</th>
                  <th className="w-[10%] px-3 py-2 text-left font-medium">型</th>
                  <th className="w-[20%] px-3 py-2 text-left font-medium">属性</th>
                  <th className="w-[25%] px-3 py-2 text-left font-medium">追加制約</th>
                  <th className="w-[25%] px-3 py-2 text-left font-medium">説明</th>
                </tr>
              </thead>
              <tbody>
                {typeDetail.attributes.map((attr, index) => (
                  <tr
                    key={index}
                    className="border-t"
                  >
                    <td className="px-3 py-2">
                      <div className="font-mono text-xs">
                        {attr.name}
                        {attr.logicalName && (
                          <span className="text-muted-foreground"> ( {attr.logicalName} )</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{attr.type}</code>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {attr.primaryKey && (
                          <Badge variant="default" className="text-xs">
                            PK
                          </Badge>
                        )}
                        {attr.unique && (
                          <Badge variant="outline" className="text-xs">
                            UNIQUE
                          </Badge>
                        )}
                        {attr.nullable === false && (
                          <Badge variant="secondary" className="text-xs">
                            NOT NULL
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {(() => {
                          const fkRef = extractForeignKeyReference(attr.constraints);
                          const checkConstraints = extractCheckConstraints(attr.constraints);

                          return (
                            <>
                              {fkRef && (
                                <Badge variant="outline" className="text-xs">
                                  FK → {fkRef.entity}.{fkRef.attribute}
                                </Badge>
                              )}
                              {checkConstraints && (
                                <Badge variant="secondary" className="text-xs">
                                  {checkConstraints}
                                </Badge>
                              )}
                            </>
                          );
                        })()}
                        {attr.enumValues && attr.enumValues.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {attr.enumValues.join(", ")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{attr.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* リレーションシップ */}
      {typeDetail.relationships && typeDetail.relationships.length > 0 && (
        <div>
          <h5 className="text-sm font-medium mb-2">関連</h5>
          <div className="space-y-2">
            {typeDetail.relationships.map((rel, index) => (
              <div
                key={index}
                className="rounded-md border p-3 text-sm space-y-2"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">
                    {relationshipTypeLabels[rel.type] || rel.type}
                  </Badge>
                  <span className="font-medium">{rel.target}</span>
                  {rel.description && (
                    <span className="text-muted-foreground">- {rel.description}</span>
                  )}
                </div>

                {/* カラムマッピング表示 */}
                {rel.columnMappings && rel.columnMappings.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {rel.columnMappings.map((mapping, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <code className="bg-muted px-1.5 py-0.5 rounded">{mapping.source}</code>
                        <span>→</span>
                        <code className="bg-muted px-1.5 py-0.5 rounded">
                          {rel.target}.{mapping.target}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
