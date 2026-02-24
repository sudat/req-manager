"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { GitBranchPlus, GripVertical, Plus, Split, Trash2 } from "lucide-react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	buildYamlProcessFlow,
	parseYamlProcessFlow,
	type ProcessFlowBlock,
	type ProcessFlowBranch,
	type ProcessFlowDocument,
	type ProcessFlowElse,
	type ProcessFlowExit,
	type ProcessFlowExitType,
	type ProcessStepItem,
} from "@/lib/utils/yaml";

type ProcessStepsFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	helperText?: string;
	whenPlaceholder?: string;
	whoPlaceholder?: string;
	actionPlaceholder?: string;
};

type StepOption = {
	id: string;
	label: string;
};

const DEFAULT_STEP: ProcessStepItem = {
	id: "",
	when: "",
	who: "",
	action: "",
	condition: "",
	parallel: "",
};

function createEmptyStep(): ProcessStepItem {
	return { ...DEFAULT_STEP };
}

function createEmptyBranch(): ProcessFlowBranch {
	return {
		label: "",
		steps: [createEmptyStep()],
		exit: { type: "next" },
	};
}

function createEmptyElse(): ProcessFlowElse {
	return {
		steps: [],
		exit: { type: "next" },
	};
}

function createStepBlock(): ProcessFlowBlock {
	return {
		type: "step",
		step: createEmptyStep(),
	};
}

function createBranchBlock(): ProcessFlowBlock {
	return {
		type: "branch",
		decisionLabel: "",
		branches: [createEmptyBranch()],
		else: createEmptyElse(),
	};
}

type DragHandleProps = {
	attributes: unknown;
	listeners: unknown;
};

type SortableItemProps = {
	id: string;
	children: (dragHandleProps: DragHandleProps) => ReactNode;
};

function SortableItem({ id, children }: SortableItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.65 : 1,
	};

	return (
		<div ref={setNodeRef} style={style}>
			{children({
				attributes,
				listeners: listeners ?? {},
			})}
		</div>
	);
}

function withAutoStepIds(blocks: ProcessFlowBlock[]): ProcessFlowBlock[] {
	const usedIds = new Set<string>();
	let sequence = 1;

	const nextId = () => {
		while (usedIds.has(`s${sequence}`)) {
			sequence += 1;
		}
		const id = `s${sequence}`;
		usedIds.add(id);
		sequence += 1;
		return id;
	};

	const assignStepId = (step: ProcessStepItem): ProcessStepItem => {
		const trimmed = step.id?.trim() ?? "";
		if (trimmed && !usedIds.has(trimmed)) {
			usedIds.add(trimmed);
			return { ...step, id: trimmed };
		}
		return { ...step, id: nextId() };
	};

	return blocks.map((block) => {
		if (block.type === "step") {
			return {
				type: "step",
				step: assignStepId(block.step),
			};
		}
		return {
			type: "branch",
			decisionLabel: block.decisionLabel?.trim() ?? "",
			branches: block.branches.map((branch) => ({
				label: branch.label,
				steps: branch.steps.map(assignStepId),
				exit: branch.exit,
			})),
			else: {
				steps: (block.else?.steps ?? []).map(assignStepId),
				exit: block.else?.exit ?? block.defaultExit,
			},
		};
	});
}

function collectStepOptions(blocks: ProcessFlowBlock[]): StepOption[] {
	const options: StepOption[] = [];
	for (const block of blocks) {
		if (block.type === "step") {
			const id = block.step.id?.trim();
			if (!id) continue;
			options.push({
				id,
				label: `${id} / ${block.step.action.trim() || "（アクション未入力）"}`,
			});
			continue;
		}
		for (const branch of block.branches) {
			for (const step of branch.steps) {
				const id = step.id?.trim();
				if (!id) continue;
				options.push({
					id,
					label: `${id} / ${step.action.trim() || "（アクション未入力）"}`,
				});
			}
		}
		for (const step of block.else?.steps ?? []) {
			const id = step.id?.trim();
			if (!id) continue;
			options.push({
				id,
				label: `${id} / ${step.action.trim() || "（アクション未入力）"}`,
			});
		}
	}
	return options;
}

function toFlowDocument(blocks: ProcessFlowBlock[]): ProcessFlowDocument {
	return {
		version: 2,
		blocks,
	};
}

type ExitEditorProps = {
	value: ProcessFlowExit | undefined;
	onChange: (value: ProcessFlowExit) => void;
	stepOptions: StepOption[];
	label: string;
	description?: string;
};

const EXIT_VALUE_NEXT = "__next__";
const EXIT_VALUE_END = "__end__";
const EXIT_VALUE_STEP_PREFIX = "step:";

function ExitEditor({
	value,
	onChange,
	stepOptions,
	label,
	description,
}: ExitEditorProps) {
	const resolvedValue = (() => {
		if (!value || value.type === "next") return EXIT_VALUE_NEXT;
		if (value.type === "end") return EXIT_VALUE_END;
		const target = value.to?.trim() ?? "";
		if (target) return `${EXIT_VALUE_STEP_PREFIX}${target}`;
		const firstStepId = stepOptions[0]?.id ?? "";
		return firstStepId ? `${EXIT_VALUE_STEP_PREFIX}${firstStepId}` : EXIT_VALUE_NEXT;
	})();

	const helperText = (() => {
		if (resolvedValue === EXIT_VALUE_NEXT) return "分岐ブロックの次に進みます";
		if (resolvedValue === EXIT_VALUE_END) return "この分岐で業務フローを終了します";
		if (resolvedValue.startsWith(EXIT_VALUE_STEP_PREFIX))
			return "指定ステップへ遷移します";
		return "";
	})();

	return (
		<div className="space-y-2">
			<div className="space-y-1">
				<p className="text-[12px] font-medium text-slate-700">{label}</p>
				{description && <p className="text-[11px] text-slate-500">{description}</p>}
			</div>
			<Select
				value={resolvedValue}
				onValueChange={(nextValue) => {
					if (nextValue === EXIT_VALUE_NEXT) {
						onChange({ type: "next" });
						return;
					}
					if (nextValue === EXIT_VALUE_END) {
						onChange({ type: "end" });
						return;
					}
					if (nextValue.startsWith(EXIT_VALUE_STEP_PREFIX)) {
						const to = nextValue.slice(EXIT_VALUE_STEP_PREFIX.length).trim();
						onChange({
							type: "step",
							to: to || stepOptions[0]?.id || "",
						});
						return;
					}
					const resolvedType = nextValue as ProcessFlowExitType;
					onChange({ type: resolvedType });
				}}
			>
				<SelectTrigger className="w-full">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={EXIT_VALUE_NEXT}>次の工程に合流</SelectItem>
					<SelectItem value={EXIT_VALUE_END}>業務を終了</SelectItem>
					{stepOptions.length > 0 && (
						<>
							<SelectSeparator />
							<SelectGroup>
								<SelectLabel>指定ステップへ遷移</SelectLabel>
								{stepOptions.map((option) => (
									<SelectItem
										key={option.id}
										value={`${EXIT_VALUE_STEP_PREFIX}${option.id}`}
									>
										{option.label}
									</SelectItem>
								))}
							</SelectGroup>
						</>
					)}
				</SelectContent>
			</Select>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
		</div>
	);
}

type StepEditorProps = {
	step: ProcessStepItem;
	onChange: (step: ProcessStepItem) => void;
	onRemove: () => void;
	dragHandleProps: DragHandleProps;
	whenPlaceholder: string;
	whoPlaceholder: string;
	actionPlaceholder: string;
	stepOptions: StepOption[];
};

function StepEditor({
	step,
	onChange,
	onRemove,
	dragHandleProps,
	whenPlaceholder,
	whoPlaceholder,
	actionPlaceholder,
	stepOptions,
}: StepEditorProps) {
	const stepId = step.id?.trim() ?? "";
	const exceptionTarget = step.exception?.to?.trim() ?? "";
	const exceptionCondition = step.exception?.condition?.trim() ?? "";
	const filteredOptions = stepOptions.filter((option) => option.id !== stepId);
	const selectedExceptionTarget =
		filteredOptions.find((option) => option.id === exceptionTarget) ?? null;
	const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
	const [draftCondition, setDraftCondition] = useState("");
	const [draftTarget, setDraftTarget] = useState("");

	const openExceptionDialog = () => {
		setDraftCondition(exceptionCondition);
		setDraftTarget(exceptionTarget);
		setExceptionDialogOpen(true);
	};

	const clearException = () => {
		onChange({
			...step,
			exception: undefined,
		});
	};

	const applyException = () => {
		const nextCondition = draftCondition.trim();
		const nextTarget = draftTarget.trim();
		if (!nextCondition && !nextTarget) {
			clearException();
			setExceptionDialogOpen(false);
			return;
		}
		onChange({
			...step,
			exception: {
				condition: nextCondition,
				to: nextTarget,
			},
		});
		setExceptionDialogOpen(false);
	};

	return (
		<div className="py-1 space-y-2">
			<div className="grid items-center gap-2 md:grid-cols-[52px_118px_104px_minmax(220px,1fr)_120px_74px]">
				<Badge
					variant="outline"
					className="w-fit text-[11px] font-mono justify-self-start"
				>
					{stepId || "s?"}
				</Badge>
				<Input
					value={step.when}
					onChange={(event) =>
						onChange({
							...step,
							when: event.target.value,
						})
					}
					placeholder={whenPlaceholder}
					className="text-[13px]"
				/>
				<Input
					value={step.who}
					onChange={(event) =>
						onChange({
							...step,
							who: event.target.value,
						})
					}
					placeholder={whoPlaceholder}
					className="text-[13px]"
				/>
				<Input
					value={step.action}
					onChange={(event) =>
						onChange({
							...step,
							action: event.target.value,
						})
					}
					placeholder={actionPlaceholder}
					className="text-[13px]"
				/>
					<Button
						type="button"
						variant="outline"
						className="h-9 text-[12px] px-2"
						onClick={openExceptionDialog}
					>
						{step.exception ? "例外設定を編集" : "例外設定を追加"}
					</Button>
					<div className="flex items-center justify-end gap-1">
						<button
							type="button"
							className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-grab active:cursor-grabbing"
							aria-label="ドラッグして並び替え"
							{...((dragHandleProps.attributes ?? {}) as object)}
							{...((dragHandleProps.listeners ?? {}) as object)}
						>
							<GripVertical className="h-3.5 w-3.5" />
						</button>
						<Button
							type="button"
							size="icon"
							variant="outline"
							className="h-8 w-8"
							onClick={onRemove}
							aria-label="ステップを削除"
						>
						<Trash2 className="h-3.5 w-3.5" />
					</Button>
				</div>
			</div>

			{step.exception && (
				<div className="flex flex-wrap items-center gap-2">
					<Badge variant="secondary" className="text-[11px]">
						例外ラベル: {exceptionCondition || "未設定"}
					</Badge>
					<Badge variant="secondary" className="text-[11px]">
						遷移先: {selectedExceptionTarget?.label ?? "未選択"}
					</Badge>
					<Button
						type="button"
						variant="ghost"
						className="h-7 px-2 text-[11px]"
						onClick={clearException}
					>
						例外をクリア
					</Button>
				</div>
			)}

			<Dialog open={exceptionDialogOpen} onOpenChange={setExceptionDialogOpen}>
				<DialogContent className="max-w-[560px]">
					<DialogHeader>
						<DialogTitle className="text-[16px]">例外遷移設定</DialogTitle>
						<DialogDescription>
							例外ラベルと遷移先ステップを選択します。
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3">
						<Input
							value={draftCondition}
							onChange={(event) => setDraftCondition(event.target.value)}
							placeholder="例外ラベル（例: 与信NG）"
							className="text-[13px]"
						/>

						<div className="space-y-2">
							<p className="text-[12px] font-medium text-slate-700">
								遷移先ステップ
							</p>
							<div className="max-h-[220px] overflow-y-auto rounded-md border border-slate-200 p-2 space-y-1">
								<button
									type="button"
									className={`w-full rounded-md border px-3 py-2 text-left text-[12px] transition-colors ${
										!draftTarget
											? "border-brand-400 bg-brand-50 text-brand-900"
											: "border-slate-200 text-slate-700 hover:bg-slate-50"
									}`}
									onClick={() => setDraftTarget("")}
								>
									未選択
								</button>
								{filteredOptions.map((option) => (
									<button
										key={option.id}
										type="button"
										className={`w-full rounded-md border px-3 py-2 text-left text-[12px] transition-colors ${
											draftTarget === option.id
												? "border-brand-400 bg-brand-50 text-brand-900"
												: "border-slate-200 text-slate-700 hover:bg-slate-50"
										}`}
										onClick={() => setDraftTarget(option.id)}
									>
										{option.label}
									</button>
								))}
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setExceptionDialogOpen(false)}
						>
							キャンセル
						</Button>
						<Button type="button" onClick={applyException}>
							適用
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export function ProcessStepsField({
	label,
	value,
	onChange,
	helperText,
	whenPlaceholder = "いつ（タイミング）",
	whoPlaceholder = "誰が（ロール）",
	actionPlaceholder = "何をするか",
}: ProcessStepsFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlProcessFlow(value), [value]);
	const [blocks, setBlocks] = useState<ProcessFlowBlock[]>(() =>
		withAutoStepIds(
			parsed.value.blocks.length > 0 ? parsed.value.blocks : [createStepBlock()]
		)
	);

	const stepOptions = useMemo(() => collectStepOptions(blocks), [blocks]);
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);
	const topLevelItemIds = useMemo(
		() => blocks.map((_, index) => `block-${index}`),
		[blocks]
	);

	const commit = (nextBlocks: ProcessFlowBlock[]) => {
		const withIds = withAutoStepIds(nextBlocks);
		setBlocks(withIds);
		onChange(buildYamlProcessFlow(toFlowDocument(withIds)));
	};

	const updateBlock = (blockIndex: number, nextBlock: ProcessFlowBlock) => {
		const next = blocks.map((block, index) =>
			index === blockIndex ? nextBlock : block
		);
		commit(next);
	};

	const removeBlock = (blockIndex: number) => {
		const next = blocks.filter((_, index) => index !== blockIndex);
		commit(next.length > 0 ? next : [createStepBlock()]);
	};

	const handleTopLevelDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = topLevelItemIds.findIndex((id) => id === String(active.id));
		const newIndex = topLevelItemIds.findIndex((id) => id === String(over.id));
		if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
		commit(arrayMove(blocks, oldIndex, newIndex));
	};

	const addStepBlock = () => {
		commit([...blocks, createStepBlock()]);
	};

	const addBranchBlock = () => {
		commit([...blocks, createBranchBlock()]);
	};

	return (
		<div className="space-y-3">
			<Label className="text-[14px] font-bold text-slate-900 border-l-4 border-primary pl-3 -ml-3">
				{label}
			</Label>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			<p className="text-[11px] text-slate-500">
				分岐ブロックでは「条件」と「それ以外」を同じ単位として編集できます。
			</p>

			<DndContext
				sensors={sensors}
				collisionDetection={closestCenter}
				onDragEnd={handleTopLevelDragEnd}
			>
				<SortableContext
					items={topLevelItemIds}
					strategy={verticalListSortingStrategy}
				>
					<div className="space-y-3">
						{blocks.map((block, blockIndex) => {
							const topLevelId = topLevelItemIds[blockIndex];

							if (block.type === "step") {
								return (
									<SortableItem key={topLevelId} id={topLevelId}>
										{(dragHandleProps) => (
											<StepEditor
												step={block.step}
												onChange={(nextStep) =>
													updateBlock(blockIndex, {
														type: "step",
														step: nextStep,
													})
												}
												onRemove={() => removeBlock(blockIndex)}
												dragHandleProps={dragHandleProps}
												whenPlaceholder={whenPlaceholder}
												whoPlaceholder={whoPlaceholder}
												actionPlaceholder={actionPlaceholder}
												stepOptions={stepOptions}
											/>
										)}
									</SortableItem>
								);
							}

							const updateBranchBlock = (nextBlock: ProcessFlowBlock) => {
								updateBlock(blockIndex, nextBlock);
							};
							const branchItemIds = block.branches.map(
								(_, branchIndex) => `block-${blockIndex}-branch-${branchIndex}`
							);
							const handleBranchDragEnd = (event: DragEndEvent) => {
								const { active, over } = event;
								if (!over || active.id === over.id) return;
								const oldIndex = branchItemIds.findIndex(
									(id) => id === String(active.id)
								);
								const newIndex = branchItemIds.findIndex(
									(id) => id === String(over.id)
								);
								if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;
								updateBranchBlock({
									...block,
									branches: arrayMove(block.branches, oldIndex, newIndex),
								});
							};

							return (
								<SortableItem key={topLevelId} id={topLevelId}>
									{(blockDragHandleProps) => (
										<div className="space-y-3 border-l-2 border-brand-300 pl-3">
											<div className="flex items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<Badge variant="secondary">
														<Split className="mr-1 h-3 w-3" />
														条件分岐
													</Badge>
													<button
														type="button"
														className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-grab active:cursor-grabbing"
														aria-label="分岐ブロックをドラッグして並び替え"
														{...((blockDragHandleProps.attributes ?? {}) as object)}
														{...((blockDragHandleProps.listeners ?? {}) as object)}
													>
														<GripVertical className="h-3.5 w-3.5" />
													</button>
												</div>
												<Button
													type="button"
													variant="outline"
													className="h-7 px-2 text-[11px]"
													onClick={() => removeBlock(blockIndex)}
												>
													削除
												</Button>
											</div>

											<Input
												value={block.decisionLabel ?? ""}
												onChange={(event) =>
													updateBranchBlock({
														...block,
														decisionLabel: event.target.value,
													})
												}
												placeholder="判断ノード名（例: 承認判定）"
												className="text-[13px]"
											/>

											<DndContext
												sensors={sensors}
												collisionDetection={closestCenter}
												onDragEnd={handleBranchDragEnd}
											>
												<SortableContext
													items={branchItemIds}
													strategy={verticalListSortingStrategy}
												>
													<div className="space-y-4">
														{block.branches.map((branch, branchIndex) => {
															const branchItemId = branchItemIds[branchIndex];
															const updateBranch = (nextBranch: ProcessFlowBranch) => {
																const nextBranches = block.branches.map(
																	(current, index) =>
																		index === branchIndex ? nextBranch : current
																);
																updateBranchBlock({
																	...block,
																	branches: nextBranches,
																});
															};
															const branchStepItemIds = branch.steps.map(
																(step, stepIndex) =>
																	`block-${blockIndex}-branch-${branchIndex}-step-${step.id?.trim() || stepIndex}`
															);
															const handleBranchStepDragEnd = (event: DragEndEvent) => {
																const { active, over } = event;
																if (!over || active.id === over.id) return;
																const oldIndex = branchStepItemIds.findIndex(
																	(id) => id === String(active.id)
																);
																const newIndex = branchStepItemIds.findIndex(
																	(id) => id === String(over.id)
																);
																if (
																	oldIndex < 0 ||
																	newIndex < 0 ||
																	oldIndex === newIndex
																)
																	return;
																updateBranch({
																	...branch,
																	steps: arrayMove(branch.steps, oldIndex, newIndex),
																});
															};

															return (
																<SortableItem key={branchItemId} id={branchItemId}>
																	{(branchDragHandleProps) => (
																		<div className="grid gap-2 md:grid-cols-[110px_minmax(0,1fr)]">
																			<div className="flex items-start gap-1 pt-1">
																				<Badge variant="outline" className="text-[11px]">
																					条件 {branchIndex + 1}
																				</Badge>
																				<button
																					type="button"
																					className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-grab active:cursor-grabbing"
																					aria-label="条件をドラッグして並び替え"
																					{...((branchDragHandleProps.attributes ?? {}) as object)}
																					{...((branchDragHandleProps.listeners ?? {}) as object)}
																				>
																					<GripVertical className="h-3.5 w-3.5" />
																				</button>
																				<Button
																					type="button"
																					size="icon"
																					variant="outline"
																					className="h-7 w-7"
																					onClick={() => {
																						const nextBranches = block.branches.filter(
																							(_, index) => index !== branchIndex
																						);
																						updateBranchBlock({
																							...block,
																							branches:
																								nextBranches.length > 0
																									? nextBranches
																									: [createEmptyBranch()],
																						});
																					}}
																				>
																					<Trash2 className="h-3.5 w-3.5" />
																				</Button>
																			</div>

																			<div className="space-y-3 border-l border-slate-200 pl-3">
																				<Input
																					value={branch.label}
																					onChange={(event) =>
																						updateBranch({
																							...branch,
																							label: event.target.value,
																						})
																					}
																					placeholder="条件（文言）（例: 承認された場合）"
																					className="text-[13px]"
																				/>

																				<DndContext
																					sensors={sensors}
																					collisionDetection={closestCenter}
																					onDragEnd={handleBranchStepDragEnd}
																				>
																					<SortableContext
																						items={branchStepItemIds}
																						strategy={verticalListSortingStrategy}
																					>
																						<div className="space-y-1">
																							{branch.steps.map((step, stepIndex) => {
																								const updateBranchStep = (
																									nextStep: ProcessStepItem
																								) => {
																									const nextSteps = branch.steps.map(
																										(current, index) =>
																											index === stepIndex
																												? nextStep
																												: current
																									);
																									updateBranch({
																										...branch,
																										steps: nextSteps,
																									});
																								};
																								const branchStepItemId =
																									branchStepItemIds[stepIndex];
																								return (
																									<SortableItem
																										key={branchStepItemId}
																										id={branchStepItemId}
																									>
																										{(stepDragHandleProps) => (
																											<StepEditor
																												step={step}
																												onChange={updateBranchStep}
																												onRemove={() => {
																													const nextSteps =
																														branch.steps.filter(
																															(_, index) =>
																																index !== stepIndex
																														);
																													updateBranch({
																														...branch,
																														steps:
																															nextSteps.length > 0
																																? nextSteps
																																: [createEmptyStep()],
																													});
																												}}
																												dragHandleProps={
																													stepDragHandleProps
																												}
																												whenPlaceholder={
																													whenPlaceholder
																												}
																												whoPlaceholder={whoPlaceholder}
																												actionPlaceholder={
																													actionPlaceholder
																												}
																												stepOptions={stepOptions}
																											/>
																										)}
																									</SortableItem>
																								);
																							})}
																						</div>
																					</SortableContext>
																				</DndContext>

																				<div className="flex justify-start">
																					<Button
																						type="button"
																						variant="outline"
																						className="h-7 text-[11px]"
																						onClick={() =>
																							updateBranch({
																								...branch,
																								steps: [...branch.steps, createEmptyStep()],
																							})
																						}
																					>
																						<Plus className="mr-1 h-3 w-3" />
																						条件内ステップを追加
																					</Button>
																				</div>

																				<ExitEditor
																					value={branch.exit}
																					onChange={(nextExit) =>
																						updateBranch({
																							...branch,
																							exit: nextExit,
																						})
																					}
																					stepOptions={stepOptions}
																					label="出口（合流先）"
																				/>
																			</div>
																		</div>
																	)}
																</SortableItem>
															);
														})}
													</div>
												</SortableContext>
											</DndContext>

											{(() => {
												const elseBranch = block.else ?? createEmptyElse();
												const elseStepItemIds = elseBranch.steps.map(
													(step, stepIndex) =>
														`block-${blockIndex}-else-step-${step.id?.trim() || stepIndex}`
												);
												const updateElse = (nextElse: ProcessFlowElse) => {
													updateBranchBlock({
														...block,
														else: nextElse,
														defaultExit: undefined,
													});
												};
												const handleElseStepDragEnd = (event: DragEndEvent) => {
													const { active, over } = event;
													if (!over || active.id === over.id) return;
													const oldIndex = elseStepItemIds.findIndex(
														(id) => id === String(active.id)
													);
													const newIndex = elseStepItemIds.findIndex(
														(id) => id === String(over.id)
													);
													if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
														return;
													}
													updateElse({
														...elseBranch,
														steps: arrayMove(elseBranch.steps, oldIndex, newIndex),
													});
												};

												return (
													<div className="grid gap-2 md:grid-cols-[110px_minmax(0,1fr)]">
														<div className="pt-1">
															<Badge variant="outline" className="text-[11px]">
																それ以外
															</Badge>
														</div>
														<div className="space-y-3 border-l border-slate-200 pl-3">
															<DndContext
																sensors={sensors}
																collisionDetection={closestCenter}
																onDragEnd={handleElseStepDragEnd}
															>
																<SortableContext
																	items={elseStepItemIds}
																	strategy={verticalListSortingStrategy}
																>
																	<div className="space-y-1">
																		{elseBranch.steps.map((step, stepIndex) => {
																			const elseStepItemId = elseStepItemIds[stepIndex];
																			return (
																				<SortableItem
																					key={elseStepItemId}
																					id={elseStepItemId}
																				>
																					{(stepDragHandleProps) => (
																						<StepEditor
																							step={step}
																							onChange={(nextStep) => {
																								const nextSteps = elseBranch.steps.map(
																									(current, index) =>
																										index === stepIndex
																											? nextStep
																											: current
																								);
																								updateElse({
																									...elseBranch,
																									steps: nextSteps,
																								});
																							}}
																							onRemove={() => {
																								const nextSteps = elseBranch.steps.filter(
																									(_, index) => index !== stepIndex
																								);
																								updateElse({
																									...elseBranch,
																									steps: nextSteps,
																								});
																							}}
																							dragHandleProps={stepDragHandleProps}
																							whenPlaceholder={whenPlaceholder}
																							whoPlaceholder={whoPlaceholder}
																							actionPlaceholder={actionPlaceholder}
																							stepOptions={stepOptions}
																						/>
																					)}
																				</SortableItem>
																			);
																		})}
																	</div>
																</SortableContext>
															</DndContext>

															<div className="flex justify-start">
																<Button
																	type="button"
																	variant="outline"
																	className="h-7 text-[11px]"
																	onClick={() =>
																		updateElse({
																			...elseBranch,
																			steps: [...elseBranch.steps, createEmptyStep()],
																		})
																	}
																>
																	<Plus className="mr-1 h-3 w-3" />
																	それ以外ステップを追加
																</Button>
															</div>

															<ExitEditor
																value={elseBranch.exit ?? { type: "next" }}
																onChange={(nextExit) =>
																	updateElse({
																		...elseBranch,
																		exit: nextExit,
																	})
																}
																stepOptions={stepOptions}
																label="出口（合流先）"
															/>
														</div>
													</div>
												);
											})()}

											<div className="flex justify-start">
												<Button
													type="button"
													variant="outline"
													className="h-8 text-[12px]"
													onClick={() =>
														updateBranchBlock({
															...block,
															branches: [...block.branches, createEmptyBranch()],
														})
													}
												>
													<GitBranchPlus className="mr-1 h-3.5 w-3.5" />
													条件を追加
												</Button>
											</div>
										</div>
									)}
								</SortableItem>
							);
						})}
					</div>
				</SortableContext>
			</DndContext>

			<div className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="outline"
					className="h-8 text-[12px]"
					onClick={addStepBlock}
				>
					<Plus className="mr-1 h-3.5 w-3.5" />
					通常ステップを追加
				</Button>
				<Button
					type="button"
					variant="outline"
					className="h-8 text-[12px]"
					onClick={addBranchBlock}
				>
					<Split className="mr-1 h-3.5 w-3.5" />
					分岐ブロックを追加
				</Button>
			</div>

			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					既存のYAMLに構文エラーがあります。新しい構造で上書き保存されます。
				</p>
			)}
		</div>
	);
}
