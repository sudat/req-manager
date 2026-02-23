"use client";

import { memo, type ReactNode } from "react";
import { FoldableStructuredSection } from "./FoldableStructuredSection";
import { EntryPointsInlineEditor } from "@/components/forms/entry-points/EntryPointsInlineEditor";
import type { DdType, EntryPoint } from "@/lib/domain";
import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import {
  CoreLogicEditor,
  ExceptionsEditor,
  InputSchemaEditor,
  NonFunctionalEditor,
  OutputSchemaEditor,
  SequenceEditor,
  SideEffectsEditor,
} from "./editors";

interface StructuredSpecEditorProps {
  spec: StructuredDesignDocumentSpec;
  entryPoints: EntryPoint[];
  selectableTargetDds?: { id: string; name: string; type: DdType; summary: string }[];
  showEntryPointsEditor?: boolean;
  showSequenceEditor?: boolean;
  onChange: (next: StructuredDesignDocumentSpec) => void;
  onEntryPointsChange: (entryPoints: EntryPoint[]) => void;
  updateStructuredSpec: (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => void;
  onOpenFkDialog: (attrIndex: number) => void;
}

function StructuredSpecEditorComponent({
  spec,
  entryPoints,
  selectableTargetDds,
  showEntryPointsEditor = true,
  showSequenceEditor = true,
  onChange,
  onEntryPointsChange,
  updateStructuredSpec,
  onOpenFkDialog,
}: StructuredSpecEditorProps): ReactNode {
  return (
    <div className="space-y-4">
      {spec.ioType !== "model" && showEntryPointsEditor && (
        <FoldableStructuredSection
          title="エントリポイント"
          description="処理の起点となるコード位置・コンポーネントを定義します"
          titleTooltip="この機能の実装が存在するコードパス（ファイルパス、クラス名、関数名など）を記述します。複数のエントリポイントがある場合はすべて列挙してください。"
        >
          <EntryPointsInlineEditor
            entryPoints={entryPoints}
            onChange={onEntryPointsChange}
          />
        </FoldableStructuredSection>
      )}

      <InputSchemaEditor
        spec={spec}
        onChange={onChange}
        updateStructuredSpec={updateStructuredSpec}
        onOpenFkDialog={onOpenFkDialog}
      />

      <CoreLogicEditor spec={spec} updateStructuredSpec={updateStructuredSpec} />
      <OutputSchemaEditor spec={spec} onChange={onChange} />
      <SideEffectsEditor spec={spec} updateStructuredSpec={updateStructuredSpec} />
      {showSequenceEditor && (
        <SequenceEditor
          spec={spec}
          updateStructuredSpec={updateStructuredSpec}
          selectableTargetDds={selectableTargetDds}
        />
      )}
      <ExceptionsEditor spec={spec} updateStructuredSpec={updateStructuredSpec} />
      <NonFunctionalEditor spec={spec} updateStructuredSpec={updateStructuredSpec} />
    </div>
  );
}

function areStructuredSpecEditorPropsEqual(
  prevProps: StructuredSpecEditorProps,
  nextProps: StructuredSpecEditorProps
): boolean {
  return (
    prevProps.spec === nextProps.spec &&
    prevProps.entryPoints === nextProps.entryPoints &&
    prevProps.selectableTargetDds === nextProps.selectableTargetDds &&
    prevProps.showEntryPointsEditor === nextProps.showEntryPointsEditor &&
    prevProps.showSequenceEditor === nextProps.showSequenceEditor &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onEntryPointsChange === nextProps.onEntryPointsChange &&
    prevProps.updateStructuredSpec === nextProps.updateStructuredSpec &&
    prevProps.onOpenFkDialog === nextProps.onOpenFkDialog
  );
}

export const StructuredSpecEditor = memo(
  StructuredSpecEditorComponent,
  areStructuredSpecEditorPropsEqual
);

StructuredSpecEditor.displayName = "StructuredSpecEditor";
