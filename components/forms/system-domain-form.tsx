"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SystemDomainFormProps = {
	mode: "create" | "edit";
	domainId: string;
	name: string;
	description: string;
	sortOrder: number;
	error: string | null;
	saving: boolean;
	canSubmit: boolean;
	isCodeValid?: boolean;
	cancelHref: string;
	onSubmit: (event: FormEvent) => Promise<void> | void;
	onDomainIdChange?: (value: string) => void;
	onNameChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onSortOrderChange: (value: number) => void;
};

export function SystemDomainForm({
	mode,
	domainId,
	name,
	description,
	sortOrder,
	error,
	saving,
	canSubmit,
	isCodeValid = true,
	cancelHref,
	onSubmit,
	onDomainIdChange,
	onNameChange,
	onDescriptionChange,
	onSortOrderChange,
}: SystemDomainFormProps) {
	const isCreateMode = mode === "create";

	return (
		<Card className="p-6">
			<form className="space-y-6" onSubmit={onSubmit}>
				<div className="space-y-2">
					<Label>
						コード{isCreateMode && <span className="text-rose-500">*</span>}
					</Label>
					<Input
						value={domainId}
						onChange={(event) => onDomainIdChange?.(event.target.value)}
						placeholder="例: AR"
						required={isCreateMode}
						disabled={!isCreateMode}
					/>
					{isCreateMode ? (
						!isCodeValid && domainId.trim().length > 0 ? (
							<p className="text-xs text-rose-600">
								英字と記号（-、_）のみ入力できます
							</p>
						) : null
					) : (
						<p className="text-xs text-slate-500">コードは変更できません</p>
					)}
				</div>

				<div className="space-y-2">
					<Label>
						名称<span className="text-rose-500">*</span>
					</Label>
					<Input
						value={name}
						onChange={(event) => onNameChange(event.target.value)}
						placeholder="例: 債権管理"
						required
					/>
				</div>

				<div className="space-y-2">
					<Label>説明</Label>
					<Input
						value={description}
						onChange={(event) => onDescriptionChange(event.target.value)}
						placeholder="例: 売掛金管理、請求書発行、入金消込、債権回収"
					/>
				</div>

				<div className="space-y-2">
					<Label>表示順</Label>
					<Input
						type="number"
						value={String(sortOrder)}
						onChange={(event) =>
							onSortOrderChange(Number(event.target.value) || 0)
						}
						placeholder="例: 1"
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
