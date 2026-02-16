import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import type { NextRequest } from "next/server";

type DdResult = {
  data: { id: string; name: string; projectId: string } | null;
  error: string | null;
};

const getDesignDocumentByIdMock = mock(
  async (_ddId: string, _projectId?: string): Promise<DdResult> => ({
    data: { id: "DD-AR-0001-0001", name: "テストDD", projectId: "project-1" },
    error: null,
  })
);

mock.module("@/lib/data/design-documents", () => ({
  getDesignDocumentById: getDesignDocumentByIdMock,
}));

let GET: (
  request: NextRequest,
  context: { params: Promise<{ ddId: string }> }
) => Promise<Response>;

beforeAll(async () => {
  const route = await import("@/app/api/design-documents/[ddId]/route");
  GET = route.GET;
});

beforeEach(() => {
  getDesignDocumentByIdMock.mockReset();
});

describe("GET /api/design-documents/[ddId]", () => {
  it("DDを正常に返す", async () => {
    getDesignDocumentByIdMock.mockResolvedValueOnce({
      data: { id: "DD-AR-0001-0001", name: "請求書API", projectId: "project-1" },
      error: null,
    });

    const request = {
      url: "http://localhost:3000/api/design-documents/DD-AR-0001-0001?projectId=project-1",
    } as NextRequest;

    const response = await GET(request, {
      params: Promise.resolve({ ddId: "DD-AR-0001-0001" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      dd: { id: "DD-AR-0001-0001", name: "請求書API", projectId: "project-1" },
    });
    expect(getDesignDocumentByIdMock).toHaveBeenCalledWith("DD-AR-0001-0001", "project-1");
  });

  it("projectIdがない場合は400を返す", async () => {
    const request = {
      url: "http://localhost:3000/api/design-documents/DD-AR-0001-0001",
    } as NextRequest;

    const response = await GET(request, {
      params: Promise.resolve({ ddId: "DD-AR-0001-0001" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "projectId is required",
    });
    expect(getDesignDocumentByIdMock).not.toHaveBeenCalled();
  });

  it("DDが見つからない場合は404を返す", async () => {
    getDesignDocumentByIdMock.mockResolvedValueOnce({
      data: null,
      error: null,
    });

    const request = {
      url: "http://localhost:3000/api/design-documents/DD-AR-0001-9999?projectId=project-1",
    } as NextRequest;

    const response = await GET(request, {
      params: Promise.resolve({ ddId: "DD-AR-0001-9999" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "DesignDocument not found",
    });
  });

  it("データ層で例外が発生した場合は500を返す", async () => {
    getDesignDocumentByIdMock.mockRejectedValueOnce(new Error("boom"));

    const request = {
      url: "http://localhost:3000/api/design-documents/DD-AR-0001-0001?projectId=project-1",
    } as NextRequest;

    const response = await GET(request, {
      params: Promise.resolve({ ddId: "DD-AR-0001-0001" }),
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to fetch design document",
    });
  });
});
