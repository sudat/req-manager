import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

const listBusinessesMock = mock(async () => ({
	data: [
		{
			id: "AR",
			name: "債権管理",
			area: "AR",
			summary: "",
			businessReqCount: 0,
			systemReqCount: 0,
			sortOrder: 0,
			createdAt: "",
			updatedAt: "",
		},
		{
			id: "GL",
			name: "一般会計",
			area: "GL",
			summary: "",
			businessReqCount: 0,
			systemReqCount: 0,
			sortOrder: 0,
			createdAt: "",
			updatedAt: "",
		},
	],
	error: null,
}));

const listSystemDomainsMock = mock(async () => ({
	data: [
		{
			id: "SD-AR",
			name: "請求管理",
			description: "",
			sortOrder: 0,
			createdAt: "",
			updatedAt: "",
		},
	],
	error: null,
}));

const resolveProjectLlmRuntimeSettingsMock = mock(async () => ({
	provider: "openai",
	model: "gpt-5-mini",
	temperature: 0,
	baseUrl: undefined,
	verbosity: "low",
}));

const callOpenAIMock = mock(async () => ({
	content: {
		items: [
			{
				title: "請求書発行",
				summary: "請求書を発行して送付する",
				evidence: "議事録: 請求書を毎月発行",
				draftInput: "毎月の請求書を発行し、メールで送付する業務を追加したい。",
				suggestedBdArea: "AR",
				systemNotes: ["PDF出力が必要"],
			},
			{
				title: "経費精算",
				summary: "経費精算の申請と承認",
				evidence: "議事録: 経費精算フローを見直す",
				draftInput: "経費精算の申請〜承認〜支払までの業務を整理したい。",
				suggestedBdArea: "UNKNOWN",
				systemNotes: [],
			},
		],
	},
	model: "gpt-5-mini",
}));

mock.module("@/lib/data/businesses", () => ({
	listBusinesses: listBusinessesMock,
}));

mock.module("@/lib/data/system-domains", () => ({
	listSystemDomains: listSystemDomainsMock,
}));

mock.module("@/lib/mastra/utils/llm-settings", () => ({
	resolveProjectLlmRuntimeSettings: resolveProjectLlmRuntimeSettingsMock,
}));

mock.module("@/lib/mastra/utils/llm-helpers", () => ({
	callOpenAI: callOpenAIMock,
}));

let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
	const route = await import("@/app/api/intake/minutes/extract/route");
	POST = route.POST;
});

beforeEach(() => {
	listBusinessesMock.mockClear();
	listSystemDomainsMock.mockClear();
	resolveProjectLlmRuntimeSettingsMock.mockClear();
	callOpenAIMock.mockClear();
});

const createRequest = (body: unknown) =>
	new Request("http://localhost/api/intake/minutes/extract", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}) as NextRequest;

describe("/api/intake/minutes/extract", () => {
	it("projectIdがない場合は400", async () => {
		const response = await POST(createRequest({ text: "議事録" }));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "projectIdが指定されていません",
		});
	});

	it("抽出結果を返す（suggestedBdAreaは候補にない場合nullになる）", async () => {
		const response = await POST(
			createRequest({ projectId: "project-1", text: "議事録テキスト" }),
		);
		expect(response.status).toBe(200);

		const json = (await response.json()) as any;
		expect(Array.isArray(json.bdOptions)).toBe(true);
		expect(json.bdOptions.length).toBe(2);
		expect(Array.isArray(json.items)).toBe(true);
		expect(json.items.length).toBe(2);

		expect(json.items[0].id).toBe("i1");
		expect(json.items[0].suggestedBdArea).toBe("AR");

		expect(json.items[1].id).toBe("i2");
		expect(json.items[1].suggestedBdArea).toBeNull();

		expect(callOpenAIMock).toHaveBeenCalledTimes(1);
	});
});

