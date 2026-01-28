"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChatContainer } from '@/components/ai-chat';
import type { ChatConfig, ChatLocation } from '@/components/ai-chat';
import { useProject } from '@/components/project/project-context';
import { ContextProvider } from '@/lib/mastra/context/provider';

/**
 * チャットページ
 *
 * AI要件アシスタントとのチャット画面。
 * URLパラメータで起動元の位置情報を受け取る。
 */
function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentProjectId } = useProject();

  // URLパラメータから位置情報を取得
  const screen = searchParams.get('screen') as ChatLocation['screen'] | null;
  const bdId = searchParams.get('bdId') || undefined;
  const btId = searchParams.get('btId') || undefined;
  const brId = searchParams.get('brId') || undefined;
  const sdId = searchParams.get('sdId') || undefined;
  const sfId = searchParams.get('sfId') || undefined;
  const srId = searchParams.get('srId') || undefined;

  // チャット設定を構築
  const config: ChatConfig = {
    resourceId: ContextProvider.generateResourceId(currentProjectId || 'default', 'user'),
  };

  // 位置情報がある場合は設定
  if (currentProjectId && screen) {
    config.location = {
      projectId: currentProjectId,
      screen,
      bdId,
      btId,
      brId,
      sdId,
      sfId,
      srId,
    };

    // 初期プロンプトを生成
    const initialPromptParts: string[] = [];
    if (bdId) initialPromptParts.push(`業務領域 ${bdId}`);
    if (btId) initialPromptParts.push(`業務タスク ${btId}`);
    if (brId) initialPromptParts.push(`業務要件 ${brId}`);
    if (sdId) initialPromptParts.push(`システム領域 ${sdId}`);
    if (sfId) initialPromptParts.push(`システム機能 ${sfId}`);
    if (srId) initialPromptParts.push(`システム要件 ${srId}`);

    if (initialPromptParts.length > 0) {
      config.initialPrompt = `${initialPromptParts.join(' > ')} から起動されました`;
    }
  }

  const handleClose = () => {
    router.back();
  };

  return <ChatContainer config={config} onClose={handleClose} />;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-white">
          <div className="text-[14px] text-slate-500">読み込み中...</div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
