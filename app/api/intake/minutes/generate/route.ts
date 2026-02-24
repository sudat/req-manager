import { NextRequest, NextResponse } from "next/server";
import { btDraftTool } from "@/lib/mastra/tools/bt-draft";
import { listTasksByBusinessArea } from "@/lib/data/tasks";
import { getNextBtId } from "@/lib/utils/id-rules";

type GenerateItemInput = {
  id: string;
  bdArea: string;
  text: string;
  generateBR?: boolean;
};

type ToolLikeResult = {
  success?: boolean;
  message?: string;
  btDraft?: any;
  brDrafts?: any[];
  conceptCandidates?: any[];
  uncertainties?: any[];
  previewAvailable?: boolean;
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  return fallback;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeItems = (raw: unknown): GenerateItemInput[] => {
  if (!Array.isArray(raw)) return [];
  const items: GenerateItemInput[] = [];
  for (const item of raw) {
    if (!isPlainObject(item)) continue;
    const id = normalizeString(item.id);
    const bdArea = normalizeString(item.bdArea);
    const text = normalizeString(item.text);
    const generateBR = normalizeBoolean(item.generateBR, true);
    if (!id || !bdArea || !text) continue;
    items.push({ id, bdArea, text, generateBR });
  }
  return items.slice(0, 20);
};

const rewriteBtDraftCodes = (args: {
  btDraft: Record<string, unknown>;
  brDrafts: Record<string, unknown>[];
  forcedBtCode: string;
}) => {
  const { btDraft, brDrafts, forcedBtCode } = args;

  const nextBtDraft = { ...btDraft, code: forcedBtCode };
  const nextBrDrafts = brDrafts.map((br) => {
    const rawCode = typeof br.code === "string" ? br.code : "";
    const suffix = rawCode.split("-").pop() ?? "";
    const normalizedSuffix = /^\d{3,4}$/.test(suffix) ? suffix : "001";
    return {
      ...br,
      code: `${forcedBtCode}-${normalizedSuffix}`,
      business_task_id: null,
    };
  });

  return { nextBtDraft, nextBrDrafts };
};

/**
 * 抽出済みの候補から、BT/BR草案を一括生成する
 * - 確定（登録）は従来どおりカード単位で行う
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = normalizeString(body?.projectId);
    const items = normalizeItems(body?.items);

    if (!projectId) {
      return NextResponse.json(
        { error: "projectIdが指定されていません" },
        { status: 400 }
      );
    }
    if (items.length === 0) {
      return NextResponse.json(
        { error: "生成対象が指定されていません" },
        { status: 400 }
      );
    }

    // 1) 既存BT IDを業務領域ごとに取得し、ローカルで連番を進める（採番衝突回避）
    const areaToIds = new Map<string, string[]>();
    for (const item of items) {
      if (areaToIds.has(item.bdArea)) continue;
      const { data: tasks, error } = await listTasksByBusinessArea(item.bdArea, projectId);
      if (error) {
        return NextResponse.json(
          { error: `既存業務タスクの取得に失敗しました（${item.bdArea}）: ${error}` },
          { status: 500 }
        );
      }
      areaToIds.set(
        item.bdArea,
        (tasks ?? []).map((t) => t.id)
      );
    }

    const results: Array<
      | {
          itemId: string;
          ok: true;
          btDraft: unknown;
          brDrafts: unknown[];
          conceptCandidates: unknown[];
          uncertainties: unknown[];
          previewAvailable: boolean;
        }
      | { itemId: string; ok: false; error: string }
    > = [];

    for (const item of items) {
      try {
        const existingIds = areaToIds.get(item.bdArea) ?? [];
        const forcedBtCode = getNextBtId(item.bdArea, existingIds);
        existingIds.push(forcedBtCode);
        areaToIds.set(item.bdArea, existingIds);

        const toolResult = (await btDraftTool.execute!(
          {
            naturalLanguageInput: item.text,
            bdId: item.bdArea,
            projectId,
            generateBR: item.generateBR ?? true,
          },
          {} as any
        )) as ToolLikeResult;

        if (!toolResult?.success || !toolResult.btDraft) {
          const message =
            toolResult?.message ||
            "BT草案生成に失敗しました（ツール結果が不正です）";
          results.push({ itemId: item.id, ok: false, error: message });
          continue;
        }

        const btDraft = toolResult.btDraft as Record<string, unknown>;
        const brDrafts = Array.isArray(toolResult.brDrafts)
          ? (toolResult.brDrafts as Record<string, unknown>[])
          : [];
        const { nextBtDraft, nextBrDrafts } = rewriteBtDraftCodes({
          btDraft,
          brDrafts,
          forcedBtCode,
        });

        results.push({
          itemId: item.id,
          ok: true,
          btDraft: nextBtDraft,
          brDrafts: nextBrDrafts,
          conceptCandidates: Array.isArray(toolResult.conceptCandidates)
            ? toolResult.conceptCandidates
            : [],
          uncertainties: Array.isArray(toolResult.uncertainties)
            ? toolResult.uncertainties
            : [],
          previewAvailable: Boolean(toolResult.previewAvailable),
        });
      } catch (error: any) {
        results.push({
          itemId: item.id,
          ok: false,
          error: error?.message || "BT草案生成に失敗しました",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("[Minutes Generate API] Error:", error);
    return NextResponse.json(
      { error: error?.message || "草案生成に失敗しました" },
      { status: 500 }
    );
  }
}

