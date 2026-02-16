"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYamlValidation } from "@/hooks/use-yaml-validation";
import { EditHeader } from "@/components/product-requirement/edit-header";
import { TargetUsers } from "@/components/product-requirement/target-users";
import { ExperienceGoals } from "@/components/product-requirement/experience-goals";
import { QualityGoals } from "@/components/product-requirement/quality-goals";
import { DesignSystem } from "@/components/product-requirement/design-system";
import { UxGuidelines } from "@/components/product-requirement/ux-guidelines";
import { TechStack } from "@/components/product-requirement/tech-stack";
import type { ProductRequirement } from "@/lib/domain";
import {
	createProductRequirement,
	getProductRequirementByProjectId,
	updateProductRequirement,
} from "@/lib/data/product-requirements";
import { listKeyLabelMappings, upsertKeyLabelMappings } from "@/lib/data/key-label-mappings";
import { toast } from "sonner";

export default function ProductRequirementEditPage() {
	const router = useRouter();
	const { currentProject } = useProject();
	const [productRequirement, setProductRequirement] = useState<ProductRequirement | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [keyLabelMappings, setKeyLabelMappings] = useState<Record<string, string>>({});

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

	const normalizeKey = (value: string): string =>
		value
			.trim()
			.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
			.replace(/[-\s]+/g, "_")
			.toLowerCase();

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

	useEffect(() => {
		let mounted = true;
		const fetchData = async () => {
			if (!currentProject?.id) {
				if (!mounted) return;
				setProductRequirement(null);
				setLoading(false);
				return;
			}

			setLoading(true);
			setError(null);

			const [prResult, labelResult] = await Promise.all([
				getProductRequirementByProjectId(currentProject.id),
				listKeyLabelMappings(currentProject.id, "product_requirement"),
			]);

			if (!mounted) return;

			if (prResult.error || labelResult.error) {
				setError(prResult.error ?? labelResult.error ?? "読み込みに失敗しました");
				setProductRequirement(null);
				setLoading(false);
				return;
			}

			setKeyLabelMappings(labelResult.data ?? {});

			if (prResult.data) {
				setProductRequirement(prResult.data);
				setTargetUsers(prResult.data.targetUsers);
				setExperienceGoals(prResult.data.experienceGoals);
				setQualityGoals(prResult.data.qualityGoals);
				setDesignSystem(prResult.data.designSystem);
				setUxGuidelines(prResult.data.uxGuidelines);
				setTechStackProfileText(prResult.data.techStackProfile ?? "");
				setCodingConventionsText(prResult.data.codingConventions ?? "");
				setForbiddenChoicesText(prResult.data.forbiddenChoices ?? "");
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
			toast.error("プロダクト要件の更新に失敗しました", {
				description: result.error ?? "不明なエラーが発生しました",
			});
			return;
		}

		const mappingSaveResult = await upsertKeyLabelMappings({
			projectId: currentProject.id,
			context: "product_requirement",
			mappings: keyLabelMappings,
		});
		if (mappingSaveResult.error) {
			setError(`保存は完了しましたが、論理名マッピング保存に失敗しました: ${mappingSaveResult.error}`);
			setSaving(false);
			toast.error("論理名マッピングの保存に失敗しました", {
				description: mappingSaveResult.error,
			});
			return;
		}

		setProductRequirement(result.data);
		setTechStackProfileText(result.data.techStackProfile ?? "");
		setCodingConventionsText(result.data.codingConventions ?? "");
		setForbiddenChoicesText(result.data.forbiddenChoices ?? "");
		setSaving(false);

		// 保存成功後にトースト表示してから閲覧モードへ遷移
		toast.success("プロダクト要件を保存しました", {
			duration: 5000,
		});
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

	const handleKeyLabelAdd = (key: string, logicalLabel: string) => {
		const normalizedKey = normalizeKey(key);
		const trimmedLabel = logicalLabel.trim();
		if (!normalizedKey || !trimmedLabel) return;
		setKeyLabelMappings((prev) => ({
			...prev,
			[normalizedKey]: trimmedLabel,
		}));
	};

	return (
		<>
			<MobileHeader />
			<div className="min-h-screen bg-slate-50">
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
										<TargetUsers
											isEditing={true}
											value={targetUsers}
											onChange={(value) => {
												setTargetUsers(value);
												clearFieldError("targetUsers");
											}}
											error={fieldErrors.targetUsers}
										/>
									</TabsContent>

									<TabsContent value="experienceGoals" className="mt-6">
										<ExperienceGoals
											isEditing={true}
											value={experienceGoals}
											onChange={(value) => {
												setExperienceGoals(value);
												clearFieldError("experienceGoals");
											}}
											error={fieldErrors.experienceGoals}
										/>
									</TabsContent>

									<TabsContent value="qualityGoals" className="mt-6">
										<QualityGoals
											isEditing={true}
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
											<UxGuidelines
												isEditing={true}
												value={uxGuidelines}
												onChange={(value) => {
													setUxGuidelines(value);
													clearFieldError("uxGuidelines");
												}}
												error={fieldErrors.uxGuidelines}
											/>
											<DesignSystem
												isEditing={true}
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
										<TechStack
											isEditing={true}
											techStackProfile={techStackProfileText}
											codingConventions={codingConventionsText}
											forbiddenChoices={forbiddenChoicesText}
											onTechStackProfileChange={setTechStackProfileText}
											onCodingConventionsChange={setCodingConventionsText}
											onForbiddenChoicesChange={setForbiddenChoicesText}
											onClearFieldError={clearFieldError}
											onKeyLabelAdd={handleKeyLabelAdd}
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
