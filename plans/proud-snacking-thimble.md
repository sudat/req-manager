# エクスポート機能実装計画

## 概要
業務一覧（BD→BT→BR）とシステム一覧（SD→SF→SR）をExcel形式でエクスポートする機能を実装する。

## 背景
- `/export` ページは現在UIのみ（ダミー実装）
- PRDには「改修指示パッケージ」のエクスポート仕様があるが、Phase 1では基本データのエクスポートに絞る
- Phase 2で改修指示パッケージを別途実装予定

## 要件

### 機能要件
| 項目 | 内容 |
|------|------|
| エクスポート対象 | 業務一覧（全部のBD→BT→BR）、システム一覧（全部のSD→SF→SR） |
| 出力形式 | Excel（.xlsx） |
| シート構成 | 1シートに全部まとめる |
| 出力方法 | ブラウザダウンロード |

### 非機能要件
- 大容量データ時のパフォーマンス考慮
- メモリ効率の良いストリーミング処理（必要に応じて）

## 技術選定

### Excelライブラリ: `exceljs`
選定理由:
- Stream書き出し対応（大容量データに強い）
- スタイル設定可能
- TypeScript対応
- アクティブメンテナンス

```bash
bun add exceljs
bun add -D @types/exceljs
```

## 実装計画

### Phase 1: ライブラリ導入
- [ ] `exceljs` のインストール
- [ ] 型定義の確認

### Phase 2: APIエンドポイント作成

#### 2-1. 業務一覧エクスポート API
**ファイル**: `app/api/export/business/route.ts`

**処理内容**:
1. 全部のBDを取得
2. BDに紐づくBTを取得
3. BTに紐づくBRを取得
4. フラットな構造に変換
5. Excel生成
6. ダウンロードレスポンス

**出力カラム**:
| カラム名 | データソース |
|---------|-------------|
| 業務分類ID | BD.id |
| 業務分類名 | BD.name |
| 業務分類エリア | BD.area |
| 業務タスクID | BT.id |
| 業務タスク名 | BT.name |
| 業務タスク概要 | BT.summary |
| 業務要件ID | BR.id |
| 業務要件タイトル | BR.title |
| 業務要件目的 | BR.goal |
| 業務要件制約 | BR.constraints |
| 業務要件所有者 | BR.owner |

#### 2-2. システム一覧エクスポート API
**ファイル**: `app/api/export/system/route.ts`

**処理内容**:
1. 全部のSDを取得
2. SDに紐づくSFを取得
3. SFに紐づくSRを取得
4. フラットな構造に変換
5. Excel生成
6. ダウンロードレスポンス

**出力カラム**:
| カラム名 | データソース |
|---------|-------------|
| システム領域ID | SD.id |
| システム領域名 | SD.name |
| システム領域説明 | SD.description |
| システム機能ID | SF.id |
| システム機能カテゴリ | SF.category |
| システム機能タイトル | SF.title |
| システム機能概要 | SF.summary |
| システム機能設計方針 | SF.design_policy |
| システム機能ステータス | SF.status |
| システム要件ID | SR.id |
| システム要件タイトル | SR.title |
| システム要件概要 | SR.summary |
| システム要件カテゴリ | SR.category |

### Phase 3: フロントエンド実装

#### 3-1. エクスポートページ修正
**ファイル**: `app/(with-sidebar)/export/page.tsx`

**変更内容**:
- 「業務一覧をエクスポート」ボタン → `/api/export/business` を呼び出し
- 「システム一覧をエクスポート」ボタン → `/api/export/system` を呼び出し
- ダウンロード処理（Blob → URL.createObjectURL → aタグクリック）
- ローディング状態表示

#### 3-2. エクスポート処理の共通化
**ファイル**: `lib/export/utils.ts`（新規作成）

**関数**:
- `downloadExcel(blob: Blob, filename: string)` - 共通ダウンロード処理
- `formatDateForFilename()` - ファイル名用日付フォーマット

## ファイル変更一覧

| ファイルパス | 変更内容 |
|-------------|---------|
| `package.json` | `exceljs` 追加 |
| `app/api/export/business/route.ts` | 新規作成 - 業務一覧エクスポートAPI |
| `app/api/export/system/route.ts` | 新規作成 - システム一覧エクスポートAPI |
| `app/(with-sidebar)/export/page.tsx` | 修正 - エクスポートボタン機能実装 |
| `lib/export/utils.ts` | 新規作成 - エクスポート共通ユーティリティ |

## 検証手順

1. **動作確認**:
   ```bash
   # 開発サーバー起動
   bun run dev

   # ブラウザで http://localhost:3000/export にアクセス
   ```

2. **業務一覧エクスポートテスト**:
   - 「業務一覧をエクスポート」ボタンをクリック
   - Excelファイルがダウンロードされることを確認
   - 内容にBD→BT→BRのデータが含まれていることを確認

3. **システム一覧エクスポートテスト**:
   - 「システム一覧をエクスポート」ボタンをクリック
   - Excelファイルがダウンロードされることを確認
   - 内容にSD→SF→SRのデータが含まれていることを確認

4. **E2Eテスト**（Playwright MCP使用）:
   - `/export` ページにアクセス
   - 各エクスポートボタンをクリック
   - ダウンロードされたファイルを確認

## 将来拡張（Phase 2）

- 改修指示パッケージのエクスポート（PRD仕様通りのMarkdown + YAML frontmatter形式）
- フィルタ機能（特定のBD/SDのみエクスポート）
- スケジュール実行（定期エクスポート）
