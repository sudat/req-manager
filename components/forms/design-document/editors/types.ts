import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";

export interface StructuredSpecEditorProps {
  spec: StructuredDesignDocumentSpec;
  onChange: (next: StructuredDesignDocumentSpec) => void;
  updateStructuredSpec: (
    updater: (current: StructuredDesignDocumentSpec) => StructuredDesignDocumentSpec
  ) => void;
}
