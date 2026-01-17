import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// GitHub URL バリデーション
// ============================================

/**
 * GitHub URLバリデーション
 * 対応フォーマット: https://github.com/owner/repo, github.com/owner/repo
 */
export function validateGitHubUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || url.trim() === "") {
    return { isValid: true }; // 空文字は許容
  }
  const trimmedUrl = url.trim();
  const githubUrlPattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
  if (!githubUrlPattern.test(trimmedUrl)) {
    return {
      isValid: false,
      error: "有効なGitHubリポジトリURLを入力してください（例: https://github.com/owner/repo）"
    };
  }
  return { isValid: true };
}

/**
 * GitHub URLを正規化（https://github.com/owner/repo 形式に統一）
 */
export function normalizeGitHubUrl(url: string): string {
  if (!url || url.trim() === "") return "";
  const trimmedUrl = url.trim();
  if (trimmedUrl.startsWith("https://")) {
    return trimmedUrl.replace(/\/$/, "");
  }
  if (trimmedUrl.startsWith("http://")) {
    return trimmedUrl.replace(/^http:\/\//, "https://").replace(/\/$/, "");
  }
  return `https://${trimmedUrl.replace(/\/$/, "")}`;
}

// ============================================
// Markdown プレーンテキスト化
// ============================================

/**
 * Markdown記号を削除してプレーンテキストに変換
 * 一覧表示等、Markdown描画が不要な箇所で使用
 *
 * - ヘッダー行（## テキスト）は完全に削除
 * - 箇条書き記号、強調記号、リンク記号等を削除
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";

  return text
    // ヘッダー行（## テキスト）を完全に削除
    .replace(/^#{1,6}\s+.+$/gm, "")
    // コードブロックを削除
    .replace(/```[\s\S]*?```/g, "")
    // インラインコード
    .replace(/`([^`]+)`/g, "$1")
    // 太字/斜め
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    // 取り消し線
    .replace(/~~([^~]+)~~/g, "$1")
    // リンクをテキストに変換
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // 画像をaltに変換
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    // 箇条書き記号を削除
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // 番号付きリストを削除
    .replace(/^\s*\d+\.\s+/gm, "")
    // 引用記号を削除
    .replace(/^>\s+/gm, "")
    // 水平線を削除
    .replace(/^(\s*[-*_]){3,}\s*$/gm, "")
    // 余分な空白を正規化
    .replace(/\s+/g, " ")
    .trim();
}
