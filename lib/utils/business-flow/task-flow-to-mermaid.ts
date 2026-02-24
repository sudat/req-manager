import type { ProcessStepItem } from "@/lib/utils/yaml";

export type MermaidFlowResult = {
	mermaidCode: string;
	warnings: string[];
};

type TaskFlowMeta = {
	taskId: string;
	taskName?: string;
};

type NormalizedStep = {
	stepId: string;
	nodeId: string;
	when: string;
	who: string;
	action: string;
	condition: string;
	parallel: string;
	exception?: {
		condition: string;
		to: string;
	};
};

const START_NODE_ID = "START";
const END_NODE_ID = "END";

function hasStepContent(step: ProcessStepItem): boolean {
	return Boolean(
		step.id?.trim() ||
			step.when.trim() ||
			step.who.trim() ||
			step.action.trim() ||
			step.condition?.trim() ||
			step.parallel?.trim() ||
			step.exception?.condition?.trim() ||
			step.exception?.to?.trim()
	);
}

function sanitizeMermaidId(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "_");
	if (!sanitized) return "step";
	if (/^[0-9]/.test(sanitized)) return `step_${sanitized}`;
	return sanitized;
}

function escapeLabel(value: string): string {
	return value.replace(/"/g, '\\"').replace(/\n/g, "<br/>");
}

function escapeEdgeLabel(value: string): string {
	return value.replace(/\|/g, "/").replace(/\n/g, " ");
}

function deduplicate<T>(values: T[]): T[] {
	return [...new Set(values)];
}

function normalizeSteps(steps: ProcessStepItem[], warnings: string[]): NormalizedStep[] {
	const usedStepIds = new Set<string>();
	const usedNodeIds = new Set<string>();
	const visibleSteps = steps.filter(hasStepContent);

	return visibleSteps.map((step, index) => {
		const generatedId = `ps-${String(index + 1).padStart(3, "0")}`;
		const rawStepId = step.id?.trim() || generatedId;
		let stepId = rawStepId;
		let duplicateCount = 1;
		while (usedStepIds.has(stepId)) {
			duplicateCount += 1;
			stepId = `${rawStepId}-${duplicateCount}`;
		}
		if (stepId !== rawStepId) {
			warnings.push(
				`step id "${rawStepId}" が重複していたため "${stepId}" に自動補正しました。`
			);
		}
		usedStepIds.add(stepId);

		const nodeBase = sanitizeMermaidId(stepId);
		let nodeId = `STEP_${nodeBase}`;
		let nodeDuplicateCount = 1;
		while (usedNodeIds.has(nodeId)) {
			nodeDuplicateCount += 1;
			nodeId = `STEP_${nodeBase}_${nodeDuplicateCount}`;
		}
		usedNodeIds.add(nodeId);

		const condition = step.condition?.trim() ?? "";
		const parallel = step.parallel?.trim() ?? "";
		if (condition && parallel) {
			warnings.push(
				`step "${stepId}" は condition と parallel を同時指定できません。parallel を優先して condition を無視します。`
			);
		}

		const exceptionCondition = step.exception?.condition?.trim() ?? "";
		const exceptionTo = step.exception?.to?.trim() ?? "";
		let exception: NormalizedStep["exception"] | undefined;
		if (exceptionCondition || exceptionTo) {
			if (!exceptionCondition || !exceptionTo) {
				warnings.push(
					`step "${stepId}" の exception は condition と to の両方が必要です。`
				);
			} else {
				exception = { condition: exceptionCondition, to: exceptionTo };
			}
		}

		return {
			stepId,
			nodeId,
			when: step.when.trim(),
			who: step.who.trim(),
			action: step.action.trim(),
			condition: parallel ? "" : condition,
			parallel,
			exception,
		};
	});
}

function buildStepLabel(step: NormalizedStep): string {
	const action = step.action || "（未設定）";
	const details = [`何を: ${action}`];
	if (step.who) details.unshift(`誰が: ${step.who}`);
	if (step.when) details.unshift(`いつ: ${step.when}`);
	return `${step.stepId}\n${details.join("\n")}`;
}

export function taskProcessStepsToMermaidFlow(
	steps: ProcessStepItem[],
	taskMeta: TaskFlowMeta
): MermaidFlowResult {
	const warnings: string[] = [];
	const normalizedSteps = normalizeSteps(steps, warnings);
	const lines: string[] = ["flowchart TD"];
	const edges = new Set<string>();

	const flowTitle = taskMeta.taskName
		? `${taskMeta.taskId}: ${taskMeta.taskName}`
		: taskMeta.taskId;
	lines.push(`  ${START_NODE_ID}(["開始<br/>${escapeLabel(flowTitle)}"])`);
	lines.push(`  ${END_NODE_ID}(["終了"])`);

	for (const step of normalizedSteps) {
		lines.push(`  ${step.nodeId}["${escapeLabel(buildStepLabel(step))}"]`);
	}

	const addEdge = (from: string, to: string, label?: string) => {
		const normalizedLabel = label?.trim();
		const edgeLine = normalizedLabel
			? `  ${from} -->|${escapeEdgeLabel(normalizedLabel)}| ${to}`
			: `  ${from} --> ${to}`;
		edges.add(edgeLine);
	};

	if (normalizedSteps.length === 0) {
		addEdge(START_NODE_ID, END_NODE_ID);
		lines.push(...edges);
		return { mermaidCode: lines.join("\n"), warnings };
	}

	let previousAnchors: string[] = [START_NODE_ID];
	let stepIndex = 0;
	let parallelBlockIndex = 0;

	while (stepIndex < normalizedSteps.length) {
		const current = normalizedSteps[stepIndex];

		if (current.parallel) {
			const parallelGroupId = current.parallel;
			const parallelGroup: NormalizedStep[] = [];
			while (
				stepIndex < normalizedSteps.length &&
				normalizedSteps[stepIndex].parallel === parallelGroupId
			) {
				parallelGroup.push(normalizedSteps[stepIndex]);
				stepIndex += 1;
			}

			parallelBlockIndex += 1;
			const splitNodeId = `PAR_SPLIT_${parallelBlockIndex}`;
			const joinNodeId = `PAR_JOIN_${parallelBlockIndex}`;
			lines.push(`  ${splitNodeId}(["並行開始: ${escapeLabel(parallelGroupId)}"])`);
			lines.push(`  ${joinNodeId}(["並行終了: ${escapeLabel(parallelGroupId)}"])`);

			if (parallelGroup.length === 1) {
				warnings.push(
					`parallel "${parallelGroupId}" は1ステップのみです。並行指定の効果がありません。`
				);
			}

			for (const anchor of previousAnchors) {
				addEdge(anchor, splitNodeId);
			}
			for (const step of parallelGroup) {
				addEdge(splitNodeId, step.nodeId);
				addEdge(step.nodeId, joinNodeId);
			}
			previousAnchors = [joinNodeId];
			continue;
		}

		if (current.condition) {
			for (const anchor of previousAnchors) {
				addEdge(anchor, current.nodeId, current.condition);
			}
			previousAnchors = deduplicate([...previousAnchors, current.nodeId]);
			stepIndex += 1;
			continue;
		}

		for (const anchor of previousAnchors) {
			addEdge(anchor, current.nodeId);
		}
		previousAnchors = [current.nodeId];
		stepIndex += 1;
	}

	for (const anchor of previousAnchors) {
		addEdge(anchor, END_NODE_ID);
	}

	const stepIdToNodeId = new Map(
		normalizedSteps.map((step) => [step.stepId, step.nodeId] as const)
	);
	for (const step of normalizedSteps) {
		const exception = step.exception;
		if (!exception) continue;
		const destinationNodeId = stepIdToNodeId.get(exception.to);
		if (!destinationNodeId) {
			warnings.push(
				`step "${step.stepId}" の exception.to "${exception.to}" が見つかりません。`
			);
			continue;
		}
		addEdge(step.nodeId, destinationNodeId, `例外: ${exception.condition}`);
	}

	lines.push(...edges);
	return {
		mermaidCode: lines.join("\n"),
		warnings,
	};
}
