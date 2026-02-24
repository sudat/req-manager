import { describe, expect, it } from "bun:test";

import { buildRequirementsExportFiles } from "@/lib/export/requirements-export";

describe("buildRequirementsExportFiles", () => {
  it("BT名/概要は business_tasks（tasks）を正として出力する（推測しない）", () => {
    const files = buildRequirementsExportFiles({
      productRequirement: null,
      businesses: [{ area: "AR", sortOrder: 0 }],
      tasks: [
        {
          id: "BT-AR-0001",
          name: "リアルな業務タスク名",
          summary: "これはBT側の概要",
          businessArea: "AR",
          sortOrder: 1,
        },
      ],
      businessRequirements: [
        {
          id: "BR-AR-0001-0001",
          taskId: "BT-AR-0001",
          title: "請求書を出力できる",
          goal: "PDF出力",
        },
      ],
      systemDomains: [],
      systemFunctions: [],
      systemRequirements: [],
      concepts: [],
      links: [],
    });

    const taskMd = files.get("business/AR/BT-AR-0001.md") ?? "";
    expect(taskMd).toContain("# リアルな業務タスク名");
    expect(taskMd).toContain("**BT ID**: BT-AR-0001");
    expect(taskMd).toContain("これはBT側の概要");

    const indexMd = files.get("business/AR/_index.md") ?? "";
    expect(indexMd).toContain("| BT-AR-0001 | リアルな業務タスク名 | これはBT側の概要 |");
  });
});

