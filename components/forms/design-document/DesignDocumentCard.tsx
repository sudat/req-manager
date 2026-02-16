"use client";

import { memo, useCallback, useMemo, useState, type ReactNode } from "react";
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
  DD_TYPE_COLORS,
  DD_TYPE_LABELS,
} from "@/lib/domain/enums";
import type { DdType } from "@/lib/domain";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import {
  DD_TYPES,
  MODEL_RELATIONSHIP_TYPES,
} from "./constants";
import { StructuredSpecEditor } from "./StructuredSpecEditor";
import {
  createEmptyStructuredDesignDocumentSpec,
  ddTypeToStructuredIoType,
  type StructuredDesignDocumentSpec,
} from "@/lib/domain/schemas/design-document-structured";
import { syncStructuredSpecToDdType } from "@/lib/utils/design-documents/structured-compat";
import type {
  ModelRelationship,
} from "@/lib/domain/schemas/model-detail";
import { SystemFunctionSelectionDialog } from "@/components/forms/SystemFunctionSelectionDialog";
import { DesignDocumentSelectionDialog } from "@/components/forms/DesignDocumentSelectionDialog";
import {
  DD_CALLER_TYPES,
  DD_CALLER_TYPE_LABELS,
  DD_DEPENDENCY_CALL_TYPES,
  DD_DEPENDENCY_CALL_TYPE_LABELS,
  type DdCallerDraft,
  type DdCallerType,
  type DdDependencyCallType,
} from "@/lib/domain/dd-dependency";

type DesignDocumentCardProps = {
  item: DesignDocumentDraft;
  onUpdate: (itemId: string, patch: Partial<DesignDocumentDraft>) => void;
  onDelete: (itemId: string) => void;
  modelDDs?: DesignDocumentDraft[];
  allDDs?: DesignDocumentDraft[];
  allSFs?: { id: string; title: string; domainName?: string }[];
};

function DesignDocumentCardComponent({
  item,
  onUpdate: onUpdateById,
  onDelete: onDeleteById,
  modelDDs = [],
  allDDs = [],
  allSFs = [],
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

  // SF選択ダイアログ用の状態
  const [sfDialogOpen, setSfDialogOpen] = useState(false);
  const [editingCallerIndex, setEditingCallerIndex] = useState<number | null>(null);

  // DD選択ダイアログ用の状態
  const [ddDialogOpen, setDdDialogOpen] = useState(false);

  const onUpdate = useCallback(
    (patch: Partial<DesignDocumentDraft>) => {
      onUpdateById(item.id, patch);
    },
    [item.id, onUpdateById]
  );

  const onDelete = useCallback(() => {
    onDeleteById(item.id);
  }, [item.id, onDeleteById]);

  const updateStructuredSpec = useCallback(
    (updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec) => {
      if (!item.structuredSpec) return;
      onUpdate({
        structuredSpec: updater(item.structuredSpec),
        structuredSpecParseError: undefined,
      });
    },
    [item.structuredSpec, onUpdate]
  );

  const handleEnableStructuredSpec = () => {
    onUpdate({
      structuredSpec: createEmptyStructuredDesignDocumentSpec(ddTypeToStructuredIoType(item.type)),
      structuredSpecParseError: undefined,
    });
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

  const handleOpenFkDialog = useCallback((attrIndex: number) => {
    setFkCurrentAttrIndex(attrIndex);
    setFkSelectedModelId(null);
    setFkDialogOpen(true);
  }, []);

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

    const validColumnMappings = columnMappings.filter((mapping) => mapping.source && mapping.target);
    if (relationType !== "N:M" && validColumnMappings.length === 0) {
      alert("N:M 以外の関連ではカラムマッピングを1件以上設定してください");
      return;
    }

    const newRelationship: ModelRelationship = {
      target: selectedTarget,
      type: relationType,
      description: relationshipDescription.trim() || undefined,
      ...(relationType !== "N:M" && {
        columnMappings: validColumnMappings,
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

  const modelTypeDDs = useMemo(
    () => modelDDs.filter((dd) => dd.type === "model"),
    [modelDDs]
  );

  const selectableSystemFunctions = useMemo(
    () => (sfDialogOpen
      ? allSFs.map((sf) => ({ id: sf.id, title: sf.title, domainName: sf.domainName }))
      : []),
    [allSFs, sfDialogOpen]
  );

  const sfLabelMap = useMemo(() => {
    return new Map(allSFs.map((sf) => [sf.id, `${sf.id} ${sf.title}`]));
  }, [allSFs]);

  const ddLabelMap = useMemo(() => {
    return new Map(allDDs.map((dd) => [dd.id, `${dd.id} ${dd.name || "（未設定）"}`]));
  }, [allDDs]);

  // 呼び出し元SF/DDのラベル生成ヘルパー
  const getSfLabel = useCallback(
    (sfId: string): string => {
      return sfLabelMap.get(sfId) ?? sfId;
    },
    [sfLabelMap]
  );

  const getDdLabel = useCallback(
    (ddId: string): string => {
      return ddLabelMap.get(ddId) ?? ddId;
    },
    [ddLabelMap]
  );

  const selectableCallerDds = useMemo(() => {
    if (!ddDialogOpen) return [];

    const activeCaller =
      editingCallerIndex !== null ? item.callers?.[editingCallerIndex] : undefined;
    const activeCallerSfId = activeCaller?.callerSfId;

    return allDDs
      .filter((dd) => {
        if (dd.id === item.id) return false;
        if (!activeCallerSfId) return true;
        const match = dd.id.match(/^DD-(SF-[^-]+-\d+)-/);
        const ddSrfId = match ? match[1] : null;
        return ddSrfId === activeCallerSfId;
      })
      .map((dd) => ({
        id: dd.id,
        name: dd.name || "（未設定）",
        type: dd.type,
        summary: dd.summary || "",
      }));
  }, [allDDs, ddDialogOpen, editingCallerIndex, item.callers, item.id]);

  const typeColor = "border-emerald-200 bg-emerald-50 text-emerald-700";

  const handleStructuredSpecChange = useCallback(
    (next: StructuredDesignDocumentSpec) => {
      onUpdate({ structuredSpec: next, structuredSpecParseError: undefined });
    },
    [onUpdate]
  );

  const handleEntryPointsChange = useCallback(
    (entryPoints: DesignDocumentDraft["entryPoints"]) => {
      onUpdate({ entryPoints });
    },
    [onUpdate]
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="py-2 pl-8 pr-2 border-l-4 border-slate-200 bg-slate-50/50 rounded-md">
          <div className="flex items-center gap-3">
            <CollapsibleTrigger className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3 text-left">
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-slate-500 transition-transform shrink-0",
                    isOpen && "rotate-180"
                  )}
                />
                <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                  {/* IDバッジ - グレー系 */}
                  <Badge className="border-slate-200/60 bg-slate-50 text-slate-600 text-[12px] font-medium px-2.5 py-1 font-mono shrink-0">
                    {item.id}
                  </Badge>
                  {/* 種別バッジ */}
                  <Badge
                    variant="outline"
                    className={`${typeColor} text-[12px] font-medium px-2.5 py-1 shrink-0`}
                  >
                    {DD_TYPE_LABELS[item.type]}
                  </Badge>
                  {/* DD名 */}
                  <span className="text-[14px] font-semibold text-slate-900 truncate">
                    {item.name || "名称未設定"}
                  </span>
                </div>
              </div>
            </CollapsibleTrigger>
            <Button
              variant="ghost"
              size="icon"
              title="削除"
              aria-label={`${item.name || "DD"} を削除`}
              className="h-8 w-8 rounded-md hover:bg-rose-100 hover:text-rose-600 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

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
              <div className="flex items-center justify-between">
                <Label className="text-[12px] font-medium text-slate-500">
                  概要<span className="text-rose-500">*</span>
                </Label>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
                >
                  Markdown
                </Badge>
              </div>
              <Textarea
                value={item.summary}
                onChange={(e) => onUpdate({ summary: e.target.value })}
                placeholder="入出力と責務の概要を記述"
                className="min-h-[90px] text-[14px]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] font-medium text-slate-500">設計方針</Label>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-5 border-blue-200 bg-blue-50 text-blue-700"
                >
                  Markdown
                </Badge>
              </div>
              <Textarea
                value={item.designPolicy}
                onChange={(e) => onUpdate({ designPolicy: e.target.value })}
                placeholder="横断的な設計方針を記述"
                className="min-h-[90px] text-[14px]"
              />
            </div>

            {/* 呼び出し元セクション（モデル以外） */}
            {item.type !== "model" && (
            <div className="rounded-md border border-slate-200 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[13px] font-semibold text-slate-800">呼び出し元</div>
                  <div className="text-[12px] text-slate-500">
                    このDDを起動する主体（ユーザー or システム）を定義します
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newCallers: DdCallerDraft[] = [
                      ...(item.callers || []),
                      { callerType: "user" },
                    ];
                    onUpdate({ callers: newCallers });
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  呼び出し元追加
                </Button>
              </div>

              {(!item.callers || item.callers.length === 0) ? (
                <p className="text-[12px] text-slate-400">呼び出し元は未設定です</p>
              ) : (
                <div className="space-y-3">
                  {item.callers.map((caller, index) => {
                    const isUserCaller = caller.callerType === "user";
                    return (
                      <div key={index} className="border rounded-md p-3 bg-slate-50/50">
                        {/* 1行5カラムレイアウト: 種別 | SF | DD | 呼び出し方法 | 行削除 */}
                        <div className="grid grid-cols-[minmax(100px,1.5fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(120px,1.5fr)_auto] gap-2 items-end">
                          {/* 1. 呼び出し元種別 */}
                          <div className="space-y-1">
                            <Label className="text-[11px] text-slate-600">種別</Label>
                            <Select
                              value={caller.callerType}
                              onValueChange={(value) => {
                                const newCallers = [...(item.callers || [])];
                                newCallers[index] = {
                                  ...newCallers[index],
                                  callerType: value as DdCallerType,
                                  callerSfId: undefined,
                                  callerDdId: undefined,
                                };
                                onUpdate({ callers: newCallers });
                              }}
                            >
                              <SelectTrigger className="w-full h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DD_CALLER_TYPES.map((type) => (
                                  <SelectItem key={type} value={type} className="text-sm">
                                    {DD_CALLER_TYPE_LABELS[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 2. 呼び出し元SF（systemの場合のみ有効） */}
                          <div className={`space-y-1 ${isUserCaller ? "opacity-50 pointer-events-none" : ""}`}>
                            <Label className="text-[11px] text-slate-600">呼び出し元SF</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCallerIndex(index);
                                  setSfDialogOpen(true);
                                }}
                                className="flex-1 justify-start text-left h-8 px-2 text-sm min-w-0"
                                disabled={isUserCaller}
                              >
                                <span className="truncate">
                                  {caller.callerSfId
                                    ? getSfLabel(caller.callerSfId)
                                    : isUserCaller
                                      ? "ユーザー起動"
                                      : "システム機能を選択"}
                                </span>
                              </Button>
                              {!isUserCaller && caller.callerSfId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 shrink-0"
                                  onClick={() => {
                                    const newCallers = [...(item.callers || [])];
                                    newCallers[index] = {
                                      ...newCallers[index],
                                      callerSfId: undefined,
                                      callerDdId: undefined,
                                    };
                                    onUpdate({ callers: newCallers });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* 3. 呼び出し元DD（systemの場合のみ有効） */}
                          <div className={`space-y-1 ${isUserCaller ? "opacity-50 pointer-events-none" : ""}`}>
                            <Label className="text-[11px] text-slate-600">呼び出し元DD</Label>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingCallerIndex(index);
                                  setDdDialogOpen(true);
                                }}
                                className="flex-1 justify-start text-left h-8 px-2 text-sm min-w-0"
                                disabled={isUserCaller || !caller.callerSfId}
                              >
                                <span className="truncate">
                                  {caller.callerDdId
                                    ? getDdLabel(caller.callerDdId)
                                    : isUserCaller
                                      ? "-"
                                      : "DDを選択"}
                                </span>
                              </Button>
                              {!isUserCaller && caller.callerDdId && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 shrink-0"
                                  onClick={() => {
                                    const newCallers = [...(item.callers || [])];
                                    newCallers[index] = {
                                      ...newCallers[index],
                                      callerDdId: undefined,
                                    };
                                    onUpdate({ callers: newCallers });
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* 4. 呼び出し方法（systemの場合のみ有効） */}
                          <div className={`space-y-1 ${isUserCaller ? "opacity-50 pointer-events-none" : ""}`}>
                            <Label className="text-[11px] text-slate-600">呼び出し方法</Label>
                            <Select
                              value={caller.callType || "calls_sync"}
                              onValueChange={(value) => {
                                const newCallers = [...(item.callers || [])];
                                newCallers[index] = { ...newCallers[index], callType: value as DdDependencyCallType };
                                onUpdate({ callers: newCallers });
                              }}
                              disabled={isUserCaller}
                            >
                              <SelectTrigger className="w-full h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DD_DEPENDENCY_CALL_TYPES.map((ct) => (
                                  <SelectItem key={ct} value={ct} className="text-sm">
                                    {DD_DEPENDENCY_CALL_TYPE_LABELS[ct]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 5. 行削除ボタン */}
                          <div className="flex items-end pb-[2px]">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const newCallers = (item.callers || []).filter((_, i) => i !== index);
                                onUpdate({ callers: newCallers });
                              }}
                              aria-label={`呼び出し元 ${index + 1} を削除`}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            )}

            {!item.structuredSpec && (
              <div className="flex justify-end">
                <Button type="button" size="sm" onClick={handleEnableStructuredSpec}>
                  <Plus className="h-4 w-4 mr-1" />
                  構造化を開始
                </Button>
              </div>
            )}

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
                  onChange={handleStructuredSpecChange}
                  onEntryPointsChange={handleEntryPointsChange}
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
          </CollapsibleContent>
        </div>
      </Collapsible>

      {fkDialogOpen && (
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
      )}

      {/* 関連設定ダイアログ */}
      {relationshipDialogOpen && (
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
      )}

      {/* SF選択ダイアログ */}
      {sfDialogOpen && (
        <SystemFunctionSelectionDialog
          isOpen={sfDialogOpen}
          onClose={() => setSfDialogOpen(false)}
          title="呼び出し元システム機能を選択"
          systemFunctions={selectableSystemFunctions}
          selectedId={editingCallerIndex !== null ? item.callers?.[editingCallerIndex]?.callerSfId || null : null}
          onSelect={(sfId) => {
            if (editingCallerIndex !== null) {
              const newCallers = [...(item.callers || [])];
              newCallers[editingCallerIndex] = {
                ...newCallers[editingCallerIndex],
                callerSfId: sfId,
                callerDdId: undefined,
              };
              onUpdate({ callers: newCallers });
            }
          }}
        />
      )}

      {/* DD選択ダイアログ */}
      {ddDialogOpen && (
        <DesignDocumentSelectionDialog
          isOpen={ddDialogOpen}
          onClose={() => setDdDialogOpen(false)}
          title="呼び出し元DDを選択"
          designDocuments={selectableCallerDds}
          selectedId={editingCallerIndex !== null ? item.callers?.[editingCallerIndex]?.callerDdId || null : null}
          onSelect={(ddId) => {
            if (editingCallerIndex !== null) {
              const newCallers = [...(item.callers || [])];
              newCallers[editingCallerIndex] = {
                ...newCallers[editingCallerIndex],
                callerDdId: ddId,
              };
              onUpdate({ callers: newCallers });
            }
          }}
          emptyMessage="選択可能なDDがありません。"
        />
      )}
    </>
  );
}

function areDesignDocumentCardPropsEqual(
  prevProps: DesignDocumentCardProps,
  nextProps: DesignDocumentCardProps
): boolean {
  return (
    prevProps.item === nextProps.item &&
    prevProps.onUpdate === nextProps.onUpdate &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.modelDDs === nextProps.modelDDs &&
    prevProps.allDDs === nextProps.allDDs &&
    prevProps.allSFs === nextProps.allSFs
  );
}

export const DesignDocumentCard = memo(
  DesignDocumentCardComponent,
  areDesignDocumentCardPropsEqual
);

DesignDocumentCard.displayName = "DesignDocumentCard";
