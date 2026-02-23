import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { EXCEPTION_TYPES, RECOVERY_TYPES } from "../constants";
import { updateAtIndex } from "@/lib/utils/array-updates";
import type { StructuredSpecEditorProps } from "./types";

interface ExceptionsEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
}

export function ExceptionsEditor({ spec, updateStructuredSpec }: ExceptionsEditorProps): ReactNode {
  if (spec.ioType === "model") {
    return null;
  }

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

  return (
    <FoldableStructuredSection
      title="例外"
      description="エラー発生時の挙動を定義します"
      titleTooltip="想定されるエラー条件、エラーコード、HTTPステータス、ユーザー向けメッセージ、リカバリ方針を記述します。"
      defaultOpen={false}
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      errorCode: e.target.value,
                    }),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">タイプ</Label>
              <Select
                value={exception.type}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      type: value as (typeof EXCEPTION_TYPES)[number],
                    }),
                  }))
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      condition: e.target.value,
                    }),
                  }))
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      httpStatus: e.target.value === "" ? undefined : Number(e.target.value),
                    }),
                  }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">リカバリ方式</Label>
              <Select
                value={exception.recovery}
                onValueChange={(value) =>
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      recovery: value as (typeof RECOVERY_TYPES)[number],
                    }),
                  }))
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
                  updateStructuredSpec((current) => ({
                    ...current,
                    exceptions: updateAtIndex(current.exceptions, index, {
                      message: e.target.value,
                    }),
                  }))
                }
              />
            </div>
          </div>
        </div>
      ))}
    </FoldableStructuredSection>
  );
}
