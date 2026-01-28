"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYamlValidation } from "@/hooks/use-yaml-validation";
import { EditHeader } from "@/components/product-requirement/edit-header";
import { TargetUsersEdit } from "@/components/product-requirement/target-users-edit";
import { ExperienceGoalsEdit } from "@/components/product-requirement/experience-goals-edit";
import { QualityGoalsEdit } from "@/components/product-requirement/quality-goals-edit";
import { DesignSystemEdit } from "@/components/product-requirement/design-system-edit";
import { UxGuidelinesEdit } from "@/components/product-requirement/ux-guidelines-edit";
import { TechStackEdit } from "@/components/product-requirement/tech-stack-edit";
import type { ProductRequirement } from "@/lib/domain";
import {
	createProductRequirement,
	getProductRequirementByProjectId,
	updateProductRequirement,
} from "@/lib/data/product-requirements";

export default function ProductRequirementEditPage() {
	const router = useRouter();
	const { currentProject } = useProject();
	const [productRequirement, setProductRequirement] = useState<ProductRequirement | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
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

	const hasChanges = useMemo(() => {
		if (!productRequirement) return true;
		return (
			targetUsers !== productRequirement.targetUsers ||
			experienceGoals !== productRequirement.experienceGoals ||
			qualityGoals !== productRequirement.qualityGoals ||
			designSystem !== productRequirement.designSystem ||
			uxGuidelines !== productRequirement.uxGuidelines ||
			techStackProfileText !== (productRequirement.techStackProfile ?? "") ||
			codingConventionsText !== (productRequirement.codingConventions ?? "") ||
			forbiddenChoicesText !== (productRequirement.forbiddenChoices ?? "")
		);
	}, [productRequirement, targetUsers, experienceGoals, qualityGoals, designSystem, uxGuidelines, techStackProfileText, codingConventionsText, forbiddenChoicesText]);

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
		setSaving(false);

		// 保存成功後に閲覧モードへ遷移
		router.push("/product-requirement");
	};

	const handleCancel = () => {
		if (hasChanges) {
			if (!confirm("編集中の変更があります。キャンセルしますか？")) {
				return;
			}
		}
		router.push("/product-requirement");
	};

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1200px] p-8">
					<EditHeader
						onSave={handleSave}
						onCancel={handleCancel}
						hasChanges={hasChanges}
						isSaving={saving}
					/>

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
						<Card className="p-6 mt-6">
							<div className="space-y-6">
								<Tabs defaultValue="targetUsers" className="w-full">
									<TabsList className="w-full justify-start flex-wrap">
										<TabsTrigger value="targetUsers" className="px-4">ターゲットユーザー</TabsTrigger>
										<TabsTrigger value="experienceGoals" className="px-4">体験目標</TabsTrigger>
										<TabsTrigger value="qualityGoals" className="px-4">品質目標</TabsTrigger>
										<TabsTrigger value="ux" className="px-4">UX・デザイン</TabsTrigger>
										<TabsTrigger value="tech" className="px-4">技術スタック・規約</TabsTrigger>
									</TabsList>

									<TabsContent value="targetUsers" className="mt-6">
										<TargetUsersEdit
											value={targetUsers}
											onChange={(value) => {
												setTargetUsers(value);
												clearFieldError("targetUsers");
											}}
											error={fieldErrors.targetUsers}
										/>
									</TabsContent>

									<TabsContent value="experienceGoals" className="mt-6">
										<ExperienceGoalsEdit
											value={experienceGoals}
											onChange={(value) => {
												setExperienceGoals(value);
												clearFieldError("experienceGoals");
											}}
											error={fieldErrors.experienceGoals}
										/>
									</TabsContent>

									<TabsContent value="qualityGoals" className="mt-6">
										<QualityGoalsEdit
											value={qualityGoals}
											onChange={(value) => {
												setQualityGoals(value);
												clearFieldError("qualityGoals");
											}}
											error={fieldErrors.qualityGoals}
										/>
									</TabsContent>

									<TabsContent value="ux" className="mt-6">
										<div className="space-y-6">
											<UxGuidelinesEdit
												value={uxGuidelines}
												onChange={(value) => {
													setUxGuidelines(value);
													clearFieldError("uxGuidelines");
												}}
												error={fieldErrors.uxGuidelines}
											/>
											<DesignSystemEdit
												value={designSystem}
												onChange={(value) => {
													setDesignSystem(value);
													clearFieldError("designSystem");
												}}
												error={fieldErrors.designSystem}
											/>
										</div>
									</TabsContent>

									<TabsContent value="tech" className="mt-6">
										<TechStackEdit
											techStackProfileText={techStackProfileText}
											codingConventionsText={codingConventionsText}
											forbiddenChoicesText={forbiddenChoicesText}
											techStackDiag={techStackDiag}
											codingDiag={codingDiag}
											forbiddenDiag={forbiddenDiag}
											onTechStackProfileChange={setTechStackProfileText}
											onCodingConventionsChange={setCodingConventionsText}
											onForbiddenChoicesChange={setForbiddenChoicesText}
											onClearFieldError={clearFieldError}
										/>
									</TabsContent>
								</Tabs>

								{error && (
									<div className="rounded-md border border-rose-200 bg-rose-50 p-3">
										<p className="text-sm text-rose-600">{error}</p>
									</div>
								)}
							</div>
						</Card>
					)}
				</div>
			</div>
		</>
	);
}
