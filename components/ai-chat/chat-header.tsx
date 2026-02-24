import { FilePlus, FileText, MapPin, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ChatLocation } from './types';

type ChatHeaderProps = {
  location?: ChatLocation;
	onOpenMinutesIntake?: () => void;
	onToggleHistory?: () => void;
	onNewChat?: () => void;
};

/**
 * チャットヘッダー
 *
 * 現在位置表示を含む。
 */
export function ChatHeader({
	location,
	onOpenMinutesIntake,
	onToggleHistory,
	onNewChat,
}: ChatHeaderProps) {
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
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-[18px] font-semibold text-slate-900">
            AI要件アシスタント
          </h2>
          {location && (
            <Badge
              variant="outline"
              className="border-slate-200 bg-slate-50 text-slate-600 text-[11px] font-mono px-2 py-0.5"
            >
              {location.screen}
            </Badge>
          )}
        </div>
        {location && (
          <div className="flex items-center gap-1.5 text-[12px] text-slate-500 min-w-0">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="font-mono truncate">{getLocationLabel()}</span>
          </div>
        )}
      </div>

      <TooltipProvider>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenMinutesIntake?.()}
                className="h-8 gap-1.5 border-slate-200"
                disabled={!onOpenMinutesIntake}
              >
                <FileText className="h-4 w-4" />
                議事録から草案
              </Button>
            </TooltipTrigger>
            <TooltipContent>議事録からBT/BR草案を一括生成</TooltipContent>
          </Tooltip>

          {onToggleHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onToggleHistory}
                  className="h-9 w-9 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                  aria-label="チャット履歴を開く"
                >
                  <MessagesSquare className="h-5 w-5 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>チャット履歴</TooltipContent>
            </Tooltip>
          )}

          {onNewChat && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onNewChat}
                  className="h-9 w-9 bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
                  aria-label="新規チャットを開始"
                >
                  <FilePlus className="h-5 w-5 text-slate-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>新規チャット</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </div>
  );
}
