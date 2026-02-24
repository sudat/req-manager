import { describe, expect, it } from "bun:test";
import { taskProcessStepsToMermaidFlow } from "../../../lib/utils/business-flow/task-flow-to-mermaid";
import type { ProcessStepItem } from "../../../lib/utils/yaml";

describe("taskProcessStepsToMermaidFlow", () => {
	it("直列ステップを基本フローとして描画できる", () => {
		const steps: ProcessStepItem[] = [
			{ when: "月末", who: "経理", action: "締め処理を実行する" },
			{ when: "締め後", who: "経理", action: "承認を依頼する" },
		];

		const result = taskProcessStepsToMermaidFlow(steps, {
			taskId: "BT-AR-0001",
			taskName: "月次締め",
		});

		expect(result.warnings).toHaveLength(0);
		expect(result.mermaidCode).toContain("flowchart TD");
		expect(result.mermaidCode).toContain("START --> STEP_ps_001");
		expect(result.mermaidCode).toContain("STEP_ps_001 --> STEP_ps_002");
		expect(result.mermaidCode).toContain("STEP_ps_002 --> END");
	});

	it("conditionを分岐として描画できる", () => {
		const steps: ProcessStepItem[] = [
			{ id: "s1", when: "", who: "経理", action: "申請内容を確認する" },
			{
				id: "s2",
				when: "",
				who: "課長",
				action: "承認する",
				condition: "金額が100万以上の場合",
			},
			{ id: "s3", when: "", who: "経理", action: "処理を続行する" },
		];

		const result = taskProcessStepsToMermaidFlow(steps, {
			taskId: "BT-AR-0002",
		});

		expect(result.mermaidCode).toContain(
			"STEP_s1 -->|金額が100万以上の場合| STEP_s2"
		);
		expect(result.mermaidCode).toContain("STEP_s1 --> STEP_s3");
		expect(result.mermaidCode).toContain("STEP_s2 --> STEP_s3");
	});

	it("parallelグループを分岐・合流として描画できる", () => {
		const steps: ProcessStepItem[] = [
			{ id: "s1", when: "", who: "経理", action: "作業開始" },
			{ id: "s2", when: "", who: "販売", action: "売上確認", parallel: "p1" },
			{ id: "s3", when: "", who: "購買", action: "仕入確認", parallel: "p1" },
			{ id: "s4", when: "", who: "経理", action: "結果集約" },
		];

		const result = taskProcessStepsToMermaidFlow(steps, {
			taskId: "BT-AR-0003",
		});

		expect(result.warnings).toHaveLength(0);
		expect(result.mermaidCode).toContain("STEP_s1 --> PAR_SPLIT_1");
		expect(result.mermaidCode).toContain("PAR_SPLIT_1 --> STEP_s2");
		expect(result.mermaidCode).toContain("PAR_SPLIT_1 --> STEP_s3");
		expect(result.mermaidCode).toContain("STEP_s2 --> PAR_JOIN_1");
		expect(result.mermaidCode).toContain("STEP_s3 --> PAR_JOIN_1");
		expect(result.mermaidCode).toContain("PAR_JOIN_1 --> STEP_s4");
	});

	it("exception.to が不正なら warning を返す", () => {
		const steps: ProcessStepItem[] = [
			{
				id: "s1",
				when: "",
				who: "経理",
				action: "生成処理",
				exception: { condition: "生成失敗", to: "s9" },
			},
		];

		const result = taskProcessStepsToMermaidFlow(steps, {
			taskId: "BT-AR-0004",
		});

		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.warnings.join("\n")).toContain("exception.to");
	});
});
