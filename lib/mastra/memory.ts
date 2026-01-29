import { Memory } from '@mastra/memory';
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { WorkingMemorySchema } from './memory/working-memory-schema';

/**
 * Mastra Memory設定
 *
 * - LibSQLStore: 会話履歴の永続化ストレージ
 * - LibSQLVector: セマンティック検索用ベクトルDB
 * - embedder: OpenAIのembeddingモデル
 * - options: メモリ管理オプション
 * - workingMemory.schema: Zodスキーマによる構造化されたセッション状態管理
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

    // ワーキングメモリ設定（Schema-based方式）
    workingMemory: {
      enabled: true,
      schema: WorkingMemorySchema,
    },
  },
});
