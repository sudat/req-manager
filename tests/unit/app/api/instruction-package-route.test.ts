import { afterAll, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";
import {
  registerSharedDataModuleMocks,
  sharedDataModuleMocks,
} from "./shared-data-module-mocks";

const getChangeRequestByIdMock = sharedDataModuleMocks.getChangeRequestByIdMock;
const updateChangeRequestStatusMock = sharedDataModuleMocks.updateChangeRequestStatusMock;

const buildModificationPackageMock = mock(async () => ({
  data: {
    taskId: "task-cr-1",
    crId: "cr-1",
    projectId: "project-1",
    execution: { allowPaths: [] },
  },
  error: null,
}));

const renderModificationPackageMarkdownMock = mock(() => "# 改修指示パッケージ\n");

let POST: (
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => Promise<Response>;

const createRequest = (url: string) =>
  ({
    url,
    method: "POST",
    nextUrl: new URL(url),
  }) as NextRequest;

beforeAll(async () => {
  mock.module("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) =>
        name === "current-project-id" ? { value: "project-1" } : undefined,
    }),
  }));
  registerSharedDataModuleMocks();
  mock.module("@/lib/data/modification-packages", () => ({
    buildModificationPackage: buildModificationPackageMock,
    renderModificationPackageMarkdown: renderModificationPackageMarkdownMock,
  }));

  const route = await import("@/app/api/tickets/[id]/instruction-package/route");
  POST = route.POST;
});

beforeEach(() => {
  getChangeRequestByIdMock.mockReset();
  updateChangeRequestStatusMock.mockReset();
  buildModificationPackageMock.mockReset();
  renderModificationPackageMarkdownMock.mockReset();

  getChangeRequestByIdMock.mockResolvedValue({
    data: {
      id: "cr-1",
      status: "review",
    },
    error: null,
  });
  updateChangeRequestStatusMock.mockResolvedValue({
    data: { id: "cr-1", status: "approved" },
    error: null,
  });
  buildModificationPackageMock.mockResolvedValue({
    data: {
      taskId: "task-cr-1",
      crId: "cr-1",
      projectId: "project-1",
      execution: { allowPaths: ["src/a.ts"] },
    },
    error: null,
  });
  renderModificationPackageMarkdownMock.mockReturnValue("# 改修指示パッケージ\n");
});

afterAll(() => {
  mock.restore();
});

describe("POST /api/tickets/[id]/instruction-package", () => {
  it("status=open の場合は 409 を返す", async () => {
    getChangeRequestByIdMock.mockResolvedValueOnce({
      data: { id: "cr-1", status: "open" },
      error: null,
    });

    const response = await POST(createRequest("http://localhost/api/tickets/cr-1/instruction-package"), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "影響調査が未完了です。先に影響調査を実行してください",
    });
    expect(buildModificationPackageMock).not.toHaveBeenCalled();
  });

  it("変更要求が見つからない場合は 404 を返す", async () => {
    getChangeRequestByIdMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const response = await POST(createRequest("http://localhost/api/tickets/cr-404/instruction-package"), {
      params: Promise.resolve({ id: "cr-404" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "変更要求が見つかりません" });
  });

  it("format=json 指定時は JSON を返し、review から approved に更新する", async () => {
    getChangeRequestByIdMock.mockResolvedValueOnce({
      data: { id: "cr-1", status: "review" },
      error: null,
    });

    const response = await POST(
      createRequest("http://localhost/api/tickets/cr-1/instruction-package?format=json"),
      {
        params: Promise.resolve({ id: "cr-1" }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      package: expect.objectContaining({ crId: "cr-1" }),
    });
    expect(updateChangeRequestStatusMock).toHaveBeenCalledWith("cr-1", "approved", "project-1");
  });

  it("デフォルトでは markdown を返し、approved 状態は更新しない", async () => {
    getChangeRequestByIdMock.mockResolvedValueOnce({
      data: { id: "cr-1", status: "approved" },
      error: null,
    });

    const response = await POST(createRequest("http://localhost/api/tickets/cr-1/instruction-package"), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/markdown");
    expect(response.headers.get("Content-Disposition")).toContain("instruction-package-cr-1.md");
    expect(updateChangeRequestStatusMock).not.toHaveBeenCalled();
    await expect(response.text()).resolves.toContain("改修指示パッケージ");
  });

  it("疑義リンク未解消エラーは 409 を返す", async () => {
    buildModificationPackageMock.mockResolvedValueOnce({
      data: null,
      error: "疑義リンクが未解消のため改修指示パッケージを生成できません",
    });

    const response = await POST(createRequest("http://localhost/api/tickets/cr-1/instruction-package"), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "疑義リンクが未解消のため改修指示パッケージを生成できません",
    });
  });

  it("予期しない例外時は 500 を返す", async () => {
    buildModificationPackageMock.mockRejectedValueOnce(new Error("boom"));

    const response = await POST(createRequest("http://localhost/api/tickets/cr-1/instruction-package"), {
      params: Promise.resolve({ id: "cr-1" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "改修指示パッケージの生成に失敗しました",
    });
  });
});
