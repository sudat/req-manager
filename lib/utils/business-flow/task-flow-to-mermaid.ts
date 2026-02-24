import type {
	ProcessFlowBlock,
	ProcessFlowDocument,
	ProcessFlowExit,
	ProcessStepItem,
} from "@/lib/utils/yaml";

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

type StepLabelLike = Pick<NormalizedStep, "stepId" | "when" | "who" | "action">;

function buildStepLabel(step: StepLabelLike): string {
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

type FlowPendingAnchor = {
	nodeId: string;
	label?: string;
};

type FlowNormalizedStep = {
	stepId: string;
	nodeId: string;
	when: string;
	who: string;
	action: string;
	exception?: {
		condition: string;
		to: string;
	};
};

type FlowNormalizedBranch = {
	label: string;
	steps: FlowNormalizedStep[];
	exit: ProcessFlowExit | undefined;
};

type FlowNormalizedBlock =
	| {
			type: "step";
			step: FlowNormalizedStep;
	  }
	| {
			type: "branch";
			decisionNodeId: string;
			decisionLabel: string;
			branches: FlowNormalizedBranch[];
			elseBranch: FlowNormalizedBranch;
	  };

function normalizeFlowDocument(
	flow: ProcessFlowDocument,
	warnings: string[]
): {
	blocks: FlowNormalizedBlock[];
	stepIdToNodeId: Map<string, string>;
	steps: FlowNormalizedStep[];
} {
	const usedStepIds = new Set<string>();
	const usedNodeIds = new Set<string>();
	const stepIdToNodeId = new Map<string, string>();
	const allSteps: FlowNormalizedStep[] = [];
	let generatedIndex = 0;
	let decisionIndex = 0;

	const normalizeStep = (step: ProcessStepItem): FlowNormalizedStep => {
		generatedIndex += 1;
		const generatedId = `ps-${String(generatedIndex).padStart(3, "0")}`;
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

		const exceptionCondition = step.exception?.condition?.trim() ?? "";
		const exceptionTo = step.exception?.to?.trim() ?? "";
		let exception: FlowNormalizedStep["exception"] | undefined;
		if (exceptionCondition || exceptionTo) {
			if (!exceptionCondition || !exceptionTo) {
				warnings.push(
					`step "${stepId}" の exception は condition と to の両方が必要です。`
				);
			} else {
				exception = {
					condition: exceptionCondition,
					to: exceptionTo,
				};
			}
		}

		const normalizedStep: FlowNormalizedStep = {
			stepId,
			nodeId,
			when: step.when.trim(),
			who: step.who.trim(),
			action: step.action.trim(),
			exception,
		};

		stepIdToNodeId.set(stepId, nodeId);
		allSteps.push(normalizedStep);
		return normalizedStep;
	};

	const blocks: FlowNormalizedBlock[] = flow.blocks.map((block) => {
		if (block.type === "step") {
			return {
				type: "step",
				step: normalizeStep(block.step),
			};
		}

		decisionIndex += 1;
		let decisionNodeId = `DECISION_${decisionIndex}`;
		let nodeDuplicateCount = 1;
		while (usedNodeIds.has(decisionNodeId)) {
			nodeDuplicateCount += 1;
			decisionNodeId = `DECISION_${decisionIndex}_${nodeDuplicateCount}`;
		}
		usedNodeIds.add(decisionNodeId);

		const branches = block.branches.map((branch, index) => ({
			label: branch.label.trim() || `条件${index + 1}`,
			steps: branch.steps.map(normalizeStep),
			exit: branch.exit,
		}));
		const rawElse = block.else
			? block.else
			: block.defaultExit
				? { steps: [], exit: block.defaultExit }
				: { steps: [], exit: undefined };
		const elseBranch: FlowNormalizedBranch = {
			label: "それ以外",
			steps: rawElse.steps.map(normalizeStep),
			exit: rawElse.exit,
		};
		if (branches.length === 0) {
			warnings.push(
				`分岐ブロック "${decisionNodeId}" に分岐がないため、次工程へ直進します。`
			);
		}

		return {
			type: "branch",
			decisionNodeId,
			decisionLabel: block.decisionLabel?.trim() || `条件分岐 ${decisionIndex}`,
			branches,
			elseBranch,
		};
	});

	return {
		blocks,
		stepIdToNodeId,
		steps: allSteps,
	};
}

function dedupePendingAnchors(anchors: FlowPendingAnchor[]): FlowPendingAnchor[] {
	const unique = new Map<string, FlowPendingAnchor>();
	for (const anchor of anchors) {
		const key = `${anchor.nodeId}::${anchor.label ?? ""}`;
		if (!unique.has(key)) {
			unique.set(key, anchor);
		}
	}
	return [...unique.values()];
}

function hasMeaningfulBlock(block: ProcessFlowBlock): boolean {
	if (block.type === "step") {
		return hasStepContent(block.step);
	}
	return Boolean(
		block.decisionLabel?.trim() ||
			block.branches.length > 0 ||
			block.branches.some((branch) => branch.steps.some(hasStepContent)) ||
			block.else?.steps.some(hasStepContent) ||
			block.else?.exit ||
			block.defaultExit
	);
}

export function taskProcessFlowToMermaidFlow(
	flow: ProcessFlowDocument,
	taskMeta: TaskFlowMeta
): MermaidFlowResult {
	const warnings: string[] = [];
	const visibleBlocks = flow.blocks.filter(hasMeaningfulBlock);
	const normalized = normalizeFlowDocument(
		{
			version: 2,
			blocks: visibleBlocks,
		},
		warnings
	);

	const lines: string[] = ["flowchart TD"];
	const edges = new Set<string>();

	const flowTitle = taskMeta.taskName
		? `${taskMeta.taskId}: ${taskMeta.taskName}`
		: taskMeta.taskId;
	lines.push(`  ${START_NODE_ID}(["開始<br/>${escapeLabel(flowTitle)}"])`);
	lines.push(`  ${END_NODE_ID}(["終了"])`);

	for (const block of normalized.blocks) {
		if (block.type === "step") {
			lines.push(`  ${block.step.nodeId}["${escapeLabel(buildStepLabel(block.step))}"]`);
			continue;
		}
		lines.push(
			`  ${block.decisionNodeId}{"${escapeLabel(block.decisionLabel || "条件分岐")}"}`
		);
		for (const branch of block.branches) {
			for (const step of branch.steps) {
				lines.push(`  ${step.nodeId}["${escapeLabel(buildStepLabel(step))}"]`);
			}
		}
		for (const step of block.elseBranch.steps) {
			lines.push(`  ${step.nodeId}["${escapeLabel(buildStepLabel(step))}"]`);
		}
	}

	const addEdge = (from: string, to: string, label?: string) => {
		const normalizedLabel = label?.trim();
		const edgeLine = normalizedLabel
			? `  ${from} -->|${escapeEdgeLabel(normalizedLabel)}| ${to}`
			: `  ${from} --> ${to}`;
		edges.add(edgeLine);
	};

	const resolveExit = (
		exit: ProcessFlowExit | undefined,
		fromNodeId: string,
		label: string | undefined,
		nextAnchors: FlowPendingAnchor[]
	) => {
		const exitType = exit?.type ?? "next";
		if (exitType === "next") {
			nextAnchors.push({ nodeId: fromNodeId, label });
			return;
		}
		if (exitType === "end") {
			addEdge(fromNodeId, END_NODE_ID, label);
			return;
		}
		const targetStepId = exit?.to?.trim() ?? "";
		if (!targetStepId) {
			warnings.push("指定ステップへの遷移で to が未設定です。次工程へ合流します。");
			nextAnchors.push({ nodeId: fromNodeId, label });
			return;
		}
		const targetNodeId = normalized.stepIdToNodeId.get(targetStepId);
		if (!targetNodeId) {
			warnings.push(`分岐出口の遷移先 "${targetStepId}" が見つかりません。`);
			nextAnchors.push({ nodeId: fromNodeId, label });
			return;
		}
		addEdge(fromNodeId, targetNodeId, label);
	};

	if (normalized.blocks.length === 0) {
		addEdge(START_NODE_ID, END_NODE_ID);
		lines.push(...edges);
		return {
			mermaidCode: lines.join("\n"),
			warnings,
		};
	}

	let pendingAnchors: FlowPendingAnchor[] = [{ nodeId: START_NODE_ID }];

	for (const block of normalized.blocks) {
		if (block.type === "step") {
			for (const anchor of pendingAnchors) {
				addEdge(anchor.nodeId, block.step.nodeId, anchor.label);
			}
			pendingAnchors = [{ nodeId: block.step.nodeId }];
			continue;
		}

		for (const anchor of pendingAnchors) {
			addEdge(anchor.nodeId, block.decisionNodeId, anchor.label);
		}

		const nextAnchors: FlowPendingAnchor[] = [];
		for (const branch of block.branches) {
			const label = branch.label.trim() || undefined;
			if (branch.steps.length === 0) {
				resolveExit(branch.exit, block.decisionNodeId, label, nextAnchors);
				continue;
			}

			const [first, ...rest] = branch.steps;
			addEdge(block.decisionNodeId, first.nodeId, label);
			let previousNodeId = first.nodeId;
			for (const step of rest) {
				addEdge(previousNodeId, step.nodeId);
				previousNodeId = step.nodeId;
			}
			resolveExit(branch.exit, previousNodeId, undefined, nextAnchors);
		}

		if (block.elseBranch.steps.length === 0) {
			resolveExit(
				block.elseBranch.exit,
				block.decisionNodeId,
				block.elseBranch.label,
				nextAnchors
			);
		} else {
			const [first, ...rest] = block.elseBranch.steps;
			addEdge(block.decisionNodeId, first.nodeId, block.elseBranch.label);
			let previousNodeId = first.nodeId;
			for (const step of rest) {
				addEdge(previousNodeId, step.nodeId);
				previousNodeId = step.nodeId;
			}
			resolveExit(block.elseBranch.exit, previousNodeId, undefined, nextAnchors);
		}
		pendingAnchors = dedupePendingAnchors(nextAnchors);
	}

	for (const anchor of pendingAnchors) {
		addEdge(anchor.nodeId, END_NODE_ID, anchor.label);
	}

	for (const step of normalized.steps) {
		const exception = step.exception;
		if (!exception) continue;
		const destinationNodeId = normalized.stepIdToNodeId.get(exception.to);
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
