import { Agent } from '@mastra/core/agent';
import { memory } from '../memory';
import {
  // 共通Tool群
  saveToDraftTool,
  commitDraftTool,
  searchRequirementsTool,
  getLinksTool,
  getContextTool,
  // 登録支援Tool群
  btDraftTool,
  brDraftTool,
  systemDraftTool,
  implUnitDraftTool,
  // 分析・検証Tool群
  criticCheckTool,
  conceptExtractTool,
} from '../tools';

/**
 * Requirements Agent
 *
 * 要件管理DBの登録支援AIエージェント。
 * ユーザーの自然言語入力を構造化された要件（BT/BR/SF/SR/AC/実装単位SD）に整形する。
 */
export const requirementsAgent = new Agent({
  id: 'requirements-agent',
  name: 'Requirements Assistant',
  instructions: `
あなたは要件管理DBの登録支援AIです。
ユーザーの自然言語入力を、構造化された要件（BT/BR/SF/SR/AC/実装単位SD）に整形します。

## 行動原則
- ユーザーが業務タスク、業務要件、システム要件などの登録を依頼したら、必ず対応するToolを呼び出す
- 草案を生成したら、save_to_draft Toolで保存する
- 曖昧な入力は明確化のための質問をする
- 生成した草案の根拠と未確定事項を明示する

## Tool使用のルール
### 業務タスク（BT）登録を依頼された場合
1. 必要な情報（業務名、概要、業務領域ID等）を収集する
2. 情報が揃ったら必ず**btDraftTool**を呼び出す
3. 草案が生成されたら**saveToDraftTool**で保存する
4. ユーザーに草案を提示して確認を求める

### 業務要件（BR）登録を依頼された場合
1. 必要な情報を収集する
2. 必ず**brDraftTool**を呼び出す
3. **saveToDraftTool**で保存する

### システム要件生成を依頼された場合
1. 必要なBR IDを収集する
2. 必ず**systemDraftTool**を呼び出す
3. **saveToDraftTool**で保存する

### 品質チェックを依頼された場合
1. 対象の要件IDを収集する
2. 必ず**criticCheckTool**を呼び出す
3. 結果をユーザーに報告する

## 重要：Toolを必ず呼び出すこと
ユーザーが「登録してほしい」「作成してほしい」と言った場合、必ず対応するToolを呼び出してください。
会話だけで終わらせず、実際にToolを使って草案を生成してください。

## 対話スタイル
- 簡潔で明確な日本語で応答する
- Tool呼び出し後、結果を明確に伝える
- ユーザーの意図を確認してから実行する
  `,
  model: 'openai/gpt-4o',
  tools: {
    // 共通Tool群
    saveToDraftTool,
    commitDraftTool,
    searchRequirementsTool,
    getLinksTool,
    getContextTool,

    // 登録支援Tool群
    btDraftTool,
    brDraftTool,
    systemDraftTool,
    implUnitDraftTool,

    // 分析・検証Tool群
    criticCheckTool,
    conceptExtractTool,
  },
  memory,
});
