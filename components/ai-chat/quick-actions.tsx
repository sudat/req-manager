import { FileText, ListChecks, Layers, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { QuickAction } from './types';

type QuickActionsProps = {
  onActionClick: (action: QuickAction) => void;
  disabled?: boolean;
};

/**
 * クイックアクションバー
 *
 * 頻繁に使う操作をボタンで提供する。
 */
export function QuickActions({ onActionClick, disabled }: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      id: 'bt_register',
      label: 'BT登録',
      description: '業務タスクを登録する',
      icon: FileText,
      prompt: '業務タスクを登録したいです。',
    },
    {
      id: 'br_register',
      label: 'BR登録',
      description: '業務要件を登録する',
      icon: ListChecks,
      prompt: '業務要件を登録したいです。',
    },
    {
      id: 'system_generate',
      label: 'SF/SR/AC生成',
      description: 'BRからシステム要件を一括生成する',
      icon: Layers,
      prompt: '選択したBRからSF/SR/ACを一括生成したいです。',
    },
    {
      id: 'quality_check',
      label: '品質チェック',
      description: '要件の曖昧さや矛盾を検出する',
      icon: AlertCircle,
      prompt: '要件の品質をチェックしてください。',
    },
  ];

  return (
    <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
          クイックアクション
        </span>
        <div className="flex gap-2 flex-1">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                onClick={() => onActionClick(action)}
                disabled={disabled}
                className="h-7 gap-1.5 text-[12px] border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                title={action.description}
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
