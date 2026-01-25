"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { SystemDesignItem } from "@/lib/domain/enums";
import type {
  SystemDesignItemV2,
  DesignTarget,
  DesignPerspective,
  DesignContent,
  FunctionDesignContent,
  DataDesignContent,
  ExceptionDesignContent,
  AuthDesignContent,
  NonFunctionalDesignContent,
} from "@/lib/domain/schemas/system-design";
import type { EntryPoint } from "@/lib/domain/value-objects";
import { DesignTargetSelector } from "./design-target-selector";
import { PerspectiveTabs } from "./perspective-tabs";
import { LegacyContentBanner } from "./legacy-content-banner";
import { FunctionDesignForm } from "./forms/function-design-form";
import { DataDesignForm } from "./forms/data-design-form";
import { ExceptionDesignForm } from "./forms/exception-design-form";
import { AuthDesignForm } from "./forms/auth-design-form";
import { NonFunctionalDesignForm } from "./forms/non-functional-design-form";

interface SystemDesignEditorProps {
  targets: DesignTarget[];
  items: SystemDesignItemV2[];
  legacyItems: SystemDesignItem[];
  entryPoints?: EntryPoint[];
  onTargetsChange: (targets: DesignTarget[]) => void;
  onItemsChange: (items: SystemDesignItemV2[]) => void;
}

const EMPTY_CONTENTS: Record<
  DesignPerspective,
  FunctionDesignContent | DataDesignContent | ExceptionDesignContent | AuthDesignContent | NonFunctionalDesignContent
> = {
  function: { input: "", process: "", output: "", sideEffects: undefined },
  data: { fields: "", tables: [], constraints: undefined, migration: undefined },
  exception: { errorCases: "", userNotification: undefined, logging: undefined, recovery: undefined },
  auth: { roles: "", operations: "", boundary: undefined },
  non_functional: { performance: undefined, availability: undefined, monitoring: undefined },
};

export function SystemDesignEditor({
  targets,
  items,
  legacyItems,
  entryPoints = [],
  onTargetsChange,
  onItemsChange,
}: SystemDesignEditorProps) {
  const [selectedTargetName, setSelectedTargetName] = useState<string | null>(
    targets.length > 0 ? targets[0].name : null
  );
  const [activePerspective, setActivePerspective] = useState<DesignPerspective>("function");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");

  // 選択された対象物と観点に対応するアイテムを取得
  const currentItem = items.find(
    (item) =>
      item.target.name === selectedTargetName &&
      item.category === activePerspective
  );

  // コンテンツの初期値を設定
  const [content, setContent] = useState<DesignContent>(
    currentItem?.content || EMPTY_CONTENTS[activePerspective]
  );

  // 対象物または観点が変更されたら、対応するアイテムを読み込む
  useEffect(() => {
    const item = items.find(
      (i) =>
        i.target.name === selectedTargetName &&
        i.category === activePerspective
    );
    if (item) {
      setTitle(item.title);
      setPriority(item.priority);
      setContent(item.content);
    } else {
      setTitle("");
      setPriority("medium");
      setContent(EMPTY_CONTENTS[activePerspective]);
    }
  }, [selectedTargetName, activePerspective, items]);

  const handleTargetAdd = (newTarget: DesignTarget) => {
    onTargetsChange([...targets, newTarget]);
    setSelectedTargetName(newTarget.name);
  };

  const handleSave = () => {
    if (!selectedTargetName) return;

    const selectedTarget = targets.find((t) => t.name === selectedTargetName);
    if (!selectedTarget) return;

    const newItem: SystemDesignItemV2 = {
      id: currentItem?.id || `design-${Date.now()}`,
      category: activePerspective,
      title,
      target: selectedTarget,
      content,
      priority,
    };

    if (currentItem) {
      // 既存アイテムを更新
      onItemsChange(
        items.map((item) => (item.id === currentItem.id ? newItem : item))
      );
    } else {
      // 新規アイテムを追加
      onItemsChange([...items, newItem]);
    }
  };

  const handleDelete = () => {
    if (currentItem) {
      onItemsChange(items.filter((item) => item.id !== currentItem.id));
      setTitle("");
      setPriority("medium");
      setContent(EMPTY_CONTENTS[activePerspective]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>システム設計</CardTitle>
        <CardDescription>
          対象物ごと、観点ごとに設計内容を構造化して記述します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {legacyItems.length > 0 && <LegacyContentBanner legacyItems={legacyItems} />}

        <DesignTargetSelector
          targets={targets}
          selectedTargetName={selectedTargetName}
          entryPoints={entryPoints}
          onTargetSelect={setSelectedTargetName}
          onTargetAdd={handleTargetAdd}
        />

        {selectedTargetName && (
          <>
            <div className="flex gap-4 items-end pt-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="design-title">タイトル</Label>
                <Input
                  id="design-title"
                  placeholder="設計項目のタイトル"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="w-32 space-y-2">
                <Label htmlFor="design-priority">優先度</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setPriority(value as "high" | "medium" | "low")
                  }
                >
                  <SelectTrigger id="design-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2">
              <PerspectiveTabs
              activePerspective={activePerspective}
              onPerspectiveChange={setActivePerspective}
              functionForm={
                <FunctionDesignForm
                  content={content as FunctionDesignContent}
                  onChange={setContent}
                />
              }
              dataForm={
                <DataDesignForm
                  content={content as DataDesignContent}
                  onChange={setContent}
                />
              }
              exceptionForm={
                <ExceptionDesignForm
                  content={content as ExceptionDesignContent}
                  onChange={setContent}
                />
              }
              authForm={
                <AuthDesignForm
                  content={content as AuthDesignContent}
                  onChange={setContent}
                />
              }
              nonFunctionalForm={
                <NonFunctionalDesignForm
                  content={content as NonFunctionalDesignContent}
                  onChange={setContent}
                />
              }
            />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {currentItem && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  削除
                </Button>
              )}
              <Button onClick={handleSave}>
                {currentItem ? "更新" : "追加"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
