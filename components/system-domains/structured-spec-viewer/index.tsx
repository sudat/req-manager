"use client";

import type { ReactNode } from "react";
import { FoldableStructuredSection } from "@/components/forms/design-document/FoldableStructuredSection";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type { Field } from "@/lib/domain/schemas/fields";
import type { EntryPoint } from "@/lib/domain";
import { InputSchemaViewer } from "./InputSchemaViewer";
import { FieldsViewer } from "./FieldsViewer";
import { CoreLogicViewer } from "./CoreLogicViewer";
import { OutputSchemaViewer } from "./OutputSchemaViewer";
import { SideEffectsViewer } from "./SideEffectsViewer";
import { ExceptionsViewer } from "./ExceptionsViewer";
import { NonFunctionalViewer } from "./NonFunctionalViewer";
import { EntryPointsViewer } from "./EntryPointsViewer";
import { ModelDetailViewer } from "./ModelDetailViewer";

interface StructuredSpecViewerProps {
  spec: StructuredDesignDocumentSpec;
  entryPoints: EntryPoint[];
}

// 画面タイプの場合のみinputSchema.elementsを使用
function getScreenElements(inputSchema: unknown): Field[] | undefined {
  if (inputSchema && typeof inputSchema === "object" && "elements" in inputSchema) {
    const elements = (inputSchema as { elements?: unknown[] }).elements;
    // Field型として安全にキャスト（実際のデータ構造が一致することを前提）
    return elements as Field[] | undefined;
  }
  return undefined;
}

export function StructuredSpecViewer({ spec, entryPoints }: StructuredSpecViewerProps): ReactNode {
  const screenElements = getScreenElements(spec.inputSchema);
  const isModelType = spec.ioType === "model";

  return (
    <div className="space-y-3">
      {/* エントリポイント（モデル型以外のみ表示） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="エントリポイント"
          description="処理の起点となるコード位置・コンポーネント"
          titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
        >
          <EntryPointsViewer entryPoints={entryPoints} />
        </FoldableStructuredSection>
      )}

      {/* モデル定義（modelタイプの場合のみ） */}
      {isModelType && spec.typeDetail?.ioType === "model" && (
        <FoldableStructuredSection
          title="エンティティ定義"
          description="論理エンティティの構造定義"
          titleTooltip="データモデルの論理構造（ER図相当）を記述します。エンティティの属性、関連、状態遷移を定義してください。"
        >
          <ModelDetailViewer typeDetail={spec.typeDetail} />
        </FoldableStructuredSection>
      )}

      {/* 入力スキーマ（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="入力スキーマ"
          description="処理の入口となる振る舞い・経路・条件"
          titleTooltip="操作の入口条件を記述します。画面なら操作対象・トリガー・前提条件、APIならメソッドとパスなど「どう始まるか」を書きます。"
        >
          <InputSchemaViewer
            inputSchema={spec.inputSchema}
            ioType={spec.ioType}
            elements={screenElements}
          />
        </FoldableStructuredSection>
      )}

      {/* コアロジック（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="コアロジック"
          description="入力から出力への処理ルール"
          titleTooltip="入力データを出力データに変換する際に適用されるビジネスルール（検証、計算、状態遷移、判定、集約等）を記述します。"
        >
          <CoreLogicViewer coreLogic={spec.coreLogic} />
        </FoldableStructuredSection>
      )}

      {/* 出力スキーマ（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="出力スキーマ"
          description="処理結果として返す振る舞い・ステータス"
          titleTooltip="処理後の振る舞いを記述します。画面なら遷移先・表示メッセージ、APIなら成功/エラーのステータスコードなどを定義してください。"
        >
          <OutputSchemaViewer outputSchema={spec.outputSchema} ioType={spec.ioType} />
        </FoldableStructuredSection>
      )}

      {/* 入力項目（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="入力項目（データ）"
          description="実際に受け取るデータ項目"
          titleTooltip="受け取る実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
        >
          <FieldsViewer fields={spec.inputFields} emptyMessage="未設定" />
        </FoldableStructuredSection>
      )}

      {/* 出力項目（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="出力項目（データ）"
          description="実際に返却・表示するデータ項目"
          titleTooltip="返却・表示する実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。"
        >
          <FieldsViewer fields={spec.outputFields} emptyMessage="未設定" />
        </FoldableStructuredSection>
      )}

      {/* 副作用（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="副作用"
          description="DB更新・外部連携・イベント発行"
          titleTooltip="この機能の実行により発生する外部への影響を記述します。DB更新、外部API呼び出し、イベント発行などを具体化してください。"
        >
          <SideEffectsViewer sideEffects={spec.sideEffects} />
        </FoldableStructuredSection>
      )}

      {/* 例外（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="例外"
          description="エラー発生時の挙動"
          titleTooltip="想定されるエラー条件、エラーコード、HTTPステータス、ユーザー向けメッセージ、リカバリ方針を記述します。"
        >
          <ExceptionsViewer exceptions={spec.exceptions} />
        </FoldableStructuredSection>
      )}

      {/* 非機能要件（モデルタイプ以外） */}
      {!isModelType && (
        <FoldableStructuredSection
          title="非機能要件"
          description="性能、セキュリティ、可用性など"
          titleTooltip="機能以外の品質要件を記述します。応答時間、稼働率、認証/認可など、運用上の基準を明示してください。"
        >
          <NonFunctionalViewer nonFunctional={spec.nonFunctional} />
        </FoldableStructuredSection>
      )}
    </div>
  );
}
