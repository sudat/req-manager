"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { NonFunctionalDesignContent } from "@/lib/domain/schemas/system-design";
import { AmbiguousWordLint } from "../ambiguous-word-lint";

interface NonFunctionalDesignFormProps {
  content: NonFunctionalDesignContent;
  onChange: (content: NonFunctionalDesignContent) => void;
}

export function NonFunctionalDesignForm({
  content,
  onChange,
}: NonFunctionalDesignFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nf-performance">パフォーマンス（任意）</Label>
        <Textarea
          id="nf-performance"
          placeholder="レスポンスタイム、スループット、同時接続数などの具体的な数値目標"
          value={content.performance || ""}
          onChange={(e) =>
            onChange({ ...content, performance: e.target.value || undefined })
          }
          rows={3}
        />
        <AmbiguousWordLint text={content.performance || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nf-availability">可用性（任意）</Label>
        <Textarea
          id="nf-availability"
          placeholder="稼働率、ダウンタイム許容値、障害復旧時間など"
          value={content.availability || ""}
          onChange={(e) =>
            onChange({ ...content, availability: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.availability || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nf-monitoring">監視（任意）</Label>
        <Textarea
          id="nf-monitoring"
          placeholder="監視項目、アラート条件、ログ保持期間など"
          value={content.monitoring || ""}
          onChange={(e) =>
            onChange({ ...content, monitoring: e.target.value || undefined })
          }
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nf-security">セキュリティ（任意）</Label>
        <Textarea
          id="nf-security"
          placeholder="認証方式、暗号化要件、脆弱性対策など"
          value={content.security || ""}
          onChange={(e) =>
            onChange({ ...content, security: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.security || ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nf-scalability">スケーラビリティ（任意）</Label>
        <Textarea
          id="nf-scalability"
          placeholder="負荷増加時の対応、水平/垂直スケーリング戦略など"
          value={content.scalability || ""}
          onChange={(e) =>
            onChange({ ...content, scalability: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.scalability || ""} />
      </div>
    </div>
  );
}
