"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  FoldableStructuredSection,
  SectionLabelWithTooltip,
} from "./FoldableStructuredSection";
import { EntryPointsInlineEditor } from "@/components/forms/entry-points/EntryPointsInlineEditor";
import { FieldEditor } from "@/components/forms/FieldEditor";
import type { DdType, EntryPoint } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import { DD_TYPE_LABELS } from "@/lib/domain/enums";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  type StructuredDesignDocumentSpec,
} from "@/lib/domain/schemas/design-document-structured";
import { syncStructuredSpecToDdType } from "@/lib/utils/design-documents/structured-compat";
import type {
  ApiInput,
  ApiOutput,
  ScreenInput,
  ScreenOutput,
} from "@/lib/domain/schemas/io-schemas";
import type { BusinessRule } from "@/lib/domain/schemas/core-logic";
import type {
  ModelAttribute,
  ModelRelationship,
} from "@/lib/domain/schemas/model-detail";
import {
  extractForeignKeyReference,
  extractCheckConstraints,
} from "@/lib/utils/foreign-key-helpers";

type DesignDocumentCardProps = {
  item: DesignDocumentDraft;
  onUpdate: (patch: Partial<DesignDocumentDraft>) => void;
  onDelete: () => void;
  modelDDs?: DesignDocumentDraft[];
};

const DD_TYPES: { value: DdType; label: string }[] = [
  { value: "screen", label: DD_TYPE_LABELS.screen },
  { value: "api", label: DD_TYPE_LABELS.api },
  { value: "batch", label: DD_TYPE_LABELS.batch },
  { value: "external_if", label: DD_TYPE_LABELS.external_if },
  { value: "model", label: DD_TYPE_LABELS.model },
  { value: "report", label: DD_TYPE_LABELS.report },
  { value: "job", label: DD_TYPE_LABELS.job },
];

const EXCEPTION_TYPES = [
  "validation",
  "state",
  "permission",
  "external",
  "timeout",
  "conflict",
] as const;

const RECOVERY_TYPES = [
  "none",
  "retry_immediate",
  "retry_with_backoff",
  "fallback",
  "manual_intervention",
  "circuit_breaker",
] as const;

const EVENT_DESTINATIONS = ["queue", "topic", "webhook"] as const;

const DB_OPERATIONS = ["insert", "update", "delete", "upsert"] as const;

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const SCREEN_TRIGGERS = ["click", "input", "load", "select"] as const;

const BUSINESS_RULE_TYPES = [
  "validation",
  "calculation",
  "state_transition",
  "decision",
  "aggregation",
] as const;

const BUSINESS_RULE_TYPE_LABELS: Record<string, string> = {
  validation: "検証",
  calculation: "計算",
  state_transition: "状態遷移",
  decision: "判定",
  aggregation: "集約",
};

const MODEL_RELATIONSHIP_TYPES = ["1:1", "1:N", "N:1", "N:M"] as const;

export function DesignDocumentCard({
  item,
  onUpdate,
  onDelete,
  modelDDs = [],
}: DesignDocumentCardProps): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [fkDialogOpen, setFkDialogOpen] = useState(false);
  const [fkCurrentAttrIndex, setFkCurrentAttrIndex] = useState<number | null>(null);
  const [fkSelectedModelId, setFkSelectedModelId] = useState<string | null>(null);

  // 関連ダイアログ用の状態
  const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false);
  const [editingRelationshipIndex, setEditingRelationshipIndex] = useState<number | null>(null);
  const [selectedTarget, setSelectedTarget] = useState("");
  const [relationType, setRelationType] = useState<ModelRelationship["type"]>("N:1");
  const [columnMappings, setColumnMappings] = useState<{ source: string; target: string }[]>([
    { source: "", target: "" }
  ]);
  const [relationshipDescription, setRelationshipDescription] = useState("");

  const updateStructuredSpec = (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => {
    if (!item.structuredSpec) return;
    onUpdate({
      structuredSpec: updater(item.structuredSpec),
      structuredSpecParseError: undefined,
    });
  };

  const handleEnableStructuredSpec = () => {
    onUpdate({
      structuredSpec: createEmptyStructuredDesignDocumentSpec(ddTypeToStructuredIoType(item.type)),
      structuredSpecParseError: undefined,
    });
  };

  const handleDisableStructuredSpec = () => {
    onUpdate({ structuredSpec: undefined, structuredSpecParseError: undefined });
  };

  const handleTypeChange = (nextType: DdType) => {
    if (!item.structuredSpec) {
      onUpdate({
        type: nextType,
        structuredSpec: createEmptyStructuredDesignDocumentSpec(ddTypeToStructuredIoType(nextType)),
        structuredSpecParseError: undefined,
      });
      return;
    }
    onUpdate({
      type: nextType,
      structuredSpec: syncStructuredSpecToDdType(item.structuredSpec, nextType),
      structuredSpecParseError: undefined,
    });
  };

  const handleOpenFkDialog = (attrIndex: number) => {
    setFkCurrentAttrIndex(attrIndex);
    setFkSelectedModelId(null);
    setFkDialogOpen(true);
  };

  const handleFkDialogOpenChange = (open: boolean) => {
    setFkDialogOpen(open);
    if (!open) {
      setFkSelectedModelId(null);
      setFkCurrentAttrIndex(null);
    }
  };

  const handleApplyForeignKey = (targetEntityName: string, targetAttributeName: string) => {
    if (fkCurrentAttrIndex === null) return;

    updateStructuredSpec((current) => {
      if (current.typeDetail?.ioType !== "model") {
        return current;
      }

      return {
        ...current,
        typeDetail: {
          ...current.typeDetail,
          attributes: (current.typeDetail.attributes ?? []).map((attribute, index) =>
            index === fkCurrentAttrIndex
              ? { ...attribute, constraints: `FK: ${targetEntityName}.${targetAttributeName}` }
              : attribute
          ),
        },
      };
    });

    setFkDialogOpen(false);
    setFkSelectedModelId(null);
    setFkCurrentAttrIndex(null);
  };

  // 関連ダイアログの処理
  const handleSaveRelationship = () => {
    if (!selectedTarget.trim()) {
      alert("関連先テーブルを指定してください");
      return;
    }

    const newRelationship: ModelRelationship = {
      target: selectedTarget,
      type: relationType,
      description: relationshipDescription.trim() || undefined,
      ...(relationType !== "N:M" && columnMappings.some(m => m.source && m.target) && {
        columnMappings: columnMappings.filter(m => m.source && m.target),
      }),
    };

    updateStructuredSpec((current) => {
      const relationships = current.typeDetail?.ioType === "model"
        ? current.typeDetail.relationships || []
        : [];

      return {
        ...current,
        typeDetail: {
          ioType: "model",
          ...(current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
          relationships:
            editingRelationshipIndex !== null
              ? relationships.map((r, i) => (i === editingRelationshipIndex ? newRelationship : r))
              : [...relationships, newRelationship],
        },
      };
    });

    setRelationshipDialogOpen(false);
  };

  const handleAddMapping = () => {
    setColumnMappings([...columnMappings, { source: "", target: "" }]);
  };

  const handleRemoveMapping = (index: number) => {
    setColumnMappings(columnMappings.filter((_, i) => i !== index));
  };

  const handleUpdateMapping = (index: number, field: "source" | "target", value: string) => {
    setColumnMappings(columnMappings.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    ));
  };

  const modelTypeDDs = modelDDs.filter((dd) => dd.type === "model");

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="pl-4 border-l-4 border-indigo-500 bg-slate-50/50 rounded-md p-4">
          <CollapsibleTrigger className="w-full cursor-pointer">
            <div className="flex items-center gap-3 text-left">
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-slate-500 transition-transform shrink-0",
                  isOpen && "rotate-180"
                )}
              />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="font-mono text-sm text-slate-500 shrink-0">{item.id}</span>
                <span className="text-base font-medium text-slate-900 truncate">
                  {item.name || "（未設定）"}
                </span>
              </div>
              <Badge
                variant="outline"
                className="border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium"
              >
                {DD_TYPE_LABELS[item.type]}
              </Badge>
            </div>
          </CollapsibleTrigger>

          {isOpen && (
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="icon"
                title="削除"
                aria-label={`${item.name || "DD"} を削除`}
                className="h-8 w-8 rounded-md border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}

          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-500">
                  DD名<span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={item.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="例: 請求書PDF生成バッチ"
                  className="text-[14px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[12px] font-medium text-slate-500">
                  種別<span className="text-rose-500">*</span>
                </Label>
                <Select value={item.type} onValueChange={(value) => handleTypeChange(value as DdType)}>
                  <SelectTrigger className="w-full text-[14px]">
                    <SelectValue placeholder="種別を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {DD_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">
                概要<span className="text-rose-500">*</span>
              </Label>
              <Textarea
                value={item.summary}
                onChange={(e) => onUpdate({ summary: e.target.value })}
                placeholder="入出力と責務の概要を記述"
                className="min-h-[90px] text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[12px] font-medium text-slate-500">設計方針</Label>
              <Textarea
                value={item.designPolicy}
                onChange={(e) => onUpdate({ designPolicy: e.target.value })}
                placeholder="横断的な設計方針を記述"
                className="min-h-[90px] text-[14px]"
              />
            </div>

            <div className="rounded-md border border-slate-200 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">構造化設計（Control Plane）</div>
                  <div className="text-[12px] text-slate-500">
                    入出力・副作用・例外・非機能を構造化して定義します
                  </div>
                </div>
                {item.structuredSpec ? (
                  <Button type="button" variant="outline" size="sm" onClick={handleDisableStructuredSpec}>
                    構造化を解除
                  </Button>
                ) : (
                  <Button type="button" size="sm" onClick={handleEnableStructuredSpec}>
                    <Plus className="h-4 w-4 mr-1" />
                    構造化を開始
                  </Button>
                )}
              </div>

              {item.structuredSpecParseError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>既存構造化データを読み込めませんでした</AlertTitle>
                  <AlertDescription>{item.structuredSpecParseError}</AlertDescription>
                </Alert>
              )}

              {item.structuredSpec && (
                <>
                  <StructuredSpecEditor
                    spec={item.structuredSpec}
                    entryPoints={item.entryPoints}
                    onChange={(next) =>
                      onUpdate({ structuredSpec: next, structuredSpecParseError: undefined })
                    }
                    onEntryPointsChange={(entryPoints) => onUpdate({ entryPoints })}
                    updateStructuredSpec={updateStructuredSpec}
                    onOpenFkDialog={handleOpenFkDialog}
                  />

                  {/* モデル型の関連セクション（DesignDocumentCard内でstate管理） */}
                  {item.structuredSpec.ioType === "model" && (
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">関連</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingRelationshipIndex(null);
                            setSelectedTarget("");
                            setRelationType("N:1");
                            setColumnMappings([{ source: "", target: "" }]);
                            setRelationshipDescription("");
                            setRelationshipDialogOpen(true);
                          }}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          関連追加
                        </Button>
                      </div>

                      {item.structuredSpec.typeDetail?.ioType === "model" && item.structuredSpec.typeDetail.relationships && item.structuredSpec.typeDetail.relationships.length > 0 && (
                        <div className="space-y-2">
                          {item.structuredSpec.typeDetail.relationships.map((rel, relIndex) => (
                            <div key={relIndex} className="rounded-md border border-slate-200 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{rel.type}</Badge>
                                  <span className="font-medium text-sm">{rel.target}</span>
                                  {rel.description && (
                                    <span className="text-sm text-muted-foreground">- {rel.description}</span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditingRelationshipIndex(relIndex);
                                      setSelectedTarget(rel.target);
                                      setRelationType(rel.type);
                                      setColumnMappings(rel.columnMappings && rel.columnMappings.length > 0 ? rel.columnMappings : [{ source: "", target: "" }]);
                                      setRelationshipDescription(rel.description || "");
                                      setRelationshipDialogOpen(true);
                                    }}
                                  >
                                    編集
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      updateStructuredSpec((current) => ({
                                        ...current,
                                        typeDetail: {
                                          ioType: "model",
                                          ...( current.typeDetail?.ioType === "model" ? current.typeDetail : {}),
                                          relationships: (current.typeDetail?.ioType === "model" ? current.typeDetail.relationships : undefined)?.filter((_, i) => i !== relIndex) || [],
                                        },
                                      }));
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* カラムマッピング表示 */}
                              {rel.columnMappings && rel.columnMappings.length > 0 && (
                                <div className="text-xs text-muted-foreground space-y-1 pl-2">
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
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Dialog open={fkDialogOpen} onOpenChange={handleFkDialogOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>FK参照先のモデルと属性を選択</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4 h-[50vh]">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 text-sm font-medium border-b">モデル（エンティティ）</div>
              <div className="overflow-y-auto h-[calc(100%-40px)] p-2">
                {modelTypeDDs.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">モデルが登録されていません</p>
                ) : (
                  modelTypeDDs.map((dd) => {
                    const entityName =
                      dd.structuredSpec?.typeDetail?.ioType === "model"
                        ? dd.structuredSpec.typeDetail.entityName
                        : dd.name;
                    const isSelected = fkSelectedModelId === dd.id;

                    return (
                      <button
                        key={dd.id}
                        type="button"
                        onClick={() => setFkSelectedModelId(dd.id)}
                        className={`w-full text-left p-2 rounded text-sm mb-1 hover:bg-accent ${
                          isSelected ? "bg-accent border border-primary" : "border border-transparent"
                        }`}
                      >
                        <div className="font-medium">{entityName || "（名称未設定）"}</div>
                        <div className="text-xs text-muted-foreground">{dd.name}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted p-2 text-sm font-medium border-b">
                {fkSelectedModelId ? "属性（カラム）" : "モデルを選択してください"}
              </div>
              <div className="overflow-y-auto h-[calc(100%-40px)] p-2">
                {fkSelectedModelId ? (
                  (() => {
                    const selectedModel = modelTypeDDs.find((dd) => dd.id === fkSelectedModelId);
                    const attributes =
                      selectedModel?.structuredSpec?.typeDetail?.ioType === "model"
                        ? selectedModel.structuredSpec.typeDetail.attributes || []
                        : [];
                    const entityName =
                      selectedModel?.structuredSpec?.typeDetail?.ioType === "model"
                        ? selectedModel.structuredSpec.typeDetail.entityName
                        : selectedModel?.name || "";

                    // データが正しく取得できない場合の警告
                    if (!selectedModel) {
                      return <p className="text-sm text-destructive p-2">選択したモデルが見つかりません</p>;
                    }
                    if (!selectedModel.structuredSpec?.typeDetail) {
                      return (
                        <p className="text-sm text-destructive p-2">
                          モデルのデータが読み込めません。編集画面で保存し直してください。
                        </p>
                      );
                    }
                    if (attributes.length === 0) {
                      return <p className="text-sm text-muted-foreground p-2">属性が登録されていません</p>;
                    }

                    return attributes.map((attr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!entityName || !attr.name) {
                            return;
                          }
                          handleApplyForeignKey(entityName, attr.name);
                        }}
                        className="w-full text-left p-2 rounded text-sm mb-1 hover:bg-accent border border-transparent"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{attr.name}</span>
                          <div className="flex gap-1">
                            {attr.primaryKey && <Badge variant="default" className="text-xs">PK</Badge>}
                            {(attr.nullable === false || attr.nullable === undefined) &&
                              <Badge variant="secondary" className="text-xs">NN</Badge>}
                            {attr.unique && <Badge variant="outline" className="text-xs">UK</Badge>}
                          </div>
                        </div>
                        {attr.logicalName && (
                          <div className="text-xs text-muted-foreground">{attr.logicalName}</div>
                        )}
                      </button>
                    ));
                  })()
                ) : (
                  <p className="text-sm text-muted-foreground p-2">左側からモデルを選択してください</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 関連設定ダイアログ */}
      <Dialog open={relationshipDialogOpen} onOpenChange={setRelationshipDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingRelationshipIndex !== null ? "関連を編集" : "関連を追加"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* 関連先テーブル選択 */}
            <div className="space-y-1">
              <Label className="text-xs">関連先テーブル</Label>
              <Select value={selectedTarget} onValueChange={setSelectedTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {modelTypeDDs.map((dd) => {
                    const entityName =
                      dd.structuredSpec?.typeDetail?.ioType === "model"
                        ? dd.structuredSpec.typeDetail.entityName
                        : dd.name;
                    return (
                      <SelectItem key={dd.id} value={entityName || dd.name}>
                        {entityName || dd.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* 関連タイプ選択 */}
            <div className="space-y-1">
              <Label className="text-xs">関連タイプ</Label>
              <Select value={relationType} onValueChange={(value) => setRelationType(value as ModelRelationship["type"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* カラムマッピング（N:M 以外） */}
            {relationType !== "N:M" && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">カラムのマッピング</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddMapping}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    カラム追加
                  </Button>
                </div>
                <div className="space-y-2">
                  {columnMappings.map((mapping, index) => {
                    const currentAttributes = item.structuredSpec?.typeDetail?.ioType === "model"
                      ? item.structuredSpec.typeDetail.attributes || []
                      : [];
                    const targetModel = modelTypeDDs.find((dd) => {
                      const entityName =
                        dd.structuredSpec?.typeDetail?.ioType === "model"
                          ? dd.structuredSpec.typeDetail.entityName
                          : dd.name;
                      return entityName === selectedTarget || dd.name === selectedTarget;
                    });
                    const targetAttributes = targetModel?.structuredSpec?.typeDetail?.ioType === "model"
                      ? targetModel.structuredSpec.typeDetail.attributes || []
                      : [];

                    return (
                      <div key={index} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                        {/* このテーブルのカラム */}
                        <Select
                          value={mapping.source}
                          onValueChange={(val) => handleUpdateMapping(index, 'source', val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="カラムを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {currentAttributes.map((attr) => (
                              <SelectItem key={attr.name} value={attr.name}>
                                {attr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span className="text-muted-foreground">→</span>

                        {/* 関連先テーブルのカラム */}
                        <Select
                          value={mapping.target}
                          onValueChange={(val) => handleUpdateMapping(index, 'target', val)}
                          disabled={!selectedTarget}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="カラムを選択" />
                          </SelectTrigger>
                          <SelectContent>
                            {targetAttributes.map((attr) => (
                              <SelectItem key={attr.name} value={attr.name}>
                                {attr.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* 削除ボタン */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMapping(index)}
                          disabled={columnMappings.length === 1}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 説明 */}
            <div className="space-y-1">
              <Label className="text-xs">説明</Label>
              <Input
                value={relationshipDescription}
                onChange={(e) => setRelationshipDescription(e.target.value)}
                placeholder="関連の説明（オプション）"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setRelationshipDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSaveRelationship}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ApiInputFieldsSection({
  inputSchema,
  onChange,
}: {
  inputSchema: ApiInput;
  onChange: (inputSchema: ApiInput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <FieldEditor
        label="クエリパラメータ項目"
        labelTooltip="URLの末尾に付くパラメータです。1項目につき1つのパラメータ名・型・必須有無を記述します。"
        description="URLの?以降に付与（例: ?page=1&limit=20）"
        fields={inputSchema.query ?? []}
        onChange={(fields) => onChange({ ...inputSchema, query: fields })}
        compactPreview
      />
      <FieldEditor
        label="リクエストボディ項目"
        labelTooltip="APIに送る本体データです。1項目につき1つのJSONプロパティとして記述します。"
        description="POST/PUT/PATCHリクエストのペイロード"
        fields={inputSchema.body ?? []}
        onChange={(fields) => onChange({ ...inputSchema, body: fields })}
        compactPreview
      />
    </div>
  );
}

function ApiOutputSchemaSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ApiOutput;
  onChange: (outputSchema: ApiOutput) => void;
}): ReactNode {
  const addErrorPattern = () => {
    onChange({
      ...outputSchema,
      error: [
        ...(outputSchema.error ?? []),
        { status: 400, fields: [], description: "" },
      ],
    });
  };

  return (
    <div className="space-y-3">
      <div className="rounded-md border-2 border-green-200 bg-green-50/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-green-800 font-semibold">成功ステータスコード</Label>
          <Input
            type="number"
            className="w-24 h-8"
            value={outputSchema.success.status}
            onChange={(e) =>
              onChange({
                ...outputSchema,
                success: {
                  ...outputSchema.success,
                  status: e.target.value === "" ? 200 : Number(e.target.value),
                },
              })
            }
            placeholder="200"
          />
        </div>
        <p className="text-xs text-green-700">成功時に返すHTTPステータスコードを定義します</p>
      </div>

      <div className="rounded-md border-2 border-red-200 bg-red-50/30 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-red-800 font-semibold">エラーパターン</Label>
            <p className="text-xs text-red-700 mt-1">発生しうるエラーのステータスコードと条件を定義します</p>
          </div>
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addErrorPattern}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {(outputSchema.error ?? []).map((errorPattern, index) => (
          <div key={index} className="rounded-md border border-red-300 bg-white p-2 space-y-2">
            <div className="grid gap-2 md:grid-cols-[auto_1fr_auto] items-center">
              <Input
                type="number"
                className="w-24"
                placeholder="400"
                value={errorPattern.status}
                onChange={(e) => {
                  const next = [...(outputSchema.error ?? [])];
                  next[index] = { ...next[index], status: e.target.value === "" ? 400 : Number(e.target.value) };
                  onChange({ ...outputSchema, error: next });
                }}
              />
              <Input
                placeholder="説明（例: メールアドレスが既に登録されている場合）"
                value={errorPattern.description ?? ""}
                onChange={(e) => {
                  const next = [...(outputSchema.error ?? [])];
                  next[index] = { ...next[index], description: e.target.value };
                  onChange({ ...outputSchema, error: next });
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onChange({
                    ...outputSchema,
                    error: (outputSchema.error ?? []).filter((_, i) => i !== index),
                  });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApiOutputFieldsSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ApiOutput;
  onChange: (outputSchema: ApiOutput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <FieldEditor
        label="成功レスポンス項目"
        labelTooltip="成功時に返すデータ項目です。画面表示や後続処理で利用する値を記述します。"
        description="成功時のレスポンスボディ項目"
        fields={outputSchema.success.fields}
        onChange={(fields) =>
          onChange({
            ...outputSchema,
            success: { ...outputSchema.success, fields },
          })
        }
        compactPreview
      />

      {(outputSchema.error ?? []).map((errorPattern, index) => (
        <div key={index} className="rounded-md border border-red-200 bg-red-50/20 p-3">
          <div className="mb-2 text-xs text-red-700">
            エラー項目: HTTP {errorPattern.status}
            {errorPattern.description ? `（${errorPattern.description}）` : ""}
          </div>
          <FieldEditor
            label="エラーレスポンス項目"
            labelTooltip="失敗時に返すデータ項目です。errorCode・messageなど利用者/実装者が判断に使う値を記述します。"
            description="このエラーパターンで返すレスポンスボディ項目"
            fields={errorPattern.fields}
            onChange={(fields) => {
              const next = [...(outputSchema.error ?? [])];
              next[index] = { ...next[index], fields };
              onChange({ ...outputSchema, error: next });
            }}
            compactPreview
          />
        </div>
      ))}
    </div>
  );
}

function ScreenInputSection({
  inputSchema,
  onChange,
}: {
  inputSchema: ScreenInput;
  onChange: (inputSchema: ScreenInput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[20%_20%_60%]">
        <div className="space-y-1">
          <Label className="text-xs">操作対象</Label>
          <Input
            value={inputSchema.targetElement ?? ""}
            onChange={(e) => onChange({ ...inputSchema, targetElement: e.target.value })}
            placeholder="例: 一括発行ボタン"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">トリガー</Label>
          <Select
            value={inputSchema.trigger}
            onValueChange={(value) =>
              onChange({ ...inputSchema, trigger: value as ScreenInput["trigger"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SCREEN_TRIGGERS.map((trigger) => (
                <SelectItem key={trigger} value={trigger}>
                  {trigger}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">操作内容</Label>
          <Input
            value={inputSchema.action ?? ""}
            onChange={(e) => onChange({ ...inputSchema, action: e.target.value })}
            placeholder="例: 請求書を発行"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">前提条件</Label>
        <Textarea
          value={inputSchema.precondition ?? ""}
          onChange={(e) => onChange({ ...inputSchema, precondition: e.target.value })}
          placeholder="例: 請求対象が1件以上選択されている"
          rows={2}
        />
      </div>
    </div>
  );
}

function ScreenOutputSection({
  outputSchema,
  onChange,
}: {
  outputSchema: ScreenOutput;
  onChange: (outputSchema: ScreenOutput) => void;
}): ReactNode {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">遷移先</Label>
        <Input
          value={outputSchema.transition ?? ""}
          onChange={(e) => onChange({ ...outputSchema, transition: e.target.value })}
          placeholder="例: /invoices/complete"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">メッセージ</Label>
        <Textarea
          value={(outputSchema.messages ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              ...outputSchema,
              messages: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean),
            })
          }
          placeholder="1行に1メッセージ"
          rows={3}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">期待動作</Label>
        <Textarea
          value={outputSchema.behavior ?? ""}
          onChange={(e) => onChange({ ...outputSchema, behavior: e.target.value })}
          placeholder="例: 発行ジョブをキュー投入し、一覧を再読み込み"
          rows={2}
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">画面変化</Label>
        <Textarea
          value={outputSchema.displayChanges ?? ""}
          onChange={(e) => onChange({ ...outputSchema, displayChanges: e.target.value })}
          placeholder="例: 対象行のステータスを「発行待ち」に更新、トースト表示"
          rows={2}
        />
      </div>
    </div>
  );
}

function StructuredSpecEditor({
  spec,
  entryPoints,
  onChange,
  onEntryPointsChange,
  updateStructuredSpec,
  onOpenFkDialog,
}: {
  spec: StructuredDesignDocumentSpec;
  entryPoints: EntryPoint[];
  onChange: (next: StructuredDesignDocumentSpec) => void;
  onEntryPointsChange: (entryPoints: EntryPoint[]) => void;
  updateStructuredSpec: (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => void;
  onOpenFkDialog: (attrIndex: number) => void;
}): ReactNode {
  const addDbOperation = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        dbOperations: [
          ...(current.sideEffects.dbOperations ?? []),
          { table: "", operation: "insert", condition: "" },
        ],
      },
    }));
  };

  const addExternalApi = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        externalApiCalls: [
          ...(current.sideEffects.externalApiCalls ?? []),
          { endpoint: "", method: "POST" },
        ],
      },
    }));
  };

  const addEvent = () => {
    updateStructuredSpec((current) => ({
      ...current,
      sideEffects: {
        ...current.sideEffects,
        events: [
          ...(current.sideEffects.events ?? []),
          { eventType: "", destination: "topic", payload: [] },
        ],
      },
    }));
  };

  const addException = () => {
    updateStructuredSpec((current) => ({
      ...current,
      exceptions: [
        ...current.exceptions,
        {
          type: "validation",
          condition: "",
          errorCode: "",
          message: "",
          recovery: "none",
        },
      ],
    }));
  };

  const defaultScreenInput: ScreenInput = {
    trigger: "click",
    action: "",
    targetElement: "",
    precondition: "",
    elements: [],
  };

  const defaultScreenOutput: ScreenOutput = {
    transition: "",
    messages: [],
    behavior: "",
    displayChanges: "",
  };

  const defaultApiOutput: ApiOutput = {
    success: { status: 200, fields: [] },
    error: [],
  };

  return (
    <div className="space-y-4">
      {/* エントリポイント（モデル型以外のみ表示） */}
      {spec.ioType !== "model" && (
        <FoldableStructuredSection
          title="エントリポイント"
          description="処理の起点となるコード位置・コンポーネントを定義します"
          titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
        >
          <EntryPointsInlineEditor
            entryPoints={entryPoints}
            onChange={onEntryPointsChange}
          />
        </FoldableStructuredSection>
      )}

      <FoldableStructuredSection
        title={spec.ioType === "model" ? "エンティティ定義" : "入力スキーマ"}
        description={spec.ioType === "model" ? "論理エンティティの構造を定義します" : "処理の入口となる振る舞い・経路・条件を定義します"}
        titleTooltip={spec.ioType === "model" ? "エンティティ名、属性（カラム）、関連（リレーション）、状態遷移を定義してください。" : "操作の入口条件を記述します。画面なら操作対象・トリガー・前提条件、APIならメソッドとパスなど「どう始まるか」を書きます。"}
      >
      {spec.ioType === "api" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">HTTPメソッド</Label>
            <Select
              value={(spec.inputSchema && "method" in spec.inputSchema ? spec.inputSchema.method : "POST") as string}
              onValueChange={(method) =>
                updateStructuredSpec((current) => {
                  if (!current.inputSchema || !("method" in current.inputSchema)) return current;
                  return {
                    ...current,
                    inputSchema: { ...current.inputSchema, method: method as (typeof HTTP_METHODS)[number] },
                  };
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">パス</Label>
            <Input
              value={
                spec.inputSchema && "path" in spec.inputSchema ? spec.inputSchema.path : ""
              }
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  if (!current.inputSchema || !("path" in current.inputSchema)) return current;
                  return {
                    ...current,
                    inputSchema: { ...current.inputSchema, path: e.target.value },
                  };
                })
              }
            />
          </div>
        </div>
      )}

      {spec.ioType === "screen" && (
        <div className="space-y-1">
          <Label className="text-xs">画面URLパス（ルート）</Label>
            <Input
              value={spec.typeDetail?.ioType === "screen" ? spec.typeDetail.route ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "screen", route: e.target.value },
                }))
              }
            />
          </div>
      )}

      {spec.ioType === "batch" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">スケジュール</Label>
            <Input
              value={spec.typeDetail?.ioType === "batch" ? spec.typeDetail.schedule ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "batch", schedule: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">入力ソース</Label>
            <Input
              value={spec.typeDetail?.ioType === "batch" ? spec.typeDetail.source ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "batch", source: e.target.value },
                }))
              }
            />
          </div>
        </div>
      )}

      {spec.ioType === "job" && (
        <div className="space-y-1">
          <Label className="text-xs">イベント</Label>
          <Input
            value={spec.typeDetail?.ioType === "job" ? spec.typeDetail.event ?? "" : ""}
            onChange={(e) =>
              updateStructuredSpec((current) => ({
                ...current,
                typeDetail: { ioType: "job", event: e.target.value },
              }))
            }
          />
        </div>
      )}

      {spec.ioType === "external_if" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">プロトコル</Label>
            <Input
              value={spec.typeDetail?.ioType === "external_if" ? spec.typeDetail.protocol ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "external_if", protocol: e.target.value },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">エンドポイント</Label>
            <Input
              value={spec.typeDetail?.ioType === "external_if" ? spec.typeDetail.endpoint ?? "" : ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  typeDetail: { ioType: "external_if", endpoint: e.target.value },
                }))
              }
            />
          </div>
        </div>
      )}

      {spec.ioType === "model" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
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

                    <div className="grid gap-2 items-end" style={{ gridTemplateColumns: '15% 15% 15% 25% 30%' }}>
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
      )}

      {/* report型はtypeDetailから詳細項目を削除（entryPointsとoutputSchemaで代替） */}
      {spec.ioType === "screen" && (
        <ScreenInputSection
          inputSchema={
            spec.inputSchema && "trigger" in spec.inputSchema
              ? spec.inputSchema
              : defaultScreenInput
          }
          onChange={(inputSchema) => onChange({ ...spec, inputSchema })}
        />
      )}
      </FoldableStructuredSection>

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="コアロジック"
        description="入力から出力への処理ルールを定義します"
        titleTooltip="入力データを出力データに変換する際に適用されるビジネスルール（検証、計算、状態遷移、判定、集約等）を記述します。"
      >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs">全体概要</Label>
          <Textarea
            value={spec.coreLogic.summary || ""}
            onChange={(e) =>
              updateStructuredSpec((current) => ({
                ...current,
                coreLogic: { ...current.coreLogic, summary: e.target.value },
              }))
            }
            rows={2}
            placeholder="コアロジック全体の概要説明"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">ビジネスルール</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newRule: BusinessRule = {
                  name: "",
                  type: "validation",
                  description: "",
                };
                updateStructuredSpec((current) => ({
                  ...current,
                  coreLogic: {
                    ...current.coreLogic,
                    rules: [...(current.coreLogic.rules || []), newRule],
                  },
                }));
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              ルール追加
            </Button>
          </div>

          {spec.coreLogic.rules && spec.coreLogic.rules.length > 0 ? (
            <div className="space-y-3">
              {spec.coreLogic.rules.map((rule, ruleIndex) => (
                <div
                  key={ruleIndex}
                  className="rounded-md border border-slate-200 p-3 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">ルール {ruleIndex + 1}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules: current.coreLogic.rules?.filter((_, i) => i !== ruleIndex) || [],
                          },
                        }));
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ルール名</Label>
                      <Input
                        value={rule.name}
                        onChange={(e) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules:
                                current.coreLogic.rules?.map((r, i) =>
                                  i === ruleIndex ? { ...r, name: e.target.value } : r
                                ) || [],
                            },
                          }));
                        }}
                        placeholder="例: tax_calculation"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">種別</Label>
                      <Select
                        value={rule.type}
                        onValueChange={(value) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules:
                                current.coreLogic.rules?.map((r, i) =>
                                  i === ruleIndex
                                    ? { ...r, type: value as BusinessRule["type"] }
                                    : r
                                ) || [],
                            },
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_RULE_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {BUSINESS_RULE_TYPE_LABELS[type]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">説明</Label>
                    <Textarea
                      value={rule.description}
                      onChange={(e) => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules:
                              current.coreLogic.rules?.map((r, i) =>
                                i === ruleIndex ? { ...r, description: e.target.value } : r
                              ) || [],
                          },
                        }));
                      }}
                      rows={2}
                      placeholder="ルールの説明"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">計算式・判定式（オプション）</Label>
                    <Input
                      value={rule.formula || ""}
                      onChange={(e) => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules:
                              current.coreLogic.rules?.map((r, i) =>
                                i === ruleIndex ? { ...r, formula: e.target.value } : r
                              ) || [],
                          },
                        }));
                      }}
                      placeholder="例: 税額 = 税抜金額 × 税率"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">前提条件（1行1条件、オプション）</Label>
                    <Textarea
                      value={(rule.preconditions || []).join("\n")}
                      onChange={(e) => {
                        const preconditions = e.target.value
                          .split("\n")
                          .map((line) => line.trim())
                          .filter((line) => line.length > 0);
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules:
                              current.coreLogic.rules?.map((r, i) =>
                                i === ruleIndex
                                  ? { ...r, preconditions: preconditions.length > 0 ? preconditions : undefined }
                                  : r
                              ) || [],
                          },
                        }));
                      }}
                      rows={2}
                      placeholder="例: 税抜金額 > 0&#10;税率は0.08または0.10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">端数処理（オプション）</Label>
                      <Input
                        value={rule.rounding || ""}
                        onChange={(e) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules:
                                current.coreLogic.rules?.map((r, i) =>
                                  i === ruleIndex ? { ...r, rounding: e.target.value } : r
                                ) || [],
                            },
                          }));
                        }}
                        placeholder="例: 切り捨て"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">精度（オプション）</Label>
                      <Input
                        value={rule.precision || ""}
                        onChange={(e) => {
                          updateStructuredSpec((current) => ({
                            ...current,
                            coreLogic: {
                              ...current.coreLogic,
                              rules:
                                current.coreLogic.rules?.map((r, i) =>
                                  i === ruleIndex ? { ...r, precision: e.target.value } : r
                                ) || [],
                            },
                          }));
                        }}
                        placeholder="例: 1円単位"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">補足事項（オプション）</Label>
                    <Textarea
                      value={rule.notes || ""}
                      onChange={(e) => {
                        updateStructuredSpec((current) => ({
                          ...current,
                          coreLogic: {
                            ...current.coreLogic,
                            rules:
                              current.coreLogic.rules?.map((r, i) =>
                                i === ruleIndex ? { ...r, notes: e.target.value } : r
                              ) || [],
                          },
                        }));
                      }}
                      rows={2}
                      placeholder="補足情報・備考"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic py-2">
              ビジネスルールが定義されていません
            </div>
          )}
        </div>
      </div>
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="出力スキーマ"
        description="処理結果として返す振る舞い・ステータスを定義します"
        titleTooltip="処理後の振る舞いを記述します。画面なら遷移先・表示メッセージ、APIなら成功/エラーのステータスコードなどを定義してください。"
      >
      {spec.ioType === "api" ? (
        <ApiOutputSchemaSection
          outputSchema={
            spec.outputSchema && "success" in spec.outputSchema
              ? spec.outputSchema
              : defaultApiOutput
          }
          onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
        />
      ) : spec.ioType === "screen" ? (
        <ScreenOutputSection
          outputSchema={
            spec.outputSchema && "messages" in spec.outputSchema
              ? spec.outputSchema
              : defaultScreenOutput
          }
          onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          この種別は出力スキーマの専用入力UIが未実装です。必要なデータは「出力項目（データ）」に記述してください。
        </p>
      )}
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="入力項目（データ）"
        description="実際に受け取るデータ項目を定義します"
        titleTooltip="受け取る実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
      >
      {spec.ioType === "api" && spec.inputSchema && "method" in spec.inputSchema ? (
        <ApiInputFieldsSection
          inputSchema={spec.inputSchema}
          onChange={(inputSchema) => onChange({ ...spec, inputSchema })}
        />
      ) : (
        <FieldEditor
          fields={spec.inputFields}
          onChange={(fields) => onChange({ ...spec, inputFields: fields })}
          compactPreview
        />
      )}
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="出力項目（データ）"
        description="実際に返却・表示するデータ項目を定義します"
        titleTooltip="返却・表示する実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
      >
      {spec.ioType === "api" ? (
        <ApiOutputFieldsSection
          outputSchema={
            spec.outputSchema && "success" in spec.outputSchema
              ? spec.outputSchema
              : defaultApiOutput
          }
          onChange={(outputSchema) => onChange({ ...spec, outputSchema })}
        />
      ) : (
        <FieldEditor
          fields={spec.outputFields}
          onChange={(fields) => onChange({ ...spec, outputFields: fields })}
          compactPreview
        />
      )}
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="副作用"
        description="DB更新・外部連携・イベント発行を定義します"
        titleTooltip="この機能の実行により発生する外部への影響を記述します。DB更新、外部API呼び出し、イベント発行などを具体化してください。"
      >
      <div className="space-y-2">
        <Label className="text-xs">副作用（概要）</Label>
        <Textarea
          value={spec.sideEffects.description}
          onChange={(e) =>
            updateStructuredSpec((current) => ({
              ...current,
              sideEffects: { ...current.sideEffects, description: e.target.value },
            }))
          }
          rows={2}
          placeholder="DB更新、外部API呼び出し、イベント発行など"
        />
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div>
          <div className="flex items-center justify-between">
            <SectionLabelWithTooltip
              label="副作用: DB操作"
              tooltip="どのテーブルに、どんな操作（insert/update/delete/upsert）をするかを記述します。必要なら条件も記述してください。"
            />
            <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addDbOperation}>
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">データベースへの読み書き操作を定義します</p>
        </div>
        {(spec.sideEffects.dbOperations ?? []).map((op, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="table"
              value={op.table}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = { ...next[index], table: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            />
            <Select
              value={op.operation}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = {
                    ...next[index],
                    operation: value as (typeof DB_OPERATIONS)[number],
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DB_OPERATIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="condition"
              value={op.condition ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.dbOperations ?? [])];
                  next[index] = { ...next[index], condition: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, dbOperations: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    dbOperations: (current.sideEffects.dbOperations ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div>
          <div className="flex items-center justify-between">
            <SectionLabelWithTooltip
              label="副作用: 外部API"
              tooltip="外部システムに対して呼び出すAPIのエンドポイント、HTTPメソッド、再試行方針を記述します。"
            />
            <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addExternalApi}>
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">外部システムへのAPI呼び出しを定義します</p>
        </div>
        {(spec.sideEffects.externalApiCalls ?? []).map((apiCall, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="endpoint"
              value={apiCall.endpoint}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = { ...next[index], endpoint: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            />
            <Select
              value={apiCall.method}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = {
                    ...next[index],
                    method: value as "GET" | "POST" | "PUT" | "DELETE",
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["GET", "POST", "PUT", "DELETE"].map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="retry: maxRetries"
              value={apiCall.retryPolicy?.maxRetries?.toString() ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.externalApiCalls ?? [])];
                  next[index] = {
                    ...next[index],
                    retryPolicy: {
                      maxRetries: e.target.value === "" ? 0 : Number(e.target.value),
                      backoffMs: next[index].retryPolicy?.backoffMs ?? 1000,
                    },
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, externalApiCalls: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    externalApiCalls: (current.sideEffects.externalApiCalls ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-2 rounded-md border border-slate-200 p-3">
        <div>
          <div className="flex items-center justify-between">
            <SectionLabelWithTooltip
              label="副作用: イベント発行"
              tooltip="発行するイベント種別、宛先（queue/topic/webhook）、必要に応じて遅延時間を記述します。"
            />
            <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addEvent}>
              <Plus className="h-4 w-4" />
              追加
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">メッセージキューやトピックへのイベント発行を定義します</p>
        </div>
        {(spec.sideEffects.events ?? []).map((event, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_1fr_4fr_auto] items-center">
            <Input
              placeholder="eventType"
              value={event.eventType}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = { ...next[index], eventType: e.target.value };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            />
            <Select
              value={event.destination}
              onValueChange={(value) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = {
                    ...next[index],
                    destination: value as (typeof EVENT_DESTINATIONS)[number],
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_DESTINATIONS.map((destination) => (
                  <SelectItem key={destination} value={destination}>
                    {destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="delayMs"
              type="number"
              value={event.delayMs ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => {
                  const next = [...(current.sideEffects.events ?? [])];
                  next[index] = {
                    ...next[index],
                    delayMs: e.target.value === "" ? undefined : Number(e.target.value),
                  };
                  return {
                    ...current,
                    sideEffects: { ...current.sideEffects, events: next },
                  };
                })
              }
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                updateStructuredSpec((current) => ({
                  ...current,
                  sideEffects: {
                    ...current.sideEffects,
                    events: (current.sideEffects.events ?? []).filter((_, i) => i !== index),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="例外"
        description="エラー発生時の挙動を定義します"
        titleTooltip="想定されるエラー条件、エラーコード、HTTPステータス、ユーザー向けメッセージ、リカバリ方針を記述します。"
      >
        <div className="flex items-center justify-end">
          <Button variant="default" size="sm" className="h-7 gap-2 text-[12px]" onClick={addException}>
            <Plus className="h-4 w-4" />
            追加
          </Button>
        </div>
        {spec.exceptions.map((exception, index) => (
          <div key={index} className="rounded-md border p-3 space-y-3">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-[15%_15%_1fr]">
              <div className="space-y-1">
                <Label className="text-xs">名前（エラーコード）</Label>
                <Input
                  placeholder="例: INVOICE_NOT_FOUND"
                  value={exception.errorCode}
                  onChange={(e) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = { ...next[index], errorCode: e.target.value };
                      return { ...current, exceptions: next };
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">タイプ</Label>
                <Select
                  value={exception.type}
                  onValueChange={(value) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = { ...next[index], type: value as (typeof EXCEPTION_TYPES)[number] };
                      return { ...current, exceptions: next };
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXCEPTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">条件</Label>
                <Input
                  placeholder="例: 指定した請求書IDが存在しない"
                  value={exception.condition}
                  onChange={(e) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = { ...next[index], condition: e.target.value };
                      return { ...current, exceptions: next };
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-[15%_15%_1fr]">
              <div className="space-y-1">
                <Label className="text-xs">HTTPステータス</Label>
                <Input
                  placeholder="例: 404"
                  type="number"
                  value={exception.httpStatus ?? ""}
                  onChange={(e) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = {
                        ...next[index],
                        httpStatus: e.target.value === "" ? undefined : Number(e.target.value),
                      };
                      return { ...current, exceptions: next };
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">リカバリ方式</Label>
                <Select
                  value={exception.recovery}
                  onValueChange={(value) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = { ...next[index], recovery: value as (typeof RECOVERY_TYPES)[number] };
                      return { ...current, exceptions: next };
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECOVERY_TYPES.map((recovery) => (
                      <SelectItem key={recovery} value={recovery}>
                        {recovery}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">メッセージ</Label>
                <Input
                  placeholder="例: 指定された請求書は見つかりません"
                  value={exception.message}
                  onChange={(e) =>
                    updateStructuredSpec((current) => {
                      const next = [...current.exceptions];
                      next[index] = { ...next[index], message: e.target.value };
                      return { ...current, exceptions: next };
                    })
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </FoldableStructuredSection>
      )}

      {spec.ioType !== "model" && (
      <FoldableStructuredSection
        title="非機能要件"
        description="性能、セキュリティ、可用性などの非機能要件を定義します"
        titleTooltip="機能以外の品質要件を記述します。応答時間、稼働率、認証/認可など、運用上の基準を明示してください。"
      >
        <div className="grid gap-2 md:grid-cols-1">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">応答時間P95（例: 200ms）</Label>
            <Input
              placeholder="例: 200ms"
              value={spec.nonFunctional.responseTimeP95 ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    responseTimeP95: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">稼働率（例: 99.9%）</Label>
            <Input
              placeholder="例: 99.9%"
              value={spec.nonFunctional.uptime ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    uptime: e.target.value,
                  },
                }))
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">認証方式（任意）</Label>
            <Select
              value={spec.nonFunctional.authMethod}
              onValueChange={(value) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: {
                    ...current.nonFunctional,
                    authMethod: value as "oauth2" | "oidc" | "api_key" | "mfa",
                  },
                }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="oauth2">OAuth 2.0</SelectItem>
                <SelectItem value="oidc">OpenID Connect</SelectItem>
                <SelectItem value="api_key">APIキー</SelectItem>
                <SelectItem value="mfa">多要素認証</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">認可境界（任意）</Label>
            <Textarea
              placeholder="例: billing:invoice:issue権限が必要、管理者ロール限定"
              value={spec.nonFunctional.authorizationBoundary ?? ""}
              onChange={(e) =>
                updateStructuredSpec((current) => ({
                  ...current,
                  nonFunctional: { ...current.nonFunctional, authorizationBoundary: e.target.value },
                }))
              }
              rows={2}
            />
          </div>
        </div>
      </FoldableStructuredSection>
      )}

    </div>
  );
}
