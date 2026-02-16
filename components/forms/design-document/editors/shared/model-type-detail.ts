import type { StructuredDesignDocumentSpec } from "@/lib/domain/schemas/design-document-structured";
import type { ModelAttribute } from "@/lib/domain/schemas/model-detail";
import { updateAtIndex } from "@/lib/utils/array-updates";

type ModelTypeDetail = Extract<
  NonNullable<StructuredDesignDocumentSpec["typeDetail"]>,
  { ioType: "model" }
>;

function getModelTypeDetail(current: StructuredDesignDocumentSpec): ModelTypeDetail {
  return current.typeDetail?.ioType === "model" ? current.typeDetail : { ioType: "model" };
}

export function patchModelTypeDetail(
  current: StructuredDesignDocumentSpec,
  patch: Partial<ModelTypeDetail>
): StructuredDesignDocumentSpec {
  return {
    ...current,
    typeDetail: {
      ...getModelTypeDetail(current),
      ...patch,
      ioType: "model",
    },
  };
}

export function updateModelAttributes(
  current: StructuredDesignDocumentSpec,
  updater: (attributes: ModelAttribute[]) => ModelAttribute[]
): StructuredDesignDocumentSpec {
  const typeDetail = getModelTypeDetail(current);

  return {
    ...current,
    typeDetail: {
      ...typeDetail,
      ioType: "model",
      attributes: updater(typeDetail.attributes ?? []),
    },
  };
}

export function patchModelAttribute(
  current: StructuredDesignDocumentSpec,
  attrIndex: number,
  patch: Partial<ModelAttribute>
): StructuredDesignDocumentSpec {
  const typeDetail = getModelTypeDetail(current);

  return {
    ...current,
    typeDetail: {
      ...typeDetail,
      ioType: "model",
      attributes: updateAtIndex(typeDetail.attributes ?? [], attrIndex, patch),
    },
  };
}
