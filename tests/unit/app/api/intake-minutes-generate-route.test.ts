import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

const listTasksByBusinessAreaMock = mock(async () => ({
	data: [
		{
			id: "BT-AR-0005",
			name: "既存タスク",
			summary: "",
			businessArea: "AR",
			triggerDescription: "",
			triggerTaskIds: [],
			frequency: "monthly",
			frequencyDescription: "",
			processSteps: "",
			person: "",
			input: "",
			output: "",
			conceptIdsYaml: "",
			concepts: [],
			businessReqCount: 0,
			systemReqCount: 0,
			sortOrder: 0,
			createdAt: "",
			updatedAt: "",
		},
	],
	error: null,
}));

const btDraftExecuteMock = mock(async () => ({
	success: true,
	message: "ok",
	btDraft: {
		code: "BT-AR-0005",
		name: "請求書発行",
		summary: "summary",
		processSteps: [],
		input: [],
		output: [],
		business_area: "AR",
		project_id: "project-1",
		concept_ids: [],
	},
	brDrafts: [
		{
			code: "BT-AR-0005-001",
			requirement: "請求書をPDFで出力できる",
			rationale: "",
			business_task_id: null,
		},
	],
	conceptCandidates: [],
	uncertainties: [],
	previewAvailable: true,
}));

mock.module("@/lib/data/tasks", () => ({
	listTasksByBusinessArea: listTasksByBusinessAreaMock,
}));

mock.module("@/lib/mastra/tools/bt-draft", () => ({
	btDraftTool: {
		execute: btDraftExecuteMock,
	},
}));

let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
	const route = await import("@/app/api/intake/minutes/generate/route");
	POST = route.POST;
});

beforeEach(() => {
	listTasksByBusinessAreaMock.mockClear();
	btDraftExecuteMock.mockClear();
});

const createRequest = (body: unknown) =>
	new Request("http://localhost/api/intake/minutes/generate", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	}) as NextRequest;

describe("/api/intake/minutes/generate", () => {
	it("projectIdがない場合は400", async () => {
		const response = await POST(createRequest({ items: [] }));
		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toEqual({
			error: "projectIdが指定されていません",
		});
	});

	it("同一BD内で複数生成してもBTコードが衝突しない", async () => {
		const response = await POST(
			createRequest({
				projectId: "project-1",
				items: [
					{ id: "i1", bdArea: "AR", text: "議事録A", generateBR: true },
					{ id: "i2", bdArea: "AR", text: "議事録B", generateBR: true },
				],
			}),
		);
		expect(response.status).toBe(200);

		const json = (await response.json()) as any;
		expect(Array.isArray(json.results)).toBe(true);
		expect(json.results.length).toBe(2);

		const first = json.results[0];
		const second = json.results[1];

		expect(first.ok).toBe(true);
		expect(first.btDraft.code).toBe("BT-AR-0006");
		expect(first.brDrafts[0].code).toBe("BT-AR-0006-001");

		expect(second.ok).toBe(true);
		expect(second.btDraft.code).toBe("BT-AR-0007");
		expect(second.brDrafts[0].code).toBe("BT-AR-0007-001");

		expect(listTasksByBusinessAreaMock).toHaveBeenCalledTimes(1);
		expect(btDraftExecuteMock).toHaveBeenCalledTimes(2);
	});
});

