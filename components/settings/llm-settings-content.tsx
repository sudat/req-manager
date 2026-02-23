"use client";

import { useMemo, useState } from "react";
import { useProject } from "@/components/project/project-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";
import { useLlmSettings } from "@/hooks/use-llm-settings";
import { getProviderLlmDefaults } from "@/lib/data/llm-settings";
import type { ProjectLlmSettings } from "@/lib/domain";
import { SectionHeader } from "@/components/settings/section-header";
import { StatusAlert } from "@/components/settings/status-alert";
import { SettingsActionBar } from "@/components/settings/settings-action-bar";

export function LLMSettingsContent() {
	const { currentProject } = useProject();
	const [showApiKey, setShowApiKey] = useState(false);
	const {
		settings,
		loading,
		saving,
		error,
		success,
		updateSettings,
		saveSettings,
		resetSettings,
		setError,
	} = useLlmSettings(currentProject?.id ?? null);

	const handleSave = async () => {
		if (!settings) return;
		if (settings.provider !== "openai" && settings.provider !== "zai") {
			setError("現在はOpenAIとZ.AIのみ対応しています");
			return;
		}
		await saveSettings();
	};

	const handleReset = () => {
		resetSettings();
	};

	const currentProjectLabel = useMemo(() => {
		if (!currentProject) return null;
		return `${currentProject.name} (${currentProject.id})`;
	}, [currentProject]);

	const handleProviderChange = (value: ProjectLlmSettings["provider"]) => {
		updateSettings((prev) => {
			if (!prev) return prev;
			const defaults = getProviderLlmDefaults(value);
			return {
				...prev,
				...defaults,
				provider: value,
			};
		});
	};

	return (
		<div className="rounded-md border border-slate-200 bg-white p-6">
			<SectionHeader
				title="LLM設定"
				description="LLMプロバイダーとモデルの設定を管理します"
			/>

			<div className="space-y-4">
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
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="provider" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">LLMプロバイダー</Label>
							<Select
								value={settings.provider}
								onValueChange={(value) => handleProviderChange(value as ProjectLlmSettings["provider"])}
							>
								<SelectTrigger id="provider">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="openai">OpenAI</SelectItem>
									<SelectItem value="anthropic">Anthropic</SelectItem>
									<SelectItem value="google">Google</SelectItem>
									<SelectItem value="azure">Azure OpenAI</SelectItem>
									<SelectItem value="zai">Z.AI</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{(settings.provider === "openai" || settings.provider === "zai") && (
							<div className="space-y-2">
								<Label htmlFor="baseUrl" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Base URL</Label>
								<Input
									id="baseUrl"
									type="text"
									value={settings.base_url}
									onChange={(e) =>
										updateSettings((prev) => ({
											...prev,
											base_url: e.target.value,
										}))
									}
									placeholder={settings.provider === "zai" ? "https://api.z.ai/api/coding/paas/v4" : "https://api.openai.com/v1"}
								/>
								<p className="text-[13px] text-slate-500 leading-relaxed">
									{settings.provider === "zai" ? "Z.AI APIエンドポイント" : "OpenAI互換APIを使用する場合に設定してください"}
								</p>
							</div>
						)}

						<Separator />

						<div className="space-y-2">
							<Label htmlFor="apiKey" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">APIキー</Label>
							<div className="relative">
								<Input
									id="apiKey"
									type={showApiKey ? "text" : "password"}
									defaultValue="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
									className="pr-10"
									disabled
								/>
								<button
									type="button"
									onClick={() => setShowApiKey(!showApiKey)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
								>
									{showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
								</button>
							</div>
							<p className="text-[13px] text-slate-500 leading-relaxed">APIキーは環境変数で設定してください</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="model" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">モデル</Label>
							<Select
								value={settings.model}
								onValueChange={(value) =>
									updateSettings((prev) => ({
										...prev,
										model: value,
									}))
								}
							>
								<SelectTrigger id="model">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{settings.provider === "zai" ? (
										<SelectItem value="glm-4.7">GLM-4.7</SelectItem>
									) : (
										<>
											<SelectItem value="gpt-5.2">GPT-5.2</SelectItem>
											<SelectItem value="gpt-5.2-chat-latest">GPT-5.2 Chat Latest</SelectItem>
											<SelectItem value="gpt-5">GPT-5</SelectItem>
											<SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
											<SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
											<Separator />
											<SelectItem value="gpt-5.2-pro" disabled>
												GPT-5.2 Pro（Responses APIのみ）
											</SelectItem>
											<SelectItem value="gpt-5.2-codex" disabled>
												GPT-5.2 Codex（Responses APIのみ）
											</SelectItem>
										</>
									)}
								</SelectContent>
							</Select>
							{settings.provider !== "zai" && (
								<p className="text-[12px] text-slate-500">
									※ gpt-5.2-pro / gpt-5.2-codex は Responses API 専用のため現在は未対応です。
								</p>
							)}
						</div>

						{/* Verbosity設定（OpenAI GPT-5のみ） */}
						{settings.provider === "openai" && (
							<div className="space-y-2">
								<Label htmlFor="verbosity" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Verbosity（GPT-5）</Label>
								<Select
									value={settings.verbosity ?? "low"}
									onValueChange={(value) =>
										updateSettings((prev) => ({
											...prev,
											verbosity: value as "low" | "medium" | "high",
										}))
									}
								>
									<SelectTrigger id="verbosity">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="low">Low（簡潔）</SelectItem>
										<SelectItem value="medium">Medium（バランス）</SelectItem>
										<SelectItem value="high">High（詳細）</SelectItem>
									</SelectContent>
								</Select>
								<p className="text-[13px] text-slate-500 leading-relaxed">GPT-5シリーズの応答の長さと詳細度を制御します</p>
							</div>
						)}

						{settings.provider !== "openai" && (
							<div className="space-y-3">
								<div className="flex items-center justify-between">
									<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Temperature</Label>
									<span className="text-[13px] font-semibold text-slate-900">{settings.temperature}</span>
								</div>
								<Slider
									value={[settings.temperature]}
									onValueChange={(value) =>
										updateSettings((prev) => ({
											...prev,
											temperature: value[0],
										}))
									}
									min={0}
									max={2}
									step={0.1}
									className="w-full"
								/>
								<div className="flex justify-between text-[13px] text-slate-500">
									<span>決定的 (0)</span>
									<span>創造的 (2)</span>
								</div>
							</div>
						)}

						{error && <StatusAlert variant="warning" message={error} />}

						{success && <StatusAlert variant="success" message={success} />}

						<SettingsActionBar
							saving={saving}
							onReset={handleReset}
							onSave={handleSave}
							saveDisabled={!currentProject?.id}
						/>
					</div>
				)}
			</div>
		</div>
	);
}
