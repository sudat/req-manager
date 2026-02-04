import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/markdown/markdown-renderer';
import { DraftPreviewCard } from './draft-preview-card';
import { BrDraftPreviewCard } from './br-draft-preview-card';
import { SfDraftCard } from './sf-draft-card';
import { SrDraftCard } from './sr-draft-card';
import { ProgressSteps } from './progress-steps';
import type { ChatMessage, DraftCommitState, BtDraft, BrDraft } from './types';

type MessageBubbleProps = {
  message: ChatMessage;
  onCommitDraft?: (payload: {
    messageId: string;
    type: 'bt' | 'br';
    code: string;
    content: BtDraft | BrDraft;
  }) => void;
  getCommitState?: (messageId: string, type: 'bt' | 'br', code: string) => DraftCommitState | undefined;
};

export function MessageBubble({ message, onCommitDraft, getCommitState }: MessageBubbleProps) {
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
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn('min-w-0', isUser ? 'flex justify-end' : 'w-full max-w-full')}
      >
        <div className={cn(isUser ? 'max-w-[600px]' : 'max-w-full')}>
          <div
            className={cn(
              'text-[14px] leading-relaxed transition-all duration-300 ease-out',
              isUser
                ? 'px-4 py-2 rounded-lg bg-slate-900 text-white'
                : 'text-slate-900'
            )}
          >
            {isUser ? (
              <div className="whitespace-pre-wrap break-all">
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
                  <DraftPreviewCard
                    draft={message.btDraft}
                    commitState={getCommitState?.(message.id, 'bt', message.btDraft.code)}
                    onCommit={
                      onCommitDraft
                        ? () =>
                            onCommitDraft({
                              messageId: message.id,
                              type: 'bt',
                              code: message.btDraft!.code,
                              content: message.btDraft!,
                            })
                        : undefined
                    }
                  />
                )}
                {message.brDraft && (
                  <BrDraftPreviewCard
                    draft={message.brDraft}
                    commitState={getCommitState?.(message.id, 'br', message.brDraft.code)}
                    onCommit={
                      onCommitDraft
                        ? () =>
                            onCommitDraft({
                              messageId: message.id,
                              type: 'br',
                              code: message.brDraft!.code,
                              content: message.brDraft!,
                            })
                        : undefined
                    }
                  />
                )}
                {message.sfDraft && (
                  <SfDraftCard draft={message.sfDraft} />
                )}
                {message.srDraft && (
                  <SrDraftCard draft={message.srDraft} />
                )}
                {hasProgress && (
                  <ProgressSteps steps={progressSteps} isStreaming={message.isStreaming} />
                )}
              </>
            )}
          </div>
          <div className={cn('mt-1', isUser ? 'text-right' : 'text-left')}>
            <span className="text-[11px] text-slate-400">
              {message.timestamp.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
