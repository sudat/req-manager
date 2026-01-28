import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ChatLocation } from './types';

type ChatHeaderProps = {
  location?: ChatLocation;
  onClose: () => void;
};

/**
 * チャットヘッダー
 *
 * 現在位置表示と閉じるボタンを含む。
 */
export function ChatHeader({ location, onClose }: ChatHeaderProps) {
  const getLocationLabel = () => {
    if (!location) return 'AI要件アシスタント';

    const parts: string[] = ['AI要件アシスタント'];

    if (location.bdId) parts.push(`BD: ${location.bdId}`);
    if (location.btId) parts.push(`BT: ${location.btId}`);
    if (location.brId) parts.push(`BR: ${location.brId}`);
    if (location.sdId) parts.push(`SD: ${location.sdId}`);
    if (location.sfId) parts.push(`SF: ${location.sfId}`);
    if (location.srId) parts.push(`SR: ${location.srId}`);

    return parts.join(' > ');
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold text-slate-900">
            AI要件アシスタント
          </h2>
          {location && (
            <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-mono px-2 py-0.5">
              {location.screen}
            </Badge>
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-mono">{getLocationLabel()}</span>
          </div>
        )}
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="h-8 w-8 hover:bg-slate-100"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
