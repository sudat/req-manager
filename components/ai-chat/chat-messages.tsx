import { useEffect, useRef, useState } from 'react';
import { Bot, User, Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { DraftPreviewCard } from './draft-preview-card';
import type { ChatMessage, ChatProgressStep } from './types';

type ChatMessagesProps = {
  messages: ChatMessage[];
  isLoading?: boolean;
};

/**
 * チャットメッセージ表示エリア
 *
 * ユーザーとアシスタントのメッセージを時系列で表示する。
 */
export function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // スクロール位置を監視して、下部にいるかを判定
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      setIsNearBottom(distanceFromBottom < 100);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // 新しいメッセージが追加されたら、下部にいる場合のみ自動スクロール
  useEffect(() => {
    // ストリーミング中は自動スクロールしない
    const isCurrentlyStreaming = messages.some((m) => m.isStreaming);
    if (isNearBottom && !isCurrentlyStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isNearBottom]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md">
          <Bot className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-[16px] font-medium text-slate-700 mb-2">
            AI要件アシスタント
          </h3>
          <p className="text-[13px] text-slate-500">
            業務タスク、業務要件、システム要件の登録や品質チェックをお手伝いします。
            <br />
            メッセージを入力するか、クイックアクションからお選びください。
          </p>
        </div>
      </div>
    );
  }

  // ストリーミング中のアシスタントメッセージがあるか判定
  const hasStreamingMessage = messages.some(
    (m) => m.role === 'assistant' && m.isStreaming
  );

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-6 py-4">
      <div className="max-w-4xl mx-auto">
        {messages.map((message, index) => {
          const prevMessage = index > 0 ? messages[index - 1] : null;
          const isRoleChanged = prevMessage && prevMessage.role !== message.role;
          return (
            <div
              key={message.id}
              className={cn(
                'transition-all duration-300 ease-out',
                isRoleChanged ? 'mt-8' : 'mt-4'
              )}
            >
              <MessageBubble message={message} />
            </div>
          );
        })}
        {isLoading && !hasStreamingMessage && (
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100">
                <div className="flex gap-1">
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

type MessageBubbleProps = {
  message: ChatMessage;
};

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const progressSteps = message.progressSteps ?? [];
  const hasProgress = progressSteps.length > 0;
  const hasContent = message.content.trim().length > 0;

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] text-slate-600">
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-3',
        isUser && 'flex-row-reverse justify-end'
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            isUser ? 'bg-slate-200' : 'bg-slate-900'
          )}
        >
          {isUser ? (
            <User className="h-4 w-4 text-slate-700" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>
      </div>

      <div className={cn('flex-1 min-w-0', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'inline-block text-[14px] leading-relaxed transition-all duration-300 ease-out',
            isUser
              ? 'px-4 py-2 rounded-lg bg-slate-900 text-white max-w-[80%]'
              : 'text-slate-900 max-w-full'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <>
              {hasContent ? (
                <MarkdownRenderer
                  content={message.content}
                  className="prose prose-sm prose-slate max-w-none"
                />
              ) : hasProgress ? (
                <div className="text-[13px] text-slate-500">
                  {message.isStreaming ? '回答を生成中です。' : ''}
                </div>
              ) : (
                <MarkdownRenderer
                  content={message.content}
                  className="prose prose-sm prose-slate max-w-none"
                />
              )}
              {message.isStreaming && (
                <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
              )}
              {message.btDraft && (
                <DraftPreviewCard draft={message.btDraft} />
              )}
              {hasProgress && (
                <ProgressSteps steps={progressSteps} isStreaming={message.isStreaming} />
              )}
            </>
          )}
        </div>
        <div className="mt-1 px-1">
          <span className="text-[11px] text-slate-400">
            {message.timestamp.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}

type ProgressStepsProps = {
  steps: ChatProgressStep[];
  isStreaming?: boolean;
};

function ProgressSteps({ steps, isStreaming }: ProgressStepsProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const runningCount = steps.filter((step) => step.status === 'running').length;
  const doneCount = steps.filter((step) => step.status === 'done' || step.status === 'error').length;
  const currentCount = Math.min(doneCount + (runningCount > 0 ? 1 : 0), steps.length);
  const orderedSteps = [...steps].sort((a, b) => a.index - b.index);

  const statusLabel = (status: ChatProgressStep['status']) => {
    switch (status) {
      case 'running':
        return '進行中';
      case 'done':
        return '完了';
      case 'error':
        return 'エラー';
      default:
        return status;
    }
  };

  const statusClass = (status: ChatProgressStep['status']) => {
    switch (status) {
      case 'running':
        return 'text-amber-600';
      case 'done':
        return 'text-emerald-600';
      case 'error':
        return 'text-rose-600';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 text-[12px] text-slate-600 hover:text-slate-800 cursor-pointer"
        aria-expanded={isOpen}
      >
        {isStreaming ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>処理中... ({currentCount}/{steps.length})</span>
          </>
        ) : (
          <>
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            <span>途中経過 ({steps.length}件)</span>
          </>
        )}
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'
        )}
      >
        <div className="space-y-2 rounded-md border border-slate-200 bg-white p-2">
          {orderedSteps.map((step) => (
            <div
              key={`${step.id ?? 'step'}-${step.index}`}
              className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-medium text-slate-700">
                  Step {step.index}: {step.title}
                </span>
                <span className={cn('text-[10px] font-medium', statusClass(step.status))}>
                  {statusLabel(step.status)}
                </span>
              </div>
              {step.detail && (
                <div className="mt-1 text-[12px] text-slate-600 whitespace-pre-wrap break-words">
                  {step.status === 'done' && step.detail === '回答を生成中です。'
                    ? '回答完了'
                    : step.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
