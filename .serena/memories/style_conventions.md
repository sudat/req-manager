# スタイル/設計メモ

- 言語: TypeScript。
- UI: Tailwind CSS + Radix系コンポーネント。
- データ取得: `lib/data/*` にSupabaseアクセス関数がまとまっている。
- フック: `hooks/*` に取得/変換ロジックがある。
- 設計原則: AGENTS.md にYAGNI/DRY/KISSが定義されており、適用時は明示する。