import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import { FieldEditor } from "@/components/forms/FieldEditor";
import type { ScreenInput } from "@/lib/domain/schemas/io-schemas";
import { HTTP_METHODS } from "../constants";
import { ApiInputFieldsSection } from "./ApiInputFieldsSection";
import { ScreenInputSection } from "./ScreenInputSection";
import { ModelEntityEditor } from "./ModelEntityEditor";
import type { StructuredSpecEditorProps } from "./types";

interface InputSchemaEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  onChange: StructuredSpecEditorProps["onChange"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
  onOpenFkDialog: (attrIndex: number) => void;
}

export function InputSchemaEditor({
  spec,
  onChange,
  updateStructuredSpec,
  onOpenFkDialog,
}: InputSchemaEditorProps): ReactNode {
  const defaultScreenInput: ScreenInput = {
    trigger: "click",
    action: "",
    targetElement: "",
    precondition: "",
    fields: [],
  };

  return (
    <FoldableStructuredSection
      title={spec.ioType === "model" ? "エンティティ定義" : "入力スキーマ"}
      description={
        spec.ioType === "model"
          ? "論理エンティティの構造を定義します"
          : "処理の入口となる振る舞い・経路・条件を定義します"
      }
      titleTooltip={
        spec.ioType === "model"
          ? "エンティティ名、属性（カラム）、関連（リレーション）、状態遷移を定義してください。"
          : "操作の入口条件を記述します。画面なら操作対象・トリガー・前提条件、APIならメソッドとパスなど「どう始まるか」を書きます。"
      }
    >
      {spec.ioType === "api" && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">HTTPメソッド</Label>
            <Select
              value={
                (spec.inputSchema && "method" in spec.inputSchema
                  ? spec.inputSchema.method
                  : "POST") as string
              }
              onValueChange={(method) =>
                updateStructuredSpec((current) => {
                  if (!current.inputSchema || !("method" in current.inputSchema)) return current;
                  return {
                    ...current,
                    inputSchema: {
                      ...current.inputSchema,
                      method: method as (typeof HTTP_METHODS)[number],
                    },
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
              value={spec.inputSchema && "path" in spec.inputSchema ? spec.inputSchema.path : ""}
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

      <ModelEntityEditor
        spec={spec}
        updateStructuredSpec={updateStructuredSpec}
        onOpenFkDialog={onOpenFkDialog}
      />

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

      {spec.ioType !== "model" && (
        <div className="mt-4">
          {spec.ioType === "api" && spec.inputSchema && "method" in spec.inputSchema ? (
            <ApiInputFieldsSection
              inputSchema={spec.inputSchema}
              onChange={(inputSchema) => onChange({ ...spec, inputSchema })}
            />
          ) : (
            <FieldEditor
              fields={spec.inputSchema?.fields || []}
              fieldContext={
                spec.ioType === "screen"
                  ? "screen-input"
                  : spec.ioType === "batch"
                    ? "batch-input"
                    : spec.ioType === "job"
                      ? "job-input"
                      : undefined
              }
              onChange={(fields) =>
                onChange({
                  ...spec,
                  inputSchema: spec.inputSchema
                    ? { ...spec.inputSchema, fields }
                    : undefined,
                })
              }
              compactPreview
            />
          )}
        </div>
      )}
    </FoldableStructuredSection>
  );
}
