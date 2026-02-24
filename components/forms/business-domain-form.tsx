"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type BusinessDomainFormProps = {
	name: string;
	area: string;
	summary: string;
	error: string | null;
	saving: boolean;
	canSubmit: boolean;
	isAreaValid: boolean;
	cancelHref: string;
	onSubmit: (event: FormEvent) => Promise<void> | void;
	onNameChange: (value: string) => void;
	onAreaChange: (value: string) => void;
	onSummaryChange: (value: string) => void;
};

export function BusinessDomainForm({
	name,
	area,
	summary,
	error,
	saving,
	canSubmit,
	isAreaValid,
	cancelHref,
	onSubmit,
	onNameChange,
	onAreaChange,
	onSummaryChange,
}: BusinessDomainFormProps) {
	return (
		<Card className="p-6">
			<form className="space-y-6" onSubmit={onSubmit}>
				<div className="space-y-2">
					<Label>
						業務名<span className="text-rose-500">*</span>
					</Label>
					<Input
						value={name}
						onChange={(event) => onNameChange(event.target.value)}
						placeholder="例: 債権管理"
						required
					/>
				</div>

				<div className="space-y-2">
					<Label>
						領域コード<span className="text-rose-500">*</span>
					</Label>
					<Input
						value={area}
						onChange={(event) => onAreaChange(event.target.value)}
						placeholder="例: AR_01"
						required
					/>
					{!isAreaValid && area.trim().length > 0 && (
						<p className="text-xs text-rose-600">
							英大文字・数字・_のみ入力できます
						</p>
					)}
				</div>

				<div className="space-y-2">
					<Label>業務概要</Label>
					<Textarea
						value={summary}
						onChange={(event) => onSummaryChange(event.target.value)}
						placeholder="業務の概要を入力"
						className="min-h-[110px]"
					/>
				</div>

				{error && <p className="text-sm text-rose-600">{error}</p>}

				<div className="flex gap-3">
					<Link href={cancelHref}>
						<Button type="button" variant="outline">
							キャンセル
						</Button>
					</Link>
					<Button
						type="submit"
						className="bg-slate-900 hover:bg-slate-800"
						disabled={!canSubmit || saving}
					>
						{saving ? "保存中..." : "保存"}
					</Button>
				</div>
			</form>
		</Card>
	);
}
