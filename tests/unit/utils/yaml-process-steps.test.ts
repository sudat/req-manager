import { describe, expect, it } from "bun:test";
import {
	buildYamlProcessFlow,
	buildYamlProcessSteps,
	flattenProcessFlowSteps,
	parseYamlProcessFlow,
	parseYamlProcessSteps,
	type ProcessStepItem,
} from "../../../lib/utils/yaml";

describe("parseYamlProcessSteps / buildYamlProcessSteps", () => {
	it("旧フォーマットを後方互換で読める", () => {
		const src = `
- when: 月末
  who: 経理
  action: 締め処理を実行
`.trim();

		const result = parseYamlProcessSteps(src);
		expect(result.error).toBeNull();
		expect(result.value).toEqual([
			{
				id: "",
				when: "月末",
				who: "経理",
				action: "締め処理を実行",
				condition: "",
				parallel: "",
				exception: undefined,
			},
		]);
	});

	it("新フォーマットを読める", () => {
		const src = `
- id: s1
  when: 月末
  who: 経理
  action: 締め処理を実行
  condition: 金額が100万以上の場合
  exception:
    condition: 在庫不足の場合
    to: s9
`.trim();

		const result = parseYamlProcessSteps(src);
		expect(result.error).toBeNull();
		expect(result.value[0]).toEqual({
			id: "s1",
			when: "月末",
			who: "経理",
			action: "締め処理を実行",
			condition: "金額が100万以上の場合",
			parallel: "",
			exception: {
				condition: "在庫不足の場合",
				to: "s9",
			},
		});
	});

	it("新属性を含む配列をYAMLにシリアライズできる", () => {
		const steps: ProcessStepItem[] = [
			{
				id: "s1",
				when: "月末",
				who: "経理",
				action: "締め処理を実行",
				parallel: "p1",
				exception: {
					condition: "生成失敗",
					to: "s9",
				},
			},
		];

		const yaml = buildYamlProcessSteps(steps);
		expect(yaml).toContain("id: s1");
		expect(yaml).toContain("parallel: p1");
		expect(yaml).toContain("exception:");
		expect(yaml).toContain("to: s9");
	});

	it("v2分岐ブロックを読める", () => {
		const src = `
version: 2
blocks:
  - type: step
    step:
      id: s1
      when: 起票時
      who: 担当
      action: 内容を確認する
  - type: branch
    decisionLabel: 承認判定
    branches:
      - label: 承認
        steps:
          - id: s2
            when: 承認後
            who: 課長
            action: 承認する
        exit:
          type: next
      - label: 差戻し
        steps:
          - id: s3
            when: 差戻し後
            who: 担当
            action: 修正する
        exit:
          type: step
          to: s1
    else:
      steps:
        - id: s9
          when: 例外時
          who: 担当
          action: 差戻し理由を記録する
      exit:
        type: end
`.trim();

		const result = parseYamlProcessFlow(src);
		expect(result.error).toBeNull();
		expect(result.value.blocks).toHaveLength(2);
		expect(result.value.blocks[1]).toMatchObject({
			type: "branch",
			decisionLabel: "承認判定",
		});

		const flattened = flattenProcessFlowSteps(result.value);
		expect(flattened.map((step) => step.id)).toEqual(["s1", "s2", "s3", "s9"]);
	});

	it("v2分岐ブロックをYAMLにシリアライズできる", () => {
		const yaml = buildYamlProcessFlow({
			version: 2,
			blocks: [
				{
					type: "branch",
					decisionLabel: "在庫判定",
					branches: [
						{
							label: "在庫あり",
							steps: [{ id: "s1", when: "", who: "担当", action: "出荷する" }],
							exit: { type: "next" },
						},
					],
					else: {
						steps: [{ id: "s2", when: "", who: "担当", action: "保留する" }],
						exit: { type: "end" },
					},
				},
			],
		});

		expect(yaml).toContain("version: 2");
		expect(yaml).toContain("type: branch");
		expect(yaml).toContain("decisionLabel: 在庫判定");
		expect(yaml).toContain("else:");
		expect(yaml).toContain("steps:");
		expect(yaml).toContain("type: end");
	});

	it("旧defaultExitを読み込むとelse.exitへマップされる", () => {
		const src = `
version: 2
blocks:
  - type: branch
    decisionLabel: 旧形式
    branches:
      - label: 条件
        steps:
          - id: s1
            when: ""
            who: 担当
            action: 実行
    defaultExit:
      type: end
`.trim();

		const result = parseYamlProcessFlow(src);
		expect(result.error).toBeNull();
		expect(result.value.blocks[0]).toMatchObject({
			type: "branch",
			else: {
				exit: { type: "end" },
			},
		});
	});
});
