# プロジェクト設定のデータ永続化

## 概要
/settings ページのプロジェクト固有設定をSupabaseに保存できるようにする。

## 難易度
```
難易度: ★★☆
根拠: 4 files, 約80 lines, DB+フロント連携
リスク: マイグレーション適用順序、既存データへの影響
```

## 変更対象ファイル

| ファイル | 変更内容 |
|----------|----------|
| `supabase/migrations/XXXXXX_add_project_settings.sql` | カラム追加 |
| `lib/domain/entities.ts` | Projectインターフェース拡張 |
| `lib/data/projects.ts` | 型・変換関数の拡張 |
| `app/(with-sidebar)/settings/page.tsx` | UI修正・保存処理実装 |

## 実装手順

### Step 1: Supabaseマイグレーション
projectsテーブルに設定カラムを追加。

```sql
ALTER TABLE projects
  ADD COLUMN github_url TEXT,
  ADD COLUMN review_link_threshold TEXT DEFAULT 'medium',
  ADD COLUMN auto_save BOOLEAN DEFAULT true;

COMMENT ON COLUMN projects.github_url IS 'GitHubリポジトリURL';
COMMENT ON COLUMN projects.review_link_threshold IS '要確認リンク判定基準: low/medium/high';
COMMENT ON COLUMN projects.auto_save IS '自動保存有効フラグ';
```

### Step 2: エンティティ定義の更新
`lib/domain/entities.ts` のProjectインターフェースを拡張。

```typescript
export interface Project {
  id: string;
  name: string;
  description: string | null;
  // 追加フィールド
  githubUrl: string | null;
  reviewLinkThreshold: 'low' | 'medium' | 'high';
  autoSave: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Step 3: データ層の更新
`lib/data/projects.ts` を修正。

- `ProjectRow` に新カラムを追加
- `ProjectInput` に設定フィールドを追加（オプショナル）
- `toProject` 変換関数を更新
- `toProjectRowPartial` に設定フィールドを追加

### Step 4: 設定ページUI修正
`app/(with-sidebar)/settings/page.tsx` を修正。

**削除する要素:**
- プロジェクト名フォーム（サイドバーで管理済み）
- プロジェクト説明フォーム（サイドバーで管理済み）

**追加・修正する処理:**
1. `useProject()` フックでcurrentProjectを取得
2. `useEffect` で現在のプロジェクト設定をフォームに反映
3. `handleSave` で `updateProject` APIを呼び出し
4. 保存成功時のトースト通知
5. ローディング状態の管理

## 検証方法

1. マイグレーション適用後、Supabaseでカラム追加を確認
2. /settings ページで設定を変更して保存
3. ページリロード後、保存した値が表示されることを確認
4. プロジェクトを切り替えて、プロジェクトごとに設定が異なることを確認
5. Playwright MCPで動作確認（e2e-testingスキル使用）

## 注意事項
- 既存のprojectsレコードはデフォルト値が適用される
- review_link_thresholdはENUM型でなくTEXT型（拡張性重視）
