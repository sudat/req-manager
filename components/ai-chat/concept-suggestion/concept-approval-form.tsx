"use client";

import { useState } from 'react';
import { BookOpen, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { ConceptApproval } from './types';

type ConceptApprovalFormProps = {
  initialTerm: string;
  onSubmit: (approval: ConceptApproval) => void;
  onCancel: () => void;
};

/**
 * 概念承認フォーム
 *
 * 新規概念を承認する際に、詳細情報を入力するフォーム。
 */
export function ConceptApprovalForm({
  initialTerm,
  onSubmit,
  onCancel,
}: ConceptApprovalFormProps) {
  const [term, setTerm] = useState(initialTerm);
  const [definition, setDefinition] = useState('');
  const [aliases, setAliases] = useState<string[]>([]);
  const [aliasInput, setAliasInput] = useState('');
  const [category, setCategory] = useState('');

  const handleAddAlias = () => {
    const trimmed = aliasInput.trim();
    if (trimmed && !aliases.includes(trimmed)) {
      setAliases([...aliases, trimmed]);
      setAliasInput('');
    }
  };

  const handleRemoveAlias = (alias: string) => {
    setAliases(aliases.filter((a) => a !== alias));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim() || !definition.trim()) return;

    onSubmit({
      term: term.trim(),
      definition: definition.trim(),
      aliases: aliases.length > 0 ? aliases : undefined,
      category: category.trim() || undefined,
    });
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-slate-600" />
        <h3 className="text-[16px] font-semibold text-slate-900">
          新規概念の登録
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 用語 */}
        <div>
          <Label htmlFor="term" className="text-[12px] font-medium text-slate-700">
            用語 <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="例: ユーザー"
            className="mt-1 text-[14px]"
            required
          />
        </div>

        {/* 定義 */}
        <div>
          <Label htmlFor="definition" className="text-[12px] font-medium text-slate-700">
            定義 <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            id="definition"
            value={definition}
            onChange={(e) => setDefinition(e.target.value)}
            placeholder="この用語の定義を記述してください"
            className="mt-1 text-[14px] min-h-[80px]"
            required
          />
        </div>

        {/* カテゴリ */}
        <div>
          <Label htmlFor="category" className="text-[12px] font-medium text-slate-700">
            カテゴリ（任意）
          </Label>
          <Input
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例: 業務概念"
            className="mt-1 text-[14px]"
          />
        </div>

        {/* 別名・エイリアス */}
        <div>
          <Label htmlFor="alias" className="text-[12px] font-medium text-slate-700">
            別名・エイリアス（任意）
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="alias"
              value={aliasInput}
              onChange={(e) => setAliasInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddAlias();
                }
              }}
              placeholder="別名を入力してEnter"
              className="text-[14px]"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddAlias}
              className="h-9 w-9 flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {aliases.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {aliases.map((alias) => (
                <div
                  key={alias}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-[12px] text-slate-700"
                >
                  <span>{alias}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAlias(alias)}
                    className="hover:text-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!term.trim() || !definition.trim()}
          >
            登録
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </div>
  );
}
