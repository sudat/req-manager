import { describe, expect, it } from "bun:test";
import { businessTasksToMermaidFlow } from "../../../lib/utils/business-flow/business-flow-to-mermaid";
import type { Task } from "../../../lib/domain/entities";

function createTask(
	id: string,
	patch: Partial<Task> = {}
): Task {
	return {
		id,
		businessArea: "AR",
		name: `${id} の業務`,
		summary: "",
		triggerDescription: "",
		triggerTaskIds: [],
		frequency: "monthly",
		frequencyDescription: "",
		processSteps: "",
		input: "",
		output: "",
		conceptIdsYaml: "",
		person: "",
		concepts: [],
		businessReqCount: 0,
		systemReqCount: 0,
		sortOrder: 0,
		createdAt: "2026-02-24T00:00:00.000Z",
		updatedAt: "2026-02-24T00:00:00.000Z",
		...patch,
	};
}

describe("businessTasksToMermaidFlow", () => {
	it("triggerTaskIds から全体フローを描画できる", () => {
		const tasks: Task[] = [
			createTask("BT-AR-0001", { sortOrder: 1 }),
			createTask("BT-AR-0002", {
				sortOrder: 2,
				triggerTaskIds: ["BT-AR-0001"],
				triggerDescription: "締め完了後",
			}),
		];

		const result = businessTasksToMermaidFlow(tasks, "AR");

		expect(result.warnings).toHaveLength(0);
		expect(result.mermaidCode).toContain("START --> TASK_BT_AR_0001");
		expect(result.mermaidCode).toContain(
			"TASK_BT_AR_0001 -->|締め完了後| TASK_BT_AR_0002"
		);
		expect(result.mermaidCode).toContain("TASK_BT_AR_0002 --> END");
	});

	it("複数トリガーを受けるタスクを描画できる", () => {
		const tasks: Task[] = [
			createTask("BT-AR-0001", { sortOrder: 1 }),
			createTask("BT-AR-0002", { sortOrder: 2 }),
			createTask("BT-AR-0003", {
				sortOrder: 3,
				triggerTaskIds: ["BT-AR-0001", "BT-AR-0002"],
				triggerDescription: "承認済みの場合",
			}),
		];

		const result = businessTasksToMermaidFlow(tasks, "AR");

		expect(result.mermaidCode).toContain(
			"TASK_BT_AR_0001 -->|承認済みの場合| TASK_BT_AR_0003"
		);
		expect(result.mermaidCode).toContain(
			"TASK_BT_AR_0002 -->|承認済みの場合| TASK_BT_AR_0003"
		);
	});

	it("不正な triggerTaskIds があれば warning を返す", () => {
		const tasks: Task[] = [
			createTask("BT-AR-0001", { sortOrder: 1 }),
			createTask("BT-AR-0002", {
				sortOrder: 2,
				triggerTaskIds: ["BT-AR-9999"],
			}),
		];

		const result = businessTasksToMermaidFlow(tasks, "AR");

		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.warnings.join("\n")).toContain("triggerTaskId");
		expect(result.mermaidCode).toContain("TASK_BT_AR_0002");
	});
});
