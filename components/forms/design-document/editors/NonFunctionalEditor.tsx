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
import { Textarea } from "@/components/ui/textarea";
import { FoldableStructuredSection } from "../FoldableStructuredSection";
import type { StructuredSpecEditorProps } from "./types";

interface NonFunctionalEditorProps {
  spec: StructuredSpecEditorProps["spec"];
  updateStructuredSpec: StructuredSpecEditorProps["updateStructuredSpec"];
}

export function NonFunctionalEditor({
  spec,
  updateStructuredSpec,
}: NonFunctionalEditorProps): ReactNode {
  if (spec.ioType === "model") {
    return null;
  }

  return (
    <FoldableStructuredSection
      title="非機能要件"
      description="性能、セキュリティ、可用性などの非機能要件を定義します"
      titleTooltip="機能以外の品質要件を記述します。応答時間、稼働率、認証/認可など、運用上の基準を明示してください。"
      defaultOpen={false}
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
  );
}
