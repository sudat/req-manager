"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AuthDesignContent } from "@/lib/domain/schemas/system-design";
import { AmbiguousWordLint } from "../ambiguous-word-lint";

interface AuthDesignFormProps {
  content: AuthDesignContent;
  onChange: (content: AuthDesignContent) => void;
}

export function AuthDesignForm({ content, onChange }: AuthDesignFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="auth-roles">対象ロール *</Label>
        <Textarea
          id="auth-roles"
          placeholder="アクセス可能なユーザーロール（管理者、一般ユーザーなど）"
          value={content.roles}
          onChange={(e) => onChange({ ...content, roles: e.target.value })}
          rows={2}
        />
        <AmbiguousWordLint text={content.roles} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auth-operations">許可操作 *</Label>
        <Textarea
          id="auth-operations"
          placeholder="許可される操作（閲覧のみ、編集可能、削除可能など）"
          value={content.operations}
          onChange={(e) =>
            onChange({ ...content, operations: e.target.value })
          }
          rows={3}
        />
        <AmbiguousWordLint text={content.operations} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auth-boundary">認可境界（任意）</Label>
        <Textarea
          id="auth-boundary"
          placeholder="どの単位で権限チェックを行うか（行レベル、テーブルレベル、APIレベルなど）"
          value={content.boundary || ""}
          onChange={(e) =>
            onChange({ ...content, boundary: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.boundary || ""} />
      </div>
    </div>
  );
}
