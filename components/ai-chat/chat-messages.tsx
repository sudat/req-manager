import { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import type { ChatMessage } from './types';

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

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      <div className="space-y-4 max-w-3xl mx-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
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
            'inline-block px-4 py-2 rounded-lg text-[14px] leading-relaxed max-w-[80%]',
            isUser
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-900'
          )}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            <>
              <MarkdownRenderer
                content={message.content}
                className="prose prose-sm prose-slate max-w-none"
              />
              {message.isStreaming && (
                <span className="inline-block w-1 h-4 ml-1 bg-current animate-pulse" />
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
