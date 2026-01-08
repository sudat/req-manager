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
