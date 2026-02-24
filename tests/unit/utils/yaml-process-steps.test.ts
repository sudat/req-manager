import { describe, expect, it } from "bun:test";
import {
	buildYamlProcessSteps,
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
});
