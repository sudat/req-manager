"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Settings } from "lucide-react";
import type { Deliverable, DeliverableType } from "@/lib/domain/schemas/deliverable";
import type {
  DesignPerspective,
  FunctionDesignContent,
  DataDesignContent,
  ExceptionDesignContent,
  AuthDesignContent,
} from "@/lib/domain/schemas/system-design";
import type { NonFunctionalDesignContent } from "@/lib/domain/schemas/deliverable";
import { PerspectiveTabs } from "./perspective-tabs";
import { FunctionDesignForm } from "./forms/function-design-form";
import { DataDesignForm } from "./forms/data-design-form";
import { ExceptionDesignForm } from "./forms/exception-design-form";
import { AuthDesignForm } from "./forms/auth-design-form";
import { NonFunctionalDesignForm } from "./forms/non-functional-design-form";

interface DeliverableCardProps {
  deliverable: Deliverable;
  onUpdate: (deliverable: Deliverable) => void;
  onDelete: () => void;
}

const DELIVERABLE_TYPE_LABELS: Record<DeliverableType, string> = {
  screen: "画面",
  batch: "バッチ",
  api: "API",
  job: "ジョブ",
  template: "テンプレート",
  service: "サービス",
};

const EMPTY_CONTENTS = {
  function: { input: "", process: "", output: "", sideEffects: undefined },
  data: { fields: "", tables: [], constraints: undefined, migration: undefined },
  exception: { errorCases: "", userNotification: undefined, logging: undefined, recovery: undefined },
  auth: { roles: "", operations: "", boundary: undefined },
  non_functional: { performance: undefined, availability: undefined, monitoring: undefined, security: undefined, scalability: undefined },
};

export function DeliverableCard({ deliverable, onUpdate, onDelete }: DeliverableCardProps) {
  const [activePerspective, setActivePerspective] = useState<DesignPerspective>("function");
  const [showEntryPointEditor, setShowEntryPointEditor] = useState(false);

  const handleNameChange = (name: string) => {
    onUpdate({ ...deliverable, name });
  };

  const handleTypeChange = (type: DeliverableType) => {
    onUpdate({ ...deliverable, type });
  };

  const handleEntryPointChange = (entryPoint: string) => {
    onUpdate({ ...deliverable, entryPoint: entryPoint || null });
  };

  const handleDesignChange = (perspective: DesignPerspective, content: any) => {
    onUpdate({
      ...deliverable,
      design: {
        ...deliverable.design,
        [perspective]: content,
      },
    });
  };

  const currentContent = deliverable.design[activePerspective] || EMPTY_CONTENTS[activePerspective];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor={`deliverable-name-${deliverable.id}`}>成果物名</Label>
              <Input
                id={`deliverable-name-${deliverable.id}`}
                placeholder="例: 発行指示画面"
                value={deliverable.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>
            <div className="w-40">
              <Label htmlFor={`deliverable-type-${deliverable.id}`}>種別</Label>
              <Select value={deliverable.type} onValueChange={handleTypeChange}>
                <SelectTrigger id={`deliverable-type-${deliverable.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DELIVERABLE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowEntryPointEditor(!showEntryPointEditor)}
              title="エントリポイント設定"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="icon" onClick={onDelete} title="削除">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {showEntryPointEditor && (
          <div className="mt-4">
            <Label htmlFor={`deliverable-entry-${deliverable.id}`}>エントリポイント</Label>
            <Input
              id={`deliverable-entry-${deliverable.id}`}
              placeholder="例: /orders/create, batch/generate-pdf.sh, POST /api/orders"
              value={deliverable.entryPoint || ""}
              onChange={(e) => handleEntryPointChange(e.target.value)}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <PerspectiveTabs
          activePerspective={activePerspective}
          onPerspectiveChange={setActivePerspective}
          functionForm={
            <FunctionDesignForm
              content={currentContent as FunctionDesignContent}
              onChange={(content) => handleDesignChange("function", content)}
            />
          }
          dataForm={
            <DataDesignForm
              content={currentContent as DataDesignContent}
              onChange={(content) => handleDesignChange("data", content)}
            />
          }
          exceptionForm={
            <ExceptionDesignForm
              content={currentContent as ExceptionDesignContent}
              onChange={(content) => handleDesignChange("exception", content)}
            />
          }
          authForm={
            <AuthDesignForm
              content={currentContent as AuthDesignContent}
              onChange={(content) => handleDesignChange("auth", content)}
            />
          }
          nonFunctionalForm={
            <NonFunctionalDesignForm
              content={currentContent as NonFunctionalDesignContent}
              onChange={(content) => handleDesignChange("non_functional", content)}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
