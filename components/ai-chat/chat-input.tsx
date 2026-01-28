import { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

/**
 * メッセージ入力フォーム
 *
 * テキストエリアと送信ボタンを含む。
 */
export function ChatInput({
  onSendMessage,
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
      <div className="flex gap-3 max-w-3xl mx-auto">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-h-[44px] max-h-[200px] resize-none text-[14px] border-slate-200 focus:border-slate-900 focus:ring-slate-900"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="h-11 w-11 flex-shrink-0 bg-slate-900 hover:bg-slate-800"
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <div className="text-center mt-2">
        <span className="text-[11px] text-slate-400">
          Shift + Enter で改行、Enter で送信
        </span>
      </div>
    </div>
  );
}
