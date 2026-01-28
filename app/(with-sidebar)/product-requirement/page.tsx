"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { useProject } from "@/components/project/project-context";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewHeader } from "@/components/product-requirement/view-header";
import { TargetUsersView } from "@/components/product-requirement/target-users-view";
import { ExperienceGoalsView } from "@/components/product-requirement/experience-goals-view";
import { QualityGoalsView } from "@/components/product-requirement/quality-goals-view";
import { UxGuidelinesView } from "@/components/product-requirement/ux-guidelines-view";
import { DesignSystemView } from "@/components/product-requirement/design-system-view";
import { TechStackView } from "@/components/product-requirement/tech-stack-view";
import type { ProductRequirement } from "@/lib/domain";
import { getProductRequirementByProjectId } from "@/lib/data/product-requirements";

export default function ProductRequirementPage() {
	const router = useRouter();
	const { currentProject } = useProject();
	const [productRequirement, setProductRequirement] = useState<ProductRequirement | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!currentProject?.id) {
			setProductRequirement(null);
			setLoading(false);
			return;
		}

		let mounted = true;
		const fetchData = async () => {
			setLoading(true);

			const { data, error: fetchError } = await getProductRequirementByProjectId(
				currentProject.id
			);

			if (!mounted) return;

			if (fetchError) {
				console.error(fetchError);
				setProductRequirement(null);
			} else {
				setProductRequirement(data);
			}

			setLoading(false);
		};

		fetchData();
		return () => {
			mounted = false;
		};
	}, [currentProject?.id]);

	const handleEdit = () => {
		router.push("/product-requirement/edit");
	};

	return (
		<>
			<MobileHeader />
			<div className="flex-1 min-h-screen bg-slate-50">
				<div className="mx-auto max-w-[1200px] p-8">
					<ViewHeader
						onEdit={handleEdit}
						hasData={!!productRequirement}
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

					{!loading && currentProject?.id && !productRequirement && (
						<Card className="p-6 mt-6">
							<div className="text-center py-12">
								<p className="text-slate-600 mb-4">
									まだプロダクト要件が登録されていません。
								</p>
								<p className="text-sm text-slate-500">
									右上の「新規作成」ボタンから登録してください。
								</p>
							</div>
						</Card>
					)}

					{!loading && currentProject?.id && productRequirement && (
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
										<TargetUsersView value={productRequirement.targetUsers} />
									</TabsContent>

									<TabsContent value="experienceGoals" className="mt-6">
										<ExperienceGoalsView value={productRequirement.experienceGoals} />
									</TabsContent>

									<TabsContent value="qualityGoals" className="mt-6">
										<QualityGoalsView value={productRequirement.qualityGoals} />
									</TabsContent>

									<TabsContent value="ux" className="mt-6">
										<div className="space-y-6">
											<UxGuidelinesView value={productRequirement.uxGuidelines} />
											<DesignSystemView value={productRequirement.designSystem} />
										</div>
									</TabsContent>

									<TabsContent value="tech" className="mt-6">
										<TechStackView
											techStackProfile={productRequirement.techStackProfile}
											codingConventions={productRequirement.codingConventions}
											forbiddenChoices={productRequirement.forbiddenChoices}
										/>
									</TabsContent>
								</Tabs>
							</div>
						</Card>
					)}
				</div>
			</div>
		</>
	);
}
