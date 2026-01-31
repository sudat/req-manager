"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff } from "lucide-react";

function SectionHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className="mb-6">
			<h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
			{description && <p className="mt-1 text-[13px] text-slate-500 leading-relaxed">{description}</p>}
		</div>
	);
}

export function LLMSettingsContent() {
	const [showApiKey, setShowApiKey] = useState(false);
	const [temperature, setTemperature] = useState([1]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [provider, setProvider] = useState("openai");
	const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");

	const handleSave = async () => {
		setSaving(true);
		setError(null);
		setSuccess(null);

		// ダミーの非同期処理
		await new Promise((resolve) => setTimeout(resolve, 300));

		// 未実装であることを表示（infoスタイル）
		setError("この機能はまだ実装されていません");
		setSaving(false);
	};

	const handleReset = () => {
		setTemperature([1]);
		setProvider("openai");
		setBaseUrl("https://api.openai.com/v1");
		setSuccess(null);
		setError(null);
	};

	return (
		<div className="rounded-md border border-slate-200 bg-white p-6">
			<SectionHeader
				title="LLM設定"
				description="LLMプロバイダーとモデルの設定を管理します"
			/>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="provider" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">LLMプロバイダー</Label>
					<Select value={provider} onValueChange={setProvider}>
						<SelectTrigger id="provider">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="openai">OpenAI</SelectItem>
							<SelectItem value="anthropic">Anthropic</SelectItem>
							<SelectItem value="google">Google</SelectItem>
							<SelectItem value="azure">Azure OpenAI</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{provider === "openai" && (
					<div className="space-y-2">
						<Label htmlFor="baseUrl" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Base URL</Label>
						<Input
							id="baseUrl"
							type="text"
							value={baseUrl}
							onChange={(e) => setBaseUrl(e.target.value)}
							placeholder="https://api.openai.com/v1"
						/>
						<p className="text-[13px] text-slate-500 leading-relaxed">OpenAI互換APIを使用する場合に設定してください</p>
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
						/>
						<button
							type="button"
							onClick={() => setShowApiKey(!showApiKey)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
						>
							{showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
						</button>
					</div>
					<p className="text-[13px] text-slate-500 leading-relaxed">APIキーは暗号化して保存されます</p>
				</div>

				<div className="space-y-2">
					<Label htmlFor="model" className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">モデル</Label>
					<Select defaultValue="gpt-5">
						<SelectTrigger id="model">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="gpt-5">GPT-5</SelectItem>
							<SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
							<SelectItem value="gpt-5-nano">GPT-5 Nano</SelectItem>
							<SelectItem value="gpt-5.1-instant">GPT-5.1 Instant</SelectItem>
							<SelectItem value="gpt-5.1-thinking">GPT-5.1 Thinking</SelectItem>
							<SelectItem value="gpt-5.1-auto">GPT-5.1 Auto</SelectItem>
							<SelectItem value="gpt-5.2-instant">GPT-5.2 Instant</SelectItem>
							<SelectItem value="gpt-5.2-thinking">GPT-5.2 Thinking</SelectItem>
							<SelectItem value="gpt-5.2-pro">GPT-5.2 Pro</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{provider !== "openai" && (
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Temperature</Label>
							<span className="text-[13px] font-semibold text-slate-900">{temperature[0]}</span>
						</div>
						<Slider
							value={temperature}
							onValueChange={setTemperature}
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

				{error && (
					<div className="rounded-md border border-amber-200 bg-amber-50 p-3">
						<p className="text-[13px] text-amber-700">{error}</p>
					</div>
				)}

				{success && (
					<div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
						<p className="text-[13px] text-emerald-700">{success}</p>
					</div>
				)}

				<div className="flex justify-end gap-3 pt-4">
					<Button
						variant="outline"
						onClick={handleReset}
						disabled={saving}
						className="h-8 px-6"
					>
						リセット
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving}
						className="bg-slate-900 hover:bg-slate-800 h-8 px-6"
					>
						{saving ? "保存中..." : "保存"}
					</Button>
				</div>
			</div>
		</div>
	);
}
