import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

let currentProjectCookie: string | undefined = "project-1";

const generateRequirementsExportMock = mock(async (_projectId: string) => {
  return new Map<string, string>([["README.md", "# export"]]);
});

let GET: () => Promise<Response>;

beforeAll(async () => {
  mock.module("next/headers", () => ({
    cookies: async () => ({
      get: (name: string) => {
        if (name !== "current-project-id") return undefined;
        return currentProjectCookie ? { value: currentProjectCookie } : undefined;
      },
    }),
  }));
  mock.module("@/lib/export/requirements-export", () => ({
    generateRequirementsExport: generateRequirementsExportMock,
  }));

  const route = await import("@/app/api/export/requirements/route");
  GET = route.GET;
});

beforeEach(() => {
  currentProjectCookie = "project-1";
  generateRequirementsExportMock.mockClear();
});

afterEach(() => {
  // 他テストへの mock.module リークに備えて、cookie状態をデフォルトに戻す
  currentProjectCookie = "project-1";
});

afterAll(() => {
  mock.restore();
});

describe("GET /api/export/requirements", () => {
  it("cookieの current-project-id を generateRequirementsExport に渡す", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(generateRequirementsExportMock).toHaveBeenCalledWith("project-1");
    expect(response.headers.get("Content-Type")).toBe("application/zip");
  });

  it("cookieが無い場合はデフォルトプロジェクトを使う", async () => {
    currentProjectCookie = undefined;
    const response = await GET();
    expect(response.status).toBe(200);
    expect(generateRequirementsExportMock).toHaveBeenCalledWith("00000000-0000-0000-0000-000000000001");
  });
});
