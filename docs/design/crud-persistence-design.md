# CRUD永続化設計書

## 目的

Supabase（PostgreSQL）をバックエンドとした要件管理データの永続化レイヤーを設計し、フロントエンドからの安全で効率的なCRUD操作を実現する。

## 基本アーキテクチャ

### 技術スタック
- **バックエンド**: Supabase（PostgreSQL + Auth + Storage + Edge Functions）
- **フロントエンド**: Next.js + `@supabase/supabase-js`
- **接続方式**: クライアントサイド直接接続（開発時は匿名キー、本番は認証）
- **データアクセス**: Supabase Client SDK経由のSQLクエリ

### 接続設定
```typescript
// 環境変数
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

// クライアント初期化
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, anonKey)
```

## CRUD操作パターン

### 1. 共通パターン

#### 自動採番ルール
- IDはアプリ側で生成（例: `BIZ-${Date.now()}`, `TASK-${Date.now()}`）
- 連番採番は避け、タイムスタンプベースのユニークIDを使用

#### エラーハンドリング
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')

if (error) {
  console.error('Supabase error:', error)
  throw new Error(`Failed to fetch: ${error.message}`)
}
```

#### 型安全
- TypeScript型定義をデータ層で集中管理
- Supabase generated typesを使用

### 2. 読み取り操作（Read）

#### 単一レコード取得
```typescript
// 主キー指定
const { data, error } = await supabase
  .from('business_domains')
  .select('*')
  .eq('id', 'BIZ-001')
  .single()
```

#### 一覧取得（ページング）
```typescript
const { data, error } = await supabase
  .from('business_tasks')
  .select('*')
  .eq('business_id', 'BIZ-001')
  .order('sort_order', { ascending: true })
  .range(0, 49) // 0-49件目
```

#### 検索・フィルタ
```typescript
// テキスト検索
const { data, error } = await supabase
  .from('concepts')
  .select('*')
  .ilike('name', `%${searchTerm}%`)

// 複数条件フィルタ
const { data, error } = await supabase
  .from('system_functions')
  .select('*')
  .in('category', ['screen', 'batch'])
  .eq('status', 'implemented')
```

#### JOIN操作
```typescript
// 業務タスクと業務要件のJOIN
const { data, error } = await supabase
  .from('business_tasks')
  .select(`
    *,
    business_requirements (*)
  `)
  .eq('id', 'TASK-001')
```

### 3. 作成操作（Create）

#### 単一レコード作成
```typescript
const { data, error } = await supabase
  .from('business_domains')
  .insert({
    id: 'BIZ-001',
    name: '請求業務',
    area: 'AR',
    summary: '売上請求から入金管理まで'
  })
  .select()
  .single()
```

#### 一括作成
```typescript
const { data, error } = await supabase
  .from('concepts')
  .insert([
    { id: 'C-001', name: '請求書', areas: ['AR'] },
    { id: 'C-002', name: '消費税', areas: ['AR', 'AP'] }
  ])
```

#### 関連データ同時作成
```typescript
// トランザクション相当（SupabaseではRPC関数を使用）
const { data, error } = await supabase
  .rpc('create_business_task_with_requirements', {
    task_data: { id: 'TASK-001', business_id: 'BIZ-001', ... },
    requirements_data: [
      { id: 'BR-001', task_id: 'TASK-001', ... }
    ]
  })
```

### 4. 更新操作（Update）

#### 単一レコード更新
```typescript
const { data, error } = await supabase
  .from('system_functions')
  .update({
    status: 'implemented',
    updated_at: new Date().toISOString()
  })
  .eq('id', 'SRF-001')
  .select()
  .single()
```

#### 条件付き更新
```typescript
const { data, error } = await supabase
  .from('business_requirements')
  .update({ priority: 'Should' })
  .eq('task_id', 'TASK-001')
  .neq('priority', 'Must')
```

#### JSONBフィールド更新
```typescript
// acceptance_criteria_jsonの更新
const { data, error } = await supabase
  .from('business_requirements')
  .update({
    acceptance_criteria_json: [
      {
        id: 'AC-001',
        description: '請求書に登録番号が表示されること',
        verification_method: '目視確認'
      }
    ]
  })
  .eq('id', 'BR-001')
```

#### 配列フィールド更新
```typescript
// concept_ids配列への追加
const { data, error } = await supabase
  .from('business_requirements')
  .update({
    concept_ids: supabase.sql`array_append(concept_ids, 'C-001')`
  })
  .eq('id', 'BR-001')
```

### 5. 削除操作（Delete）

#### 単一レコード削除
```typescript
const { error } = await supabase
  .from('concepts')
  .delete()
  .eq('id', 'C-001')
```

#### 条件付き削除
```typescript
const { error } = await supabase
  .from('business_tasks')
  .delete()
  .eq('business_id', 'BIZ-001')
  .lt('created_at', '2024-01-01')
```

## データ整合性管理

### 外部キー制約
- CASCADE DELETE: 親削除時に子レコードも自動削除
- 業務タスク削除 → 関連業務要件自動削除
- 業務分類削除 → 関連業務タスク自動削除

### アプリケーション側整合性チェック
```typescript
// 業務要件作成時の事前チェック
async function createBusinessRequirement(data: BusinessRequirementInput) {
  // 1. task_idの存在チェック
  const { data: task } = await supabase
    .from('business_tasks')
    .select('id')
    .eq('id', data.task_id)
    .single()

  if (!task) throw new Error('Invalid task_id')

  // 2. concept_idsの存在チェック
  if (data.concept_ids?.length > 0) {
    const { data: concepts } = await supabase
      .from('concepts')
      .select('id')
      .in('id', data.concept_ids)

    if (concepts.length !== data.concept_ids.length) {
      throw new Error('Invalid concept_ids')
    }
  }

  // 3. 作成実行
  return await supabase
    .from('business_requirements')
    .insert(data)
    .select()
    .single()
}
```

## クエリ最適化

### N+1問題対策
```typescript
// 非効率的なクエリ（N+1問題）
const tasks = await supabase.from('business_tasks').select('*')
for (const task of tasks) {
  const requirements = await supabase
    .from('business_requirements')
    .select('*')
    .eq('task_id', task.id)
}

// 効率的なクエリ（JOIN）
const { data, error } = await supabase
  .from('business_tasks')
  .select(`
    *,
    business_requirements (*)
  `)
```

### インデックス活用
```typescript
// インデックスが効くクエリ
const { data, error } = await supabase
  .from('system_functions')
  .select('*')
  .eq('category', 'screen')  // categoryインデックス使用
  .eq('status', 'implemented')  // statusインデックス使用
  .order('created_at', { ascending: false })
```

### ページング最適化
```typescript
// カーソルベースページング
const { data, error } = await supabase
  .from('business_requirements')
  .select('*')
  .gt('created_at', lastFetchedDate)  // カーソル条件
  .order('created_at', { ascending: true })
  .limit(50)
```

## データ移行管理

### Legacyデータ対応
```typescript
// acceptance_criteria（text[]）からacceptance_criteria_json（jsonb）への移行
async function migrateAcceptanceCriteria() {
  const { data: requirements } = await supabase
    .from('business_requirements')
    .select('id, acceptance_criteria')
    .not('acceptance_criteria', 'is', null)

  for (const req of requirements) {
    if (req.acceptance_criteria?.length > 0) {
      const jsonCriteria = req.acceptance_criteria.map((desc, index) => ({
        id: `AC-${req.id}-${index + 1}`,
        description: desc,
        verification_method: null  // 暫定
      }))

      await supabase
        .from('business_requirements')
        .update({
          acceptance_criteria_json: jsonCriteria
        })
        .eq('id', req.id)
    }
  }
}
```

### Phase移行戦略
1. **Phase 1**: 基本CRUD + legacy列併設
2. **Phase 2**: 構造化データ移行 + 新機能追加
3. **Phase 3**: 最適化 + インデックス改善

## 監査・ログ管理

### 更新履歴自動記録
```typescript
// updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_business_domains_updated_at
    BEFORE UPDATE ON business_domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 変更追跡（将来拡張）
- 変更要求チケット単位での版管理
- 変更前後の差分記録
- 変更理由・承認者の記録

## パフォーマンス考慮事項

### クエリ実行計画
- 大量データの取得時はインデックス確認
- JOIN操作は必要最小限に
- ページングは50件程度を目安

### キャッシュ戦略
- 概念辞書などのマスタデータはブラウザキャッシュ
- 変更頻度の低いデータは積極的にキャッシュ
- Supabaseのリアルタイム機能で変更検知

### 同時実行制御
- 楽観的ロック（versionカラム使用）
- 競合発生時のリトライ処理
- ユーザーへのフィードバック表示

## セキュリティ考慮事項

### RLSポリシー（開発時）
```sql
-- 開発時は匿名アクセス許可
create policy "anon_read_business_domains" on public.business_domains
  for select using (true);

create policy "anon_write_business_domains" on public.business_domains
  for insert with check (true);
```

### 本番環境（将来）
- プロジェクトメンバー限定アクセス
- ロールベースアクセス制御
- 機密情報の暗号化・秘匿化

### 入力検証
- フロントエンドでの型チェック
- データベースレベルでの制約チェック
- XSS・SQLインジェクション対策