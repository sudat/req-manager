import type { ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ModelAttribute } from "@/lib/domain/schemas/model-detail";
import {
  extractCheckConstraints,
  extractForeignKeyReference,
} from "@/lib/utils/foreign-key-helpers";
import type { StructuredSpecEditorProps } from "./types";

interface ModelEntityEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
  onOpenFkDialog: (attrIndex: number) => void;
}

export function ModelEntityEditor({
  spec,
  updateStructuredSpec,
  onOpenFkDialog,
}: ModelEntityEditorProps): ReactNode {
  if (spec.ioType !== "model") {
    return null;
  }

  return (
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <div className="space-y-2">
              <Label className="text-xs">エンティティ名（物理名）</Label>
              <Input
                value={spec.typeDetail?.ioType === "model" ? spec.typeDetail.entityName ?? "" : ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    typeDetail: {
                      ioType: "model",
                      ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                      entityName: e.target.value,
                    },
                  }))
                }
                placeholder="例: User, Order, Product"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">論理名</Label>
              <Input
                value={spec.typeDetail?.ioType === "model" ? spec.typeDetail.entityLogicalName ?? "" : ""}
                onChange={(e) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    typeDetail: {
                      ioType: "model",
                      ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                      entityLogicalName: e.target.value,
                    },
                  }))
                }
                placeholder="例: ユーザー, 注文, 商品"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">エンティティ説明</Label>
            <Textarea
              value={spec.typeDetail?.ioType === "model" ? spec.typeDetail.entityDescription ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: {
                    ioType: "model",
                    ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                    entityDescription: e.target.value,
                  },
                }))
              }
              rows={2}
              placeholder="エンティティの説明"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">属性</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newAttr: ModelAttribute = {
                    name: "",
                    type: "",
                  };
                  updateStructuredSpec((current) => ({
                    ...current,
                    typeDetail: {
                      ioType: "model",
                      ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                      attributes: [
                        ...((current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined) || []),
                        newAttr,
                      ],
                    },
                  }));
                }}
              >
                <Plus className="mr-1 h-3 w-3" />
                属性追加
              </Button>
            </div>

            {spec.typeDetail?.ioType === "model" && spec.typeDetail.attributes && spec.typeDetail.attributes.length > 0 && (
              <div className="space-y-2">
                {spec.typeDetail.attributes.map((attr, attrIndex) => (
                  <div key={attrIndex} className="rounded-md border border-slate-200 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">属性 {attrIndex + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            typeDetail: {
                              ioType: "model",
                              ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                              attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.filter((_, i) => i !== attrIndex) || [],
                            },
                          }));
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>

                    <div className="grid gap-2 items-end" style={{ gridTemplateColumns: '14% 22% 12% 20% 32%' }}>
                      <div className="space-y-1">
                        <Label className="text-xs">名前（物理名）</Label>
                        <Input
                          value={attr.name}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, name: e.target.value } : a
                                ) || [],
                              },
                            }));
                          }}
                          placeholder="例: id"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">論理名</Label>
                        <Input
                          value={attr.logicalName || ""}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, logicalName: e.target.value } : a
                                ) || [],
                              },
                            }));
                          }}
                          placeholder="例: ID"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">型</Label>
                        <select
                          value={attr.type}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, type: e.target.value } : a
                                ) || [],
                              },
                            }));
                          }}
                          className="w-full h-9 px-3 text-sm border rounded-md bg-background"
                        >
                          <option value="">選択してください</option>
                          <option value="文字列">文字列</option>
                          <option value="整数">整数</option>
                          <option value="小数">小数</option>
                          <option value="真偽値">真偽値</option>
                          <option value="日付">日付</option>
                          <option value="タイムスタンプ">タイムスタンプ</option>
                          <option value="UUID">UUID</option>
                          <option value="JSON">JSON</option>
                          <option value="BLOB">BLOB</option>
                          <option value="その他">その他</option>
                        </select>
                      </div>

                      {/* FK参照の表示（読み取り専用、タグ形式） */}
                      {(() => {
                        const fkRef = extractForeignKeyReference(attr.constraints);
                        return fkRef ? (
                          <div className="space-y-1">
                            <Label className="text-xs">FK参照</Label>
                            <div className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                              <Badge variant="outline" className="text-xs">
                                → {fkRef.entity}.{fkRef.attribute}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // FK参照をクリア
                                  updateStructuredSpec((current) => ({
                                    ...current,
                                    typeDetail: {
                                      ioType: "model",
                                      ...(current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                      attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                        i === attrIndex ? { ...a, constraints: extractCheckConstraints(a.constraints) } : a
                                      ) || [],
                                    },
                                  }));
                                }}
                                className="ml-auto h-6 text-xs"
                              >
                                削除
                              </Button>
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* CHECK制約（FK参照を除外） */}
                      <div className="space-y-1">
                        <Label className="text-xs">CHECK制約</Label>
                        <Input
                          value={extractCheckConstraints(attr.constraints)}
                          onChange={(e) => {
                            const fkRef = extractForeignKeyReference(attr.constraints);
                            const newConstraints = e.target.value
                              ? (fkRef ? `FK: ${fkRef.entity}.${fkRef.attribute}\n${e.target.value}` : e.target.value)
                              : (fkRef ? `FK: ${fkRef.entity}.${fkRef.attribute}` : '');

                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...(current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, constraints: newConstraints } : a
                                ) || [],
                              },
                            }));
                          }}
                          placeholder="例: CHECK (age >= 0)"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">説明</Label>
                        <Input
                          value={attr.description || ""}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, description: e.target.value } : a
                                ) || [],
                              },
                            }));
                          }}
                          placeholder="例: ユーザー固有の識別子"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex gap-4 items-center">
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={attr.primaryKey || false}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, primaryKey: e.target.checked } : a
                                ) || [],
                              },
                            }));
                          }}
                          className="rounded"
                        />
                        PrimaryKey
                      </label>

                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={attr.nullable !== undefined ? !attr.nullable : false}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, nullable: !e.target.checked } : a
                                ) || [],
                              },
                            }));
                          }}
                          className="rounded"
                        />
                        NotNull
                      </label>

                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={attr.unique || false}
                          onChange={(e) => {
                            updateStructuredSpec((current) => ({
                              ...current,
                              typeDetail: {
                                ioType: "model",
                                ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                attributes: (current.typeDetail?.ioType === "model" ? current.typeDetail.attributes : undefined)?.map((a, i) =>
                                  i === attrIndex ? { ...a, unique: e.target.checked } : a
                                ) || [],
                              },
                            }));
                          }}
                          className="rounded"
                        />
                        Unique
                      </label>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const fkRef = extractForeignKeyReference(attr.constraints);
                          return fkRef ? (
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <span className="text-muted-foreground">→</span>
                              {fkRef.entity}.{fkRef.attribute}
                            </Badge>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
  );
}
