"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExceptionDesignContent } from "@/lib/domain/schemas/system-design";
import { AmbiguousWordLint } from "../ambiguous-word-lint";

interface ExceptionDesignFormProps {
  content: ExceptionDesignContent;
  onChange: (content: ExceptionDesignContent) => void;
}

export function ExceptionDesignForm({
  content,
  onChange,
}: ExceptionDesignFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="exception-error-cases">エラーケース *</Label>
        <Textarea
          id="exception-error-cases"
          placeholder="想定されるエラー（バリデーションエラー、タイムアウト、権限不足など）"
          value={content.errorCases}
          onChange={(e) =>
            onChange({ ...content, errorCases: e.target.value })
          }
          rows={4}
        />
        <AmbiguousWordLint text={content.errorCases} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exception-user-notification">
          ユーザー通知（任意）
        </Label>
        <Textarea
          id="exception-user-notification"
          placeholder="エラー時のメッセージ内容、トースト、ダイアログなど"
          value={content.userNotification || ""}
          onChange={(e) =>
            onChange({
              ...content,
              userNotification: e.target.value || undefined,
            })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.userNotification || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exception-logging">ロギング（任意）</Label>
        <Textarea
          id="exception-logging"
          placeholder="ログレベル、出力先、記録する情報など"
          value={content.logging || ""}
          onChange={(e) =>
            onChange({ ...content, logging: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.logging || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exception-recovery">リカバリー（任意）</Label>
        <Textarea
          id="exception-recovery"
          placeholder="エラー時のリトライ、ロールバック、代替処理など"
          value={content.recovery || ""}
          onChange={(e) =>
            onChange({ ...content, recovery: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.recovery || ""} />
      </div>
    </div>
  );
}
