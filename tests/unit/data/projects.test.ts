import { describe, it, expect, mock } from "bun:test";

describe("createProject", () => {
  it("projects作成時にダミーのproject_idカラムを送信しない", async () => {
    let capturedPayload: Record<string, unknown> | null = null;
    const insertedRow = {
      id: "proj-1",
      name: "テストプロジェクト",
      description: null,
      github_url: null,
      review_link_threshold: "medium",
      auto_save: true,
      created_at: "2026-02-12T00:00:00.000Z",
      updated_at: "2026-02-12T00:00:00.000Z",
    };

    mock.module("@/lib/supabase/client", () => ({
      supabase: {
        from: (table: string) => {
          expect(table).toBe("projects");
          return {
            insert: (payload: Record<string, unknown>) => {
              capturedPayload = payload;
              return {
                select: () => ({
                  single: async () => ({ data: insertedRow, error: null }),
                }),
              };
            },
          };
        },
      },
      getSupabaseConfigError: () => null,
    }));

    const { createProject } = await import("@/lib/data/projects");
    const result = await createProject({ name: "テストプロジェクト" });

    expect(result.error).toBeNull();
    expect(result.data?.id).toBe("proj-1");
    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload).not.toHaveProperty("_no_project_id_");
    expect(capturedPayload).not.toHaveProperty("project_id");
  });
});
