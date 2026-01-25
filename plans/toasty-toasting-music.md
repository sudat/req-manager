# プロジェクト一覧ページにサイドバーを表示する

## 問題
`http://localhost:3000/projects` にアクセスするとサイドバーが表示されない。

## 原因
`app/projects/` ディレクトリが `(with-sidebar)` ルートグループの外にあるため、サイドバーを含むレイアウトが適用されていない。

## 解決策
`app/projects/` を `app/(with-sidebar)/projects/` に移動する。

### 変更内容

1. **ディレクトリ移動**
   - 移動元: `app/projects/`
   - 移動先: `app/(with-sidebar)/projects/`

### 影響範囲
- ルーティング: `/projects` → 変更なし（URLは同じ）
- レイアウト: ルートレイアウト → `(with-sidebar)` レイアウト（サイドバー表示）

## 検証手順
1. ディレクトリを移動
2. 開発サーバーを再起動
3. `http://localhost:3000/projects` にアクセス
4. サイドバーが表示されていることを確認

## ファイル操作
```bash
# ディレクトリ移動
mv app/projects app/(with-sidebar)/projects
```
