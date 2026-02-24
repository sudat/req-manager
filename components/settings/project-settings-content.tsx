"use client";

import { useEffect, useMemo, useState } from "react";
import { useProject } from "@/components/project/project-context";
import type { ProjectInvestigationSettings } from "@/lib/domain";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useProjectSettings } from "@/hooks/use-project-settings";
import { SectionHeader } from "@/components/settings/section-header";
import { StatusAlert } from "@/components/settings/status-alert";
import { SettingsActionBar } from "@/components/settings/settings-action-bar";

const parseLines = (value: string) =>
	value
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);

export function ProjectSettingsContent() {
	const { currentProject } = useProject();
	const {
		settings,
		loading,
		saving,
		error,
		success,
		updateSettings,
		saveSettings,
		resetSettings,
	} = useProjectSettings(currentProject?.id ?? null);

	const [includePatternsText, setIncludePatternsText] = useState("");
	const [excludePatternsText, setExcludePatternsText] = useState("");
	const [sharedPatternsText, setSharedPatternsText] = useState("");

	const currentProjectLabel = useMemo(() => {
		if (!currentProject) return null;
		return `${currentProject.name} (${currentProject.id})`;
	}, [currentProject]);

	// 設定が読み込まれたらテキストフィールドを初期化
	useEffect(() => {
		if (settings) {
			setIncludePatternsText(settings.exploration.default_include_patterns.join("\n"));
			setExcludePatternsText(settings.exploration.default_exclude_patterns.join("\n"));
			setSharedPatternsText(settings.shared_module_patterns.join("\n"));
		}
	}, [settings]);

	const handleSave = async () => {
		if (!settings) return;

		const nextSettings: ProjectInvestigationSettings = {
			...settings,
			exploration: {
				...settings.exploration,
				default_include_patterns: parseLines(includePatternsText),
				default_exclude_patterns: parseLines(excludePatternsText),
			},
			shared_module_patterns: parseLines(sharedPatternsText),
		};

		// テキストエリアの内容を設定に反映
		updateSettings(() => nextSettings);

		// 保存
		await saveSettings(nextSettings);
	};

	const handleReset = () => {
		resetSettings();
		if (settings) {
			setIncludePatternsText(settings.exploration.default_include_patterns.join("\n"));
			setExcludePatternsText(settings.exploration.default_exclude_patterns.join("\n"));
			setSharedPatternsText(settings.shared_module_patterns.join("\n"));
		}
	};

	return (
		<div className="rounded-md border border-slate-200 bg-white p-6 space-y-8">
			<SectionHeader
				title="プロジェクト設定（影響調査）"
				description="影響調査とallow_paths決定の挙動をプロジェクト単位で管理します"
			/>

			{currentProjectLabel && (
				<div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] text-slate-600">
					現在のプロジェクト: {currentProjectLabel}
				</div>
			)}

			{loading && (
				<div className="text-[13px] text-slate-500">設定を読み込み中...</div>
			)}

			{!loading && !settings && (
				<div className="text-[13px] text-slate-500">
					プロジェクトが選択されていません。
				</div>
			)}

			{settings && (
				<div className="space-y-8">
					<div className="space-y-4">
						<SectionHeader
							title="探索設定"
							description="依存探索のデフォルト挙動を設定します"
						/>
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
									デフォルト深度
								</Label>
								<Input
									type="number"
									min={1}
									value={settings.exploration.default_max_depth}
									onChange={(e) =>
										updateSettings((prev) => ({
											...prev,
											exploration: {
												...prev.exploration,
												default_max_depth: Number(e.target.value) || 0,
											},
										}))
									}
								/>
							</div>
							<div className="space-y-2 md:col-span-2">
								<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
									探索対象パターン
								</Label>
								<Textarea
									value={includePatternsText}
									onChange={(e) => setIncludePatternsText(e.target.value)}
									placeholder={"src/**\napp/**"}
									className="min-h-[88px]"
								/>
							</div>
							<div className="space-y-2 md:col-span-3">
								<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
									除外パターン
								</Label>
								<Textarea
									value={excludePatternsText}
									onChange={(e) => setExcludePatternsText(e.target.value)}
									placeholder={"node_modules/**\n**/*.test.*"}
									className="min-h-[88px]"
								/>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<SectionHeader
							title="allow_paths 決定ルール"
							description="影響範囲の自動決定ルールを設定します"
						/>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-3 rounded-md border border-slate-200 p-4">
								<div className="text-[13px] font-semibold text-slate-900">基本ルール</div>
								<div className="flex items-center justify-between">
									<span className="text-[13px] text-slate-600">
										直接影響を含める
									</span>
									<Switch
										checked={settings.allow_paths_rule.base_rule.include_direct_impacts}
										onCheckedChange={(checked) =>
											updateSettings((prev) => ({
												...prev,
												allow_paths_rule: {
													...prev.allow_paths_rule,
													base_rule: {
														...prev.allow_paths_rule.base_rule,
														include_direct_impacts: checked,
													},
												},
											}))
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[13px] text-slate-600">
										間接影響を含める
									</span>
									<Switch
										checked={settings.allow_paths_rule.base_rule.include_indirect_impacts}
										onCheckedChange={(checked) =>
											updateSettings((prev) => ({
												...prev,
												allow_paths_rule: {
													...prev.allow_paths_rule,
													base_rule: {
														...prev.allow_paths_rule.base_rule,
														include_indirect_impacts: checked,
													},
												},
											}))
										}
									/>
								</div>
								<div className="grid gap-3 md:grid-cols-2">
									<div className="space-y-2">
										<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											信頼度閾値
										</Label>
										<Input
											type="number"
											min={0}
											max={1}
											step={0.1}
											value={settings.allow_paths_rule.base_rule.confidence_threshold}
											onChange={(e) =>
												updateSettings((prev) => ({
													...prev,
													allow_paths_rule: {
														...prev.allow_paths_rule,
														base_rule: {
															...prev.allow_paths_rule.base_rule,
															confidence_threshold: Number(e.target.value) || 0,
														},
													},
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											最大深度
										</Label>
										<Input
											type="number"
											min={1}
											value={settings.allow_paths_rule.base_rule.max_depth}
											onChange={(e) =>
												updateSettings((prev) => ({
													...prev,
													allow_paths_rule: {
														...prev.allow_paths_rule,
														base_rule: {
															...prev.allow_paths_rule.base_rule,
															max_depth: Number(e.target.value) || 0,
														},
													},
												}))
											}
										/>
									</div>
								</div>
							</div>

							<div className="space-y-3 rounded-md border border-slate-200 p-4">
								<div className="text-[13px] font-semibold text-slate-900">
									共通処理ルール
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[13px] text-slate-600">
										共通処理を自動含有
									</span>
									<Switch
										checked={settings.allow_paths_rule.shared_module_rule.auto_include}
										onCheckedChange={(checked) =>
											updateSettings((prev) => ({
												...prev,
												allow_paths_rule: {
													...prev.allow_paths_rule,
													shared_module_rule: {
														...prev.allow_paths_rule.shared_module_rule,
														auto_include: checked,
													},
												},
											}))
										}
									/>
								</div>
								<div className="flex items-center justify-between">
									<span className="text-[13px] text-slate-600">
										含有時に通知する
									</span>
									<Switch
										checked={settings.allow_paths_rule.shared_module_rule.notify_on_include}
										onCheckedChange={(checked) =>
											updateSettings((prev) => ({
												...prev,
												allow_paths_rule: {
													...prev.allow_paths_rule,
													shared_module_rule: {
														...prev.allow_paths_rule.shared_module_rule,
														notify_on_include: checked,
													},
												},
											}))
										}
									/>
								</div>
								<div className="space-y-2">
									<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
										確認要求の閾値
									</Label>
									<Input
										type="number"
										min={0}
										value={settings.allow_paths_rule.shared_module_rule.require_confirmation_if_count_exceeds}
										onChange={(e) =>
											updateSettings((prev) => ({
												...prev,
												allow_paths_rule: {
													...prev.allow_paths_rule,
													shared_module_rule: {
														...prev.allow_paths_rule.shared_module_rule,
														require_confirmation_if_count_exceeds: Number(e.target.value) || 0,
													},
												},
											}))
										}
									/>
								</div>
							</div>

							<div className="space-y-3 rounded-md border border-slate-200 p-4 md:col-span-2">
								<div className="text-[13px] font-semibold text-slate-900">
									安全弁
								</div>
								<div className="grid gap-3 md:grid-cols-3">
									<div className="space-y-2">
										<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											最大ファイル数
										</Label>
										<Input
											type="number"
											min={1}
											value={settings.allow_paths_rule.safety_limits.max_total_files}
											onChange={(e) =>
												updateSettings((prev) => ({
													...prev,
													allow_paths_rule: {
														...prev.allow_paths_rule,
														safety_limits: {
															...prev.allow_paths_rule.safety_limits,
															max_total_files: Number(e.target.value) || 0,
														},
													},
												}))
											}
										/>
									</div>
									<div className="space-y-2">
										<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
											最大ディレクトリ数
										</Label>
										<Input
											type="number"
											min={1}
											value={settings.allow_paths_rule.safety_limits.max_directories}
											onChange={(e) =>
												updateSettings((prev) => ({
													...prev,
													allow_paths_rule: {
														...prev.allow_paths_rule,
														safety_limits: {
															...prev.allow_paths_rule.safety_limits,
															max_directories: Number(e.target.value) || 0,
														},
													},
												}))
											}
										/>
									</div>
									<div className="flex items-center justify-between gap-4">
										<div>
											<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
												閾値超過時
											</div>
											<div className="text-[13px] text-slate-600">
												レビューAIへ回す
											</div>
										</div>
										<Switch
											checked={settings.allow_paths_rule.safety_limits.escalate_if_exceeds}
											onCheckedChange={(checked) =>
												updateSettings((prev) => ({
													...prev,
													allow_paths_rule: {
														...prev.allow_paths_rule,
														safety_limits: {
															...prev.allow_paths_rule.safety_limits,
															escalate_if_exceeds: checked,
														},
													},
												}))
											}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<SectionHeader
							title="影響範囲レビュー設定"
							description="allow_paths候補が閾値超過した場合の挙動を設定します"
						/>
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2">
								<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
									自動起動閾値
								</Label>
								<Input
									type="number"
									min={1}
									value={settings.impact_review.auto_trigger_threshold}
									onChange={(e) =>
										updateSettings((prev) => ({
											...prev,
											impact_review: {
												...prev.impact_review,
												auto_trigger_threshold: Number(e.target.value) || 0,
											},
										}))
									}
								/>
							</div>
							<div className="space-y-2">
								<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
									デフォルト強度
								</Label>
								<Select
									value={settings.impact_review.default_aggressiveness}
									onValueChange={(value) =>
										updateSettings((prev) => ({
											...prev,
											impact_review: {
												...prev.impact_review,
												default_aggressiveness: value as ProjectInvestigationSettings["impact_review"]["default_aggressiveness"],
											},
										}))
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="conservative">Conservative</SelectItem>
										<SelectItem value="moderate">Moderate</SelectItem>
										<SelectItem value="aggressive">Aggressive</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center justify-between gap-4">
								<div>
									<div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
										ヒューマン確認
									</div>
									<div className="text-[13px] text-slate-600">
										確認必須にする
									</div>
								</div>
								<Switch
									checked={settings.impact_review.require_human_confirmation}
									onCheckedChange={(checked) =>
										updateSettings((prev) => ({
											...prev,
											impact_review: {
												...prev.impact_review,
												require_human_confirmation: checked,
											},
										}))
									}
								/>
							</div>
						</div>
					</div>

					<Separator />

					<div className="space-y-4">
						<SectionHeader
							title="共通処理ディレクトリ"
							description="共通処理として扱うパターンを定義します"
						/>
						<Textarea
							value={sharedPatternsText}
							onChange={(e) => setSharedPatternsText(e.target.value)}
							placeholder={"src/utils/**\nsrc/shared/**"}
							className="min-h-[120px]"
						/>
					</div>

					{error && <StatusAlert variant="error" message={error} />}

					{success && <StatusAlert variant="success" message={success} />}

					<SettingsActionBar
						saving={saving}
						onReset={handleReset}
						onSave={handleSave}
						saveDisabled={!currentProject?.id}
						wrapperClassName="pt-2"
					/>
				</div>
			)}
		</div>
	);
}
