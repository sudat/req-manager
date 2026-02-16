import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SideEffectResponse } from "@/lib/domain/schemas/side-effects";
import { normalizeOptionalText } from "./OptionalText";

const EMPTY_SELECT_VALUE = "__none__";

export type SideEffectExceptionOption = {
  code: string;
  label: string;
};

interface SideEffectResponseFieldsProps {
  response: SideEffectResponse | undefined;
  exceptionOptions: SideEffectExceptionOption[];
  onPatch: (patch: Partial<SideEffectResponse>) => void;
}

export function SideEffectResponseFields({
  response,
  exceptionOptions,
  onPatch,
}: SideEffectResponseFieldsProps): ReactNode {
  return (
    <div className="space-y-2 rounded-md border border-slate-100 bg-slate-50/70 p-2">
      <div className="text-[11px] font-medium text-slate-600">レスポンス定義（任意）</div>
      <div className="grid gap-2 md:grid-cols-2">
        <Input
          placeholder="successLabel（例: 保存完了）"
          value={response?.successLabel ?? ""}
          onChange={(e) => onPatch({ successLabel: normalizeOptionalText(e.target.value) })}
        />
        <Input
          placeholder="successSchemaRef（例: outputSchema.success）"
          value={response?.successSchemaRef ?? ""}
          onChange={(e) =>
            onPatch({ successSchemaRef: normalizeOptionalText(e.target.value) })
          }
        />
      </div>
      <div className="grid gap-2 md:grid-cols-3">
        <Input
          placeholder="errorLabel（例: 保存失敗）"
          value={response?.errorLabel ?? ""}
          onChange={(e) => onPatch({ errorLabel: normalizeOptionalText(e.target.value) })}
        />
        <Input
          placeholder="errorSchemaRef（例: outputSchema.error[0]）"
          value={response?.errorSchemaRef ?? ""}
          onChange={(e) =>
            onPatch({ errorSchemaRef: normalizeOptionalText(e.target.value) })
          }
        />
        <Select
          value={response?.errorExceptionRef ?? EMPTY_SELECT_VALUE}
          onValueChange={(value) =>
            onPatch({
              errorExceptionRef: value === EMPTY_SELECT_VALUE ? undefined : value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="失敗時例外（任意）" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_SELECT_VALUE}>失敗時例外なし</SelectItem>
            {exceptionOptions.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(response?.errorLabel || response?.errorSchemaRef) && !response?.errorExceptionRef && (
        <p className="text-xs text-amber-700">
          errorLabel / errorSchemaRef を指定した場合は失敗時例外の選択が必要です。
        </p>
      )}
    </div>
  );
}
