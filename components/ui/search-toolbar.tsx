import React from 'react';
import Link from 'next/link';
import { Search, Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SearchToolbarAction {
  /** アクションボタンのラベル */
  label: string;
  /** アクションボタンのリンク先 */
  href?: string;
  /** アイコンコンポーネント（Sparkles, Plusなど） */
  icon?: React.ComponentType<{ className?: string }>;
  /** ボタンのスタイル種別（デフォルト: 'default'） */
  variant?: 'ai' | 'default';
  /** ボタンのonClickハンドラ */
  onClick?: () => void;
  /** ボタンを無効化するか */
  disabled?: boolean;
}

export interface SearchToolbarProps {
  /** 検索クエリの値 */
  value: string;
  /** 検索クエリ変更時のハンドラ */
  onChange: (value: string) => void;
  /** プレースホルダーテキスト */
  placeholder?: string;
  /** アクションボタンの配列 */
  actions?: SearchToolbarAction[];
  /** 追加のカスタムクラス名 */
  className?: string;
  /** 検索入力を無効化するか */
  disabled?: boolean;
}

/**
 * 検索バー + アクションボタンの共通コンポーネント
 *
 * 一覧ページで使用する検索バーとアクションボタン（AIで追加、新規作成など）を
 * 統一されたスタイルで提供する。
 *
 * @example
 * <SearchToolbar
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="業務タスク名、ID、業務概要で検索..."
 *   actions={[
 *     { label: 'AIで追加', href: '/chat?screen=BD', icon: Sparkles, variant: 'ai' },
 *     { label: '新規作成', href: '/business/create', icon: Plus },
 *   ]}
 * />
 */
export function SearchToolbar({
  value,
  onChange,
  placeholder = '検索...',
  actions = [],
  className = '',
  disabled = false,
}: SearchToolbarProps) {
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-4 ${className}`}>
      <div className="flex flex-1 gap-3 min-w-[300px] rounded-md border border-slate-200 bg-slate-50/50 px-4 py-3">
        {/* 検索入力 */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-full pl-10 pr-3 py-1.5 bg-transparent border-0 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* アクションボタン */}
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isAiVariant = action.variant === 'ai';

          // onClickがある場合はボタン、そうでなければリンク
          const buttonElement = (
            <Button
              className={
                isAiVariant
                  ? 'h-8 gap-2 text-[14px] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white'
                  : 'h-8 gap-2 text-[14px] bg-slate-900 hover:bg-slate-800'
              }
              disabled={action.disabled}
              onClick={action.onClick}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {action.label}
            </Button>
          );

          if (action.href) {
            return <Link key={index} href={action.href}>{buttonElement}</Link>;
          }
          return <React.Fragment key={index}>{buttonElement}</React.Fragment>;
        })}
      </div>
    </div>
  );
}
