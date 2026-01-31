# 「推奨設定」吹き出しの削除

## 概要
LLM設定画面（/settings）に表示されている「推奨設定」吹き出しを削除する。

## 変更内容
- **ファイル**: `components/settings/llm-settings-content.tsx`
- **削除対象**: 154〜164行目の `Card` コンポーネント（「推奨設定」吹き出し）

### 削除コード
```tsx
<Card className="border border-slate-200 bg-slate-50 p-4">
    <div className="flex items-start gap-3">
        <Info className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
        <div>
            <div className="text-[13px] font-semibold text-slate-900">推奨設定</div>
            <div className="text-[13px] text-slate-600 mt-1 leading-relaxed">
                要件管理では正確性が重要なため、Temperature は 0.3 以下を推奨します。
            </div>
        </div>
    </div>
</Card>
```

## 検証方法
1. `http://localhost:3000/settings` にアクセス
2. LLMプロバイダーを変更（OpenAI/Anthropic/Google/Azure）
3. どのプロバイダーを選択しても「推奨設定」吹き出しが表示されないことを確認
