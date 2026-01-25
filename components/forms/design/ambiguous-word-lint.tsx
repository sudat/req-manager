"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { detectAmbiguousWords } from "@/lib/domain/schemas/system-design";

interface AmbiguousWordLintProps {
  text: string;
}

export function AmbiguousWordLint({ text }: AmbiguousWordLintProps) {
  if (!text) return null;
  const ambiguousWords = detectAmbiguousWords(text);

  if (ambiguousWords.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        曖昧な表現が含まれています: {ambiguousWords.join("、")}
        <br />
        具体的な数値や基準を記載してください。
      </AlertDescription>
    </Alert>
  );
}
