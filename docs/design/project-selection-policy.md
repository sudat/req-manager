# プロジェクト選択と未選択時フォールバック規約（MVP）

## 目的

本アプリはマルチプロジェクト運用を前提とし、**常に「現在プロジェクト」だけ**を UI/検索/エクスポートに出す。
そのために「現在プロジェクトID」をクライアントとサーバで一貫して解決できるよう、保存場所とフォールバック規約を定める。

## 用語

- **現在プロジェクトID**: 画面表示やAPI取得でデータを絞り込む `project_id`
- **キー名**: `current-project-id`
- **デフォルトプロジェクト**: `DEFAULT_PROJECT_ID = 00000000-0000-0000-0000-000000000001`
  - マイグレーションで作成される「予約済み」のプロジェクト行
  - **名称は変更され得る**（IDだけが不変）

## 保存場所（クライアント）

現在プロジェクトIDはクライアントで以下に保存する。

- `localStorage["current-project-id"]`
- cookie `current-project-id`
  - `path=/`
  - `max-age=365 days`

理由:
- `localStorage` はクライアントの状態復元に使う
- cookie は **Server Component / Route Handler が projectId を解決**するために使う（サーバは `localStorage` にアクセスできない）

## 選択規約（クライアント）

`ProjectProvider` は起動時に `projects` 一覧を取得し、以下の規則で `currentProjectId` を決める。

1. `localStorage["current-project-id"]` が存在し、かつ `projects` に含まれる: それを採用
2. それ以外で `projects` が1件以上ある:
   - `DEFAULT_PROJECT_ID` が存在すればそれを採用
   - なければ `projects[0]` を採用
3. `projects` が0件: `currentProjectId = undefined`（cookie/localStorageもクリア）

また、現在プロジェクトが削除された場合も同様に、`DEFAULT_PROJECT_ID` → `projects[0]` の順で切り替える。

## 解決規約（サーバ/API）

Server Component / Server Action / Route Handler は以下の規則で projectId を解決する。

1. cookie `current-project-id` が存在する: それを採用
2. cookie が無い: `DEFAULT_PROJECT_ID` を採用

補足:
- 初回アクセスなど cookie 未設定のSSRでは、**デフォルトプロジェクトが選ばれる**。
- その後クライアントが `ProjectProvider` の規約に従って cookie を設定するため、次回以降のSSRは一致する。

## データ分離の原則

- `projects` 以外のテーブルは、原則として **必ず `project_id` で絞り込む**。
- UI/検索/エクスポートの表示は **現在プロジェクトのみ**に限定する。

### 例外（許容）

以下は「表示として他プロジェクトを混ぜない」前提で、例外として許容する。

- **グローバル採番**
  - 例: ID採番で「全プロジェクトの最大値」を参照して重複を避ける
- **projects テーブル**
  - `project_id` を持たない（プロジェクト一覧は別扱い）

## デフォルトプロジェクトの扱い

- `DEFAULT_PROJECT_ID` はサーバ側フォールバックで使用するため、**削除しない**（UI/データ層で削除を禁止する）。
- 既存データの `project_id` バックフィル先として使われる場合がある。

## 実装参照

- 定数: `lib/constants/project.ts`
- クライアント解決: `components/project/project-context.tsx`
- プロジェクト削除ガード:
  - UI: `app/(with-sidebar)/projects/page.tsx`
  - データ層: `lib/data/projects.ts`
- サーバ/APIでのcookie解決例:
  - `app/api/export/*/route.ts`
  - `app/api/tickets/[id]/*/route.ts`
  - `app/(with-sidebar)/tickets/[id]/page.tsx`

## セキュリティ注意（MVP）

この規約は「データの整理/UXの一貫性」のためのもので、アクセス制御を担保するものではない。
MVP段階では Supabase の anon ポリシーが permissive なため、セキュリティ境界は別途（Auth/RLS）で担保する。

