"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FunctionDesignContent } from "@/lib/domain/schemas/system-design";
import { AmbiguousWordLint } from "../ambiguous-word-lint";

interface FunctionDesignFormProps {
  content: FunctionDesignContent;
  onChange: (content: FunctionDesignContent) => void;
}

export function FunctionDesignForm({
  content,
  onChange,
}: FunctionDesignFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="function-input">入力 *</Label>
        <Textarea
          id="function-input"
          placeholder="何を受け取るか（パラメータ、フォーム入力、ファイルなど）"
          value={content.input}
          onChange={(e) => onChange({ ...content, input: e.target.value })}
          rows={3}
        />
        <AmbiguousWordLint text={content.input} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-process">処理 *</Label>
        <Textarea
          id="function-process"
          placeholder="何を行うか（ビジネスロジック、計算、データ変換など）"
          value={content.process}
          onChange={(e) => onChange({ ...content, process: e.target.value })}
          rows={4}
        />
        <AmbiguousWordLint text={content.process} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-output">出力 *</Label>
        <Textarea
          id="function-output"
          placeholder="何を返すか（レスポンス、画面遷移、ファイル生成など）"
          value={content.output}
          onChange={(e) => onChange({ ...content, output: e.target.value })}
          rows={3}
        />
        <AmbiguousWordLint text={content.output} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="function-side-effects">副作用（任意）</Label>
        <Textarea
          id="function-side-effects"
          placeholder="処理による影響（DB更新、メール送信、外部API呼び出しなど）"
          value={content.sideEffects || ""}
          onChange={(e) =>
            onChange({ ...content, sideEffects: e.target.value || undefined })
          }
          rows={2}
        />
        <AmbiguousWordLint text={content.sideEffects || ""} />
      </div>
    </div>
  );
}
