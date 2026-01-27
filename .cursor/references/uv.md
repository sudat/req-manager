
# 1. プロジェクト管理

```bash
# 新規プロジェクト作成
uv init my-project

# 既存ディレクトリでプロジェクト初期化
uv init

# プロジェクトの依存関係を同期
uv sync

# プロジェクトをロックファイル通りに同期（本番環境向け）
uv sync --frozen

# 開発依存関係を除外して同期
uv sync --no-dev
```

# 2. 仮想環境管理

```bash
# 仮想環境作成
uv venv

# 特定のPythonバージョンで仮想環境作成
uv venv --python 3.13

# 仮想環境を指定の名前で作成
uv venv my-env

# 仮想環境の有効化
source .venv/bin/activate

```

# 3. パッケージ管理（pip互換）

```bash
# パッケージインストール
uv pip install requests
uv pip install "django>=4.0"

# requirements.txtからインストール
uv pip install -r requirements.txt

# パッケージ削除
uv pip uninstall requests

# インストール済みパッケージ一覧
uv pip list

# パッケージ詳細表示
uv pip show requests

# requirements.txtファイル生成
uv pip freeze > requirements.txt

# 依存関係解決とロック
uv pip compile requirements.in
uv pip compile pyproject.toml

# 開発依存関係のコンパイル
uv pip compile --extra dev pyproject.toml
```

# 4. プロジェクト依存関係管理

```bash
# 依存関係追加
uv add requests
uv add "fastapi[all]"

# 開発依存関係追加
uv add --dev pytest

# オプショナル依存関係追加
uv add --optional test pytest

# 依存関係削除
uv remove requests

# 依存関係更新
uv lock --upgrade
uv lock --upgrade-package requests

# 特定パッケージのバージョン制約変更
uv add "requests>=2.28"
```

# 5. Pythonバージョン管理

```bash
# 利用可能なPythonバージョン一覧
uv python list

# 特定のPythonバージョンインストール
uv python install 3.11
uv python install 3.12

# プロジェクトのPythonバージョン固定
uv python pin 3.11

# インストール済みPythonバージョン表示
uv python list --only-installed
```

# 6. スクリプト実行

```bash
# 仮想環境でスクリプト実行
uv run script.py
uv run python -m pytest

# Djangoの例
uv run python manage.py runserver

# 依存関係が記述されたスクリプトを直接実行
uv run script_with_inline_deps.py

# 特定のPythonバージョンで実行
uv run --python 3.11 script.py
```

# 7. ツール管理（pipx互換）

```bash
# ツールを一時的に実行
uv tool run black .
uvx black .  # エイリアス

# ツールをグローバルインストール
uv tool install ruff
uv tool install black

# インストール済みツール一覧
uv tool list

# ツール削除
uv tool uninstall ruff

# ツール更新
uv tool upgrade black
uv tool upgrade --all
```

# 8. ビルド・公開

```bash
# パッケージビルド
uv build

# 特定フォーマットでビルド
uv build --wheel
uv build --sdist

# PyPIに公開
uv publish

# TestPyPIに公開
uv publish --repository testpypi

# 認証トークン指定
uv publish --token your-token
```

# 9. キャッシュ管理

```bash
# キャッシュ情報表示
uv cache info

# キャッシュサイズ表示
uv cache prune

# キャッシュクリア
uv cache clean

# 特定パッケージのキャッシュ無効化
uv pip install --refresh-package requests requests
```

# 10. 便利なオプション

```bash
# 詳細出力
uv pip install -v requests

# システムPythonに直接インストール（CI/コンテナ用）
uv pip install --system requests

# オフラインモード
uv pip install --offline requests

# 特定インデックスURL使用
uv pip install --index-url https://my-index.com/simple/ requests

# プラットフォーム指定解決
uv pip compile --python-platform linux requirements.in

# 特定日時以前のパッケージのみ使用
uv pip install --exclude-newer 2024-01-01 requests
```

# 11. 設定とヘルプ

```bash
# コマンドヘルプ表示
uv help
uv pip install --help

# 設定表示
uv --version

# uvアップデート
uv self update
```