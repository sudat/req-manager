import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ReasoningEffort } from '@/lib/mastra/reasoning-effort';
import { reasoningEffortOptions } from '@/lib/mastra/reasoning-effort';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  reasoningEffort: ReasoningEffort;
  onReasoningEffortChange: (effort: ReasoningEffort) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * メッセージ入力フォーム
 *
 * ChatGPT風の統合入力エリアと送信ボタンを含む。
 */
export function ChatInput({
  onSendMessage,
  reasoningEffort,
  onReasoningEffortChange,
  disabled,
  placeholder = 'メッセージを入力...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift + Enter で改行、Enter で送信
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-6 py-4 border-t border-slate-200 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* ChatGPT風の統合入力エリア */}
        <div className="relative flex flex-col border border-slate-300 rounded-2xl bg-white shadow-sm">
          {/* テキストエリア */}
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 min-h-[60px] max-h-[200px] resize-none text-[14px] border-0 focus:border-0 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 bg-transparent"
            rows={1}
          />

          {/* ボトムバー：プルダウンと送信ボタン */}
          <div className="flex items-center justify-end p-3 gap-2">
            {/* リーズニングエフォートプルダウン（送信ボタンのすぐ左） */}
            <Select
              value={reasoningEffort}
              onValueChange={(value) => onReasoningEffortChange(value as ReasoningEffort)}
              disabled={disabled}
            >
              <SelectTrigger
                className="h-8 w-[100px] border-0 bg-transparent text-[12px] text-slate-600 hover:bg-slate-100 rounded-lg focus:ring-0 focus:ring-offset-0"
                aria-label="Reasoning effort"
              >
                <SelectValue placeholder="Effort" />
              </SelectTrigger>
              <SelectContent side="top">
                {reasoningEffortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 送信ボタン */}
            <Button
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              className="h-8 w-8 rounded-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 disabled:opacity-100 p-0"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ヒントテキスト */}
        <div className="text-center mt-2">
          <span className="text-[11px] text-slate-400">
            Shift + Enter で改行、Enter で送信
          </span>
        </div>
      </div>
    </div>
  );
}
