import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';

/**
 * Mastra Memory設定
 *
 * - LibSQLStore: 会話履歴の永続化ストレージ
 * - LibSQLVector: セマンティック検索用ベクトルDB
 * - embedder: OpenAIのembeddingモデル
 * - options: メモリ管理オプション
 */
export const memory = new Memory({
  storage: new LibSQLStore({
    id: 'requirements-memory-storage',
    url: 'file:./data/memory.db',
  }),
  vector: new LibSQLVector({
    id: 'requirements-vector-storage',
    url: 'file:./data/vector.db',
  }),
  embedder: 'openai/text-embedding-3-small',
  options: {
    // 会話履歴設定: 直近20メッセージをコンテキストに含める
    lastMessages: 20,

    // セマンティックリコール設定
    semanticRecall: {
      topK: 3, // 最も類似する3件を取得
      messageRange: {
        before: 2, // マッチの前2メッセージを含める
        after: 1,  // マッチの後1メッセージを含める
      },
    },

    // ワーキングメモリ設定
    workingMemory: {
      enabled: true,
      template: `
# セッションコンテキスト

## 現在位置
- プロジェクトID:
- 画面位置:
- 親要素:

## 作業中の草案
- BT草案:
- BR草案:
- SF/SR/AC草案:

## 未確定事項
- 要確認項目:
- 保留中の決定:
`,
    },
  },
});
