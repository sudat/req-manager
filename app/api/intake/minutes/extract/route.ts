import { NextRequest, NextResponse } from "next/server";
import { callOpenAI } from "@/lib/mastra/utils/llm-helpers";
import { resolveProjectLlmRuntimeSettings } from "@/lib/mastra/utils/llm-settings";
import { listBusinesses } from "@/lib/data/businesses";
import { listSystemDomains } from "@/lib/data/system-domains";

type ExtractItem = {
  title: string;
  summary: string;
  evidence: string;
  draftInput: string;
  suggestedBdArea?: string | null;
  systemNotes?: string[];
};

const normalizeString = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const normalizeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean);
};

const normalizeExtractItems = (
  raw: unknown,
  allowedBdAreas: Set<string>
): ExtractItem[] => {
  const record =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  const items = Array.isArray(record?.items) ? (record?.items as unknown[]) : [];

  const normalized: ExtractItem[] = [];
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const title = normalizeString(obj.title);
    const summary = normalizeString(obj.summary);
    const evidence = normalizeString(obj.evidence);
    const draftInput = normalizeString(obj.draftInput);
    const suggestedBdAreaRaw = normalizeString(obj.suggestedBdArea);
    const suggestedBdArea = allowedBdAreas.has(suggestedBdAreaRaw)
      ? suggestedBdAreaRaw
      : null;
    const systemNotes = normalizeStringArray(obj.systemNotes);

    if (!title && !summary && !draftInput) continue;

    normalized.push({
      title: title || summary || draftInput.slice(0, 50),
      summary: summary || title || draftInput.slice(0, 200),
      evidence,
      draftInput: draftInput || summary || title,
      suggestedBdArea,
      systemNotes,
    });
  }

  return normalized.slice(0, 20);
};

/**
 * 議事録テキストから、BT/BR草案の候補（業務タスク候補）を抽出する
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const projectId = normalizeString(body?.projectId);
    const text = normalizeString(body?.text);

    if (!projectId) {
      return NextResponse.json(
        { error: "projectIdが指定されていません" },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "議事録テキストが指定されていません" },
        { status: 400 }
      );
    }

    const { data: businesses, error: bizError } = await listBusinesses(projectId);
    if (bizError) {
      return NextResponse.json(
        { error: `業務領域の取得に失敗しました: ${bizError}` },
        { status: 500 }
      );
    }

    const { data: systemDomains, error: sdError } = await listSystemDomains(projectId);
    if (sdError) {
      return NextResponse.json(
        { error: `システム領域の取得に失敗しました: ${sdError}` },
        { status: 500 }
      );
    }

    const bdOptions = (businesses ?? []).map((b) => ({
      area: b.area,
      name: b.name,
    }));
    const allowedBdAreas = new Set(bdOptions.map((b) => b.area));

    const sdOptions = (systemDomains ?? []).map((sd) => ({
      id: sd.id,
      name: sd.name,
    }));

    const llmSettings = await resolveProjectLlmRuntimeSettings(projectId);
    const llmOptions = {
      provider: (llmSettings.provider === "zai" ? "zai" : "openai") as
        | "openai"
        | "zai",
      model: llmSettings.model,
      temperature: llmSettings.temperature,
      baseUrl: llmSettings.baseUrl,
      verbosity: llmSettings.verbosity,
    };

    const userPrompt = `
あなたは議事録から要件管理DBに登録すべき内容を抽出する専門家です。
以下の議事録テキストから「業務タスク（BT）として登録すべき候補」を抽出してください。

## 業務領域（BD）の候補一覧（area: name）
${bdOptions.length > 0 ? bdOptions.map((b) => `- ${b.area}: ${b.name}`).join("\n") : "- (未登録)"}

## システム領域（SD）の候補一覧（参考）
${sdOptions.length > 0 ? sdOptions.map((sd) => `- ${sd.id}: ${sd.name}`).join("\n") : "- (未登録)"}

## 議事録
${text}

## 抽出ルール
- items は最大 10 件まで
- 1 item は「1つの業務タスク（BT）」に対応する（細かすぎる作業手順はまとめる）
- suggestedBdArea は BD候補一覧の area から選ぶ（一致しない場合は null）
- draftInput は後段のBT草案生成に使うため、業務の説明として自然文で書く（箇条書き可）
- systemNotes はシステム側の話（画面/API/DB/IF/バッチ等）が含まれていれば短文でメモする（なければ空配列）

## 出力形式（JSON）
{
  "items": [
    {
      "title": "候補タイトル（短く）",
      "summary": "要約（1-2文）",
      "evidence": "議事録中の根拠（引用や該当箇所の要点）",
      "draftInput": "BT草案生成に渡す自然文（詳細め）",
      "suggestedBdArea": "AR",
      "systemNotes": ["..."]
    }
  ]
}
`;

    const llmResponse = await callOpenAI<{ items?: unknown[] }>({
      systemPrompt:
        "あなたは要件定義の専門家です。議事録から業務タスク候補を抽出してJSONで返します。",
      userPrompt,
      jsonMode: true,
      provider: llmOptions.provider,
      model: llmOptions.model,
      temperature: llmOptions.temperature,
      baseUrl: llmOptions.baseUrl,
      verbosity: llmOptions.verbosity,
      maxTokens: 2000,
      timeoutMs: 180000,
    });

    const extractedItems = normalizeExtractItems(llmResponse.content, allowedBdAreas);
    const items = extractedItems.map((item, index) => ({
      id: `i${index + 1}`,
      ...item,
    }));

    return NextResponse.json({
      items,
      bdOptions,
    });
  } catch (error: any) {
    console.error("[Minutes Extract API] Error:", error);
    return NextResponse.json(
      { error: error?.message || "抽出に失敗しました" },
      { status: 500 }
    );
  }
}

