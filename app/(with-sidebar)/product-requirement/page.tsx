"use client";

import { useEffect, useMemo, useState } from "react";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { YamlTextareaField } from "@/components/forms/yaml-textarea-field";
import { useYamlValidation } from "@/hooks/use-yaml-validation";
import type { ProductRequirement } from "@/lib/domain";
import {
	createProductRequirement,
	getProductRequirementByProjectId,
	updateProductRequirement,
} from "@/lib/data/product-requirements";

export default function ProductRequirementPage() {
	const { currentProject } = useProject();
	const [productRequirement, setProductRequirement] = useState<ProductRequirement | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	const [targetUsers, setTargetUsers] = useState("");
	const [experienceGoals, setExperienceGoals] = useState("");
	const [qualityGoals, setQualityGoals] = useState("");
	const [designSystem, setDesignSystem] = useState("");
	const [uxGuidelines, setUxGuidelines] = useState("");

	const [techStackProfileText, setTechStackProfileText] = useState("");
	const [codingConventionsText, setCodingConventionsText] = useState("");
	const [forbiddenChoicesText, setForbiddenChoicesText] = useState("");

	const techStackDiag = useYamlValidation(techStackProfileText, {
		required: true,
		requiredMessage: "tech_stack_profile は必須です",
	});
	const codingDiag = useYamlValidation(codingConventionsText);
	const forbiddenDiag = useYamlValidation(forbiddenChoicesText);

	const canSave =
		!!currentProject?.id &&
		targetUsers.trim().length > 0 &&
		experienceGoals.trim().length > 0 &&
		qualityGoals.trim().length > 0 &&
		designSystem.trim().length > 0 &&
		uxGuidelines.trim().length > 0 &&
		techStackDiag.ok &&
		codingDiag.ok &&
		forbiddenDiag.ok &&
		!saving;

	const projectLabel = useMemo(() => {
		if (!currentProject) return null;
		return `${currentProject.name} (${currentProject.id})`;
	}, [currentProject]);

	useEffect(() => {
		if (!currentProject?.id) {
			setProductRequirement(null);
			setLoading(false);
			return;
		}

		let mounted = true;
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			setSuccess(null);

			const { data, error: fetchError } = await getProductRequirementByProjectId(
				currentProject.id
			);

			if (!mounted) return;

			if (fetchError) {
				setError(fetchError);
				setProductRequirement(null);
				setLoading(false);
				return;
			}

			if (data) {
				setProductRequirement(data);
				setTargetUsers(data.targetUsers);
				setExperienceGoals(data.experienceGoals);
				setQualityGoals(data.qualityGoals);
				setDesignSystem(data.designSystem);
				setUxGuidelines(data.uxGuidelines);
				setTechStackProfileText(data.techStackProfile ?? "");
				setCodingConventionsText(data.codingConventions ?? "");
				setForbiddenChoicesText(data.forbiddenChoices ?? "");
			} else {
				setProductRequirement(null);
				setTargetUsers("");
				setExperienceGoals("");
				setQualityGoals("");
				setDesignSystem("");
				setUxGuidelines("");
				setTechStackProfileText("");
				setCodingConventionsText("");
				setForbiddenChoicesText("");
			}

			setFieldErrors({});
			setLoading(false);
		};

		fetchData();
		return () => {
			mounted = false;
		};
	}, [currentProject?.id]);

	const clearFieldError = (key: string) => {
		setFieldErrors((prev) => {
			if (!prev[key]) return prev;
			const next = { ...prev };
			delete next[key];
			return next;
		});
	};

	const handleSave = async () => {
		if (!currentProject?.id) return;
		setSaving(true);
		setError(null);
		setSuccess(null);
		setFieldErrors({});

		const nextErrors: Record<string, string> = {};

		if (!targetUsers.trim()) nextErrors.targetUsers = "ターゲットユーザーは必須です";
		if (!experienceGoals.trim()) nextErrors.experienceGoals = "体験目標は必須です";
		if (!qualityGoals.trim()) nextErrors.qualityGoals = "品質目標は必須です";
		if (!designSystem.trim()) nextErrors.designSystem = "デザインシステムは必須です";
		if (!uxGuidelines.trim()) nextErrors.uxGuidelines = "UXガイドラインは必須です";

		if (Object.keys(nextErrors).length > 0) {
			setFieldErrors(nextErrors);
			setError("必須項目を入力してください");
			setSaving(false);
			return;
		}

		if (!techStackDiag.ok || !codingDiag.ok || !forbiddenDiag.ok) {
			setError("YAMLの構文エラーがあります。修正してください。");
			setSaving(false);
			return;
		}

		const payload = {
			id: productRequirement?.id ?? `PR-${currentProject.id}`,
			targetUsers: targetUsers.trim(),
			experienceGoals: experienceGoals.trim(),
			qualityGoals: qualityGoals.trim(),
			designSystem: designSystem.trim(),
			uxGuidelines: uxGuidelines.trim(),
			techStackProfile: techStackProfileText.trim(),
			codingConventions: codingConventionsText.trim() || null,
			forbiddenChoices: forbiddenChoicesText.trim() || null,
		};

		const result = productRequirement
			? await updateProductRequirement(productRequirement.id, payload, currentProject.id)
			: await createProductRequirement({ ...payload, projectId: currentProject.id });

		if (result.error || !result.data) {
			setError(result.error ?? "保存に失敗しました");
			setSaving(false);
			return;
		}

		setProductRequirement(result.data);
		setTechStackProfileText(result.data.techStackProfile ?? "");
		setCodingConventionsText(result.data.codingConventions ?? "");
		setForbiddenChoicesText(result.data.forbiddenChoices ?? "");
		setSuccess("プロダクト要件を保存しました");
		setSaving(false);
	};

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1200px] p-8">
					<div className="mb-6">
						<h1 className="text-2xl font-semibold text-slate-900">プロダクト要件</h1>
						<p className="text-sm text-slate-500 mt-1">
							プロジェクトの前提と品質基準をまとめます
						</p>
					</div>

					{projectLabel && (
						<div className="mb-6 rounded-md border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
							対象プロジェクト: {projectLabel}
						</div>
					)}

					{loading && (
						<div className="space-y-4">
							<div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
							<div className="h-80 animate-pulse rounded bg-slate-200" />
						</div>
					)}

					{!loading && !currentProject?.id && (
						<div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
							プロジェクトを選択してください。
						</div>
					)}

					{!loading && currentProject?.id && (
						<Card className="p-6">
							<div className="space-y-6">
								<div className="space-y-2">
									<Label>PR ID</Label>
									<Input
										value={productRequirement?.id ?? `PR-${currentProject.id}`}
										disabled
									/>
									<p className="text-xs text-slate-500">
										PRはプロジェクトごとに1件のみ管理します。
									</p>
								</div>

								<Tabs defaultValue="basic" className="w-full">
									<TabsList className="w-full justify-start">
										<TabsTrigger value="basic" className="px-6">基本情報</TabsTrigger>
										<TabsTrigger value="tech" className="px-6">技術スタック・規約</TabsTrigger>
									</TabsList>

								<TabsContent value="basic" className="mt-6 space-y-6">
										<div className="space-y-2">
											<Label>ターゲットユーザー</Label>
											<Textarea
												value={targetUsers}
												onChange={(e) => {
													setTargetUsers(e.target.value);
													clearFieldError("targetUsers");
												}}
												className="min-h-[120px]"
												placeholder="ペルソナ、利用シーン、前提知識など"
											/>
											{fieldErrors.targetUsers && (
												<p className="text-xs text-rose-600">{fieldErrors.targetUsers}</p>
											)}
										</div>
										<div className="space-y-2">
											<Label>体験目標</Label>
											<Textarea
												value={experienceGoals}
												onChange={(e) => {
													setExperienceGoals(e.target.value);
													clearFieldError("experienceGoals");
												}}
												className="min-h-[120px]"
												placeholder="ユーザーが得たい価値や行動変容"
											/>
											{fieldErrors.experienceGoals && (
												<p className="text-xs text-rose-600">{fieldErrors.experienceGoals}</p>
											)}
										</div>
										<div className="space-y-2">
											<Label>品質目標</Label>
											<Textarea
												value={qualityGoals}
												onChange={(e) => {
													setQualityGoals(e.target.value);
													clearFieldError("qualityGoals");
												}}
												className="min-h-[120px]"
												placeholder="性能、可用性、セキュリティなど"
											/>
											{fieldErrors.qualityGoals && (
												<p className="text-xs text-rose-600">{fieldErrors.qualityGoals}</p>
											)}
										</div>
										<div className="space-y-2">
											<Label>デザインシステム</Label>
											<Textarea
												value={designSystem}
												onChange={(e) => {
													setDesignSystem(e.target.value);
													clearFieldError("designSystem");
												}}
												className="min-h-[120px]"
												placeholder="カラー、タイポグラフィ、コンポーネント方針"
											/>
											{fieldErrors.designSystem && (
												<p className="text-xs text-rose-600">{fieldErrors.designSystem}</p>
											)}
										</div>
										<div className="space-y-2">
											<Label>UXガイドライン</Label>
											<Textarea
												value={uxGuidelines}
												onChange={(e) => {
													setUxGuidelines(e.target.value);
													clearFieldError("uxGuidelines");
												}}
												className="min-h-[120px]"
												placeholder="操作性、フィードバック、エラー表示方針"
											/>
											{fieldErrors.uxGuidelines && (
												<p className="text-xs text-rose-600">{fieldErrors.uxGuidelines}</p>
											)}
										</div>
									</TabsContent>

									<TabsContent value="tech" className="mt-6 space-y-6">
										<YamlTextareaField
											label="tech_stack_profile (YAML)"
											value={techStackProfileText}
											onChange={(value) => {
												setTechStackProfileText(value);
												clearFieldError("techStackProfileText");
											}}
											placeholder={"frontend:\n  framework: Next.js\n  language: TypeScript"}
											required
											diag={techStackDiag}
											helperText="YAML形式で入力してください（単一ドキュメント）。"
										/>
										<YamlTextareaField
											label="coding_conventions (YAML)（任意）"
											value={codingConventionsText}
											onChange={(value) => {
												setCodingConventionsText(value);
												clearFieldError("codingConventionsText");
											}}
											placeholder={"naming:\n  files: kebab-case"}
											diag={codingDiag}
										/>
										<YamlTextareaField
											label="forbidden_choices (YAML)（任意）"
											value={forbiddenChoicesText}
											onChange={(value) => {
												setForbiddenChoicesText(value);
												clearFieldError("forbiddenChoicesText");
											}}
											placeholder={"must_not_use:\n  - jQuery"}
											diag={forbiddenDiag}
										/>
									</TabsContent>
								</Tabs>

								{error && (
									<div className="rounded-md border border-rose-200 bg-rose-50 p-3">
										<p className="text-sm text-rose-600">{error}</p>
									</div>
								)}

								{success && (
									<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
										<p className="text-sm text-emerald-700">{success}</p>
									</div>
								)}

								<div className="flex justify-end">
									<Button
										onClick={handleSave}
										disabled={!canSave}
										className="bg-slate-900 hover:bg-slate-800"
									>
										{saving ? "保存中..." : "保存"}
									</Button>
								</div>
							</div>
						</Card>
					)}
				</div>
			</div>
		</>
	);
}
