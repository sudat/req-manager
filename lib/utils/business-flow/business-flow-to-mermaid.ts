import type { Task } from "@/lib/domain";

export type MermaidFlowResult = {
	mermaidCode: string;
	warnings: string[];
};

function sanitizeMermaidId(value: string): string {
	const sanitized = value.replace(/[^a-zA-Z0-9_]/g, "_");
	if (!sanitized) return "task";
	if (/^[0-9]/.test(sanitized)) return `task_${sanitized}`;
	return sanitized;
}

function escapeLabel(value: string): string {
	return value.replace(/"/g, '\\"').replace(/\n/g, "<br/>");
}

function escapeEdgeLabel(value: string): string {
	return value.replace(/\|/g, "/").replace(/\n/g, " ");
}

function buildTaskLabel(task: Task): string {
	return `${task.id}\n${task.name || "（名称未設定）"}`;
}

export function businessTasksToMermaidFlow(
	tasks: Task[],
	businessArea: string
): MermaidFlowResult {
	const warnings: string[] = [];
	const lines: string[] = ["flowchart TD"];
	const edges = new Set<string>();
	const sortedTasks = [...tasks].sort(
		(a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
	);

	const START_NODE_ID = "START";
	const END_NODE_ID = "END";
	lines.push(`  ${START_NODE_ID}(["開始<br/>${escapeLabel(businessArea)}"])`);
	lines.push(`  ${END_NODE_ID}(["終了"])`);

	const taskIdToNodeId = new Map<string, string>();
	const incomingEdgeCount = new Map<string, number>();
	const outgoingEdgeCount = new Map<string, number>();

	for (const task of sortedTasks) {
		if (taskIdToNodeId.has(task.id)) {
			warnings.push(
				`task id "${task.id}" が重複しているため、後続レコードを全体フローから除外しました。`
			);
			continue;
		}
		const nodeId = `TASK_${sanitizeMermaidId(task.id)}`;
		taskIdToNodeId.set(task.id, nodeId);
		incomingEdgeCount.set(task.id, 0);
		outgoingEdgeCount.set(task.id, 0);
		lines.push(`  ${nodeId}["${escapeLabel(buildTaskLabel(task))}"]`);
	}

	const addEdge = (from: string, to: string, label?: string) => {
		const normalizedLabel = label?.trim();
		const edgeLine = normalizedLabel
			? `  ${from} -->|${escapeEdgeLabel(normalizedLabel)}| ${to}`
			: `  ${from} --> ${to}`;
		edges.add(edgeLine);
	};

	if (taskIdToNodeId.size === 0) {
		addEdge(START_NODE_ID, END_NODE_ID);
		lines.push(...edges);
		return { mermaidCode: lines.join("\n"), warnings };
	}

	for (const task of sortedTasks) {
		const targetNodeId = taskIdToNodeId.get(task.id);
		if (!targetNodeId) continue;

		const uniqueTriggerIds = [...new Set((task.triggerTaskIds ?? []).map((id) => id.trim()).filter(Boolean))];
		const edgeLabel = task.triggerDescription?.trim() || undefined;

		if (uniqueTriggerIds.length === 0) {
			addEdge(START_NODE_ID, targetNodeId, edgeLabel);
			incomingEdgeCount.set(task.id, (incomingEdgeCount.get(task.id) ?? 0) + 1);
			continue;
		}

		let hasLinkedTrigger = false;
		for (const triggerTaskId of uniqueTriggerIds) {
			if (triggerTaskId === task.id) {
				warnings.push(`task "${task.id}" が自分自身を triggerTaskIds に持っています。`);
				continue;
			}

			const sourceNodeId = taskIdToNodeId.get(triggerTaskId);
			if (!sourceNodeId) {
				warnings.push(
					`task "${task.id}" の triggerTaskId "${triggerTaskId}" が同一業務領域内に見つかりません。`
				);
				continue;
			}

			addEdge(sourceNodeId, targetNodeId, edgeLabel);
			hasLinkedTrigger = true;
			incomingEdgeCount.set(task.id, (incomingEdgeCount.get(task.id) ?? 0) + 1);
			outgoingEdgeCount.set(
				triggerTaskId,
				(outgoingEdgeCount.get(triggerTaskId) ?? 0) + 1
			);
		}

		if (!hasLinkedTrigger) {
			warnings.push(
				`task "${task.id}" は triggerTaskIds を持ちますが有効な接続先がありません。孤立ノードとして表示します。`
			);
		}
	}

	for (const task of sortedTasks) {
		const nodeId = taskIdToNodeId.get(task.id);
		if (!nodeId) continue;
		if ((outgoingEdgeCount.get(task.id) ?? 0) === 0) {
			addEdge(nodeId, END_NODE_ID);
		}
	}

	lines.push(...edges);
	return {
		mermaidCode: lines.join("\n"),
		warnings,
	};
}
