"use client";

import type { ReactNode } from "react";
import { FoldableStructuredSection } from "@/components/forms/design-document/FoldableStructuredSection";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type { Field } from "@/lib/domain/schemas/fields";
import type { EntryPoint } from "@/lib/domain";
import { CoreLogicViewer } from "./CoreLogicViewer";
import { EntryPointsViewer } from "./EntryPointsViewer";
import { ExceptionsViewer } from "./ExceptionsViewer";
import { FieldsViewer } from "./FieldsViewer";
import { InputSchemaViewer } from "./InputSchemaViewer";
import { ModelDetailViewer } from "./ModelDetailViewer";
import { NonFunctionalViewer } from "./NonFunctionalViewer";
import { OutputSchemaViewer } from "./OutputSchemaViewer";
import { SideEffectsViewer } from "./SideEffectsViewer";

interface StructuredSpecViewerProps {
  spec: StructuredDesignDocumentSpec;
  entryPoints: EntryPoint[];
}

interface ViewerSection {
  key: string;
  title: string;
  description: string;
  titleTooltip: string;
  content: ReactNode;
}

function getScreenElements(spec: StructuredDesignDocumentSpec): Field[] | undefined {
  if (spec.ioType !== "screen" || !spec.inputSchema || !("elements" in spec.inputSchema)) {
    return undefined;
  }

  return spec.inputSchema.elements;
}

export function StructuredSpecViewer({ spec, entryPoints }: StructuredSpecViewerProps): ReactNode {
  const screenElements = getScreenElements(spec);
  const isModelType = spec.ioType === "model";
  const standardSections: ViewerSection[] = [
    {
      key: "entry-points",
      title: "エントリポイント",
      description: "処理の起点となるコード位置・コンポーネント",
      titleTooltip:
        "この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。",
      content: <EntryPointsViewer entryPoints={entryPoints} />,
    },
    {
      key: "input-schema",
      title: "入力スキーマ",
      description: "処理の入口となる振る舞い・経路・条件",
      titleTooltip:
        "操作の入口条件を記述します。画面なら操作対象・トリガー・前提条件、APIならメソッドとパスなど「どう始まるか」を書きます。",
      content: (
        <InputSchemaViewer
          inputSchema={spec.inputSchema}
          ioType={spec.ioType}
          elements={screenElements}
        />
      ),
    },
    {
      key: "core-logic",
      title: "コアロジック",
      description: "入力から出力への処理ルール",
      titleTooltip:
        "入力データを出力データに変換する際に適用されるビジネスルール（検証、計算、状態遷移、判定、集約等）を記述します。",
      content: <CoreLogicViewer coreLogic={spec.coreLogic} />,
    },
    {
      key: "output-schema",
      title: "出力スキーマ",
      description: "処理結果として返す振る舞い・ステータス",
      titleTooltip:
        "処理後の振る舞いを記述します。画面なら遷移先・表示メッセージ、APIなら成功/エラーのステータスコードなどを定義してください。",
      content: <OutputSchemaViewer outputSchema={spec.outputSchema} ioType={spec.ioType} />,
    },
    {
      key: "input-fields",
      title: "入力項目（データ）",
      description: "実際に受け取るデータ項目",
      titleTooltip:
        "受け取る実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。",
      content: <FieldsViewer fields={spec.inputFields} emptyMessage="未設定" />,
    },
    {
      key: "output-fields",
      title: "出力項目（データ）",
      description: "実際に返却・表示するデータ項目",
      titleTooltip:
        "返却・表示する実データの項目を記述します。1タグ=1項目として、名前・型・必須有無・説明を定義してください。",
      content: <FieldsViewer fields={spec.outputFields} emptyMessage="未設定" />,
    },
    {
      key: "side-effects",
      title: "副作用",
      description: "DB更新・外部連携・イベント発行",
      titleTooltip:
        "この機能の実行により発生する外部への影響を記述します。DB更新、外部API呼び出し、イベント発行などを具体化してください。",
      content: <SideEffectsViewer sideEffects={spec.sideEffects} />,
    },
    {
      key: "exceptions",
      title: "例外",
      description: "エラー発生時の挙動",
      titleTooltip:
        "想定されるエラー条件、エラーコード、HTTPステータス、ユーザー向けメッセージ、リカバリ方針を記述します。",
      content: <ExceptionsViewer exceptions={spec.exceptions} />,
    },
    {
      key: "non-functional",
      title: "非機能要件",
      description: "性能、セキュリティ、可用性など",
      titleTooltip:
        "機能以外の品質要件を記述します。応答時間、稼働率、認証/認可など、運用上の基準を明示してください。",
      content: <NonFunctionalViewer nonFunctional={spec.nonFunctional} />,
    },
  ];

  return (
    <div className="space-y-3">
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

      {!isModelType &&
        standardSections.map((section) => (
          <FoldableStructuredSection
            key={section.key}
            title={section.title}
            description={section.description}
            titleTooltip={section.titleTooltip}
          >
            {section.content}
          </FoldableStructuredSection>
        ))}
    </div>
  );
}
