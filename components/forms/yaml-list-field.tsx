"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildYamlIdList, parseYamlIdList } from "@/lib/utils/yaml";

type YamlListFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	itemPlaceholder?: string;
	helperText?: string;
	addLabel?: string;
};

export function YamlListField({
	label,
	value,
	onChange,
	itemPlaceholder = "項目を入力",
	helperText,
	addLabel = "追加",
}: YamlListFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlIdList(value), [value]);
	const [items, setItems] = useState<string[]>(
		parsed.value.length > 0 ? parsed.value : [""]
	);

	useEffect(() => {
		const next = parsed.value.length > 0 ? parsed.value : [""];
		setItems(next);
	}, [parsed.value]);

	const commit = (nextItems: string[]) => {
		setItems(nextItems);
		onChange(buildYamlIdList(nextItems));
	};

	const handleItemChange = (index: number, nextValue: string) => {
		const nextItems = items.map((item, idx) => (idx === index ? nextValue : item));
		commit(nextItems);
	};

	const handleAdd = () => {
		commit([...items, ""]);
	};

	const handleRemove = (index: number) => {
		const nextItems = items.filter((_, idx) => idx !== index);
		commit(nextItems.length > 0 ? nextItems : [""]);
	};

	return (
		<div className="space-y-2">
			<Label className="text-[12px] font-medium text-slate-500">{label}</Label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div key={`${label}-${index}`} className="flex gap-2">
						<Input
							value={item}
							onChange={(e) => handleItemChange(index, e.target.value)}
							placeholder={itemPlaceholder}
							className="text-[14px]"
						/>
						<Button
							type="button"
							variant="outline"
							className="h-9 px-3 text-[12px]"
							onClick={() => handleRemove(index)}
						>
							削除
						</Button>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					className="h-8 text-[12px]"
					onClick={handleAdd}
				>
					{addLabel}
				</Button>
			</div>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					既存のYAMLに構文エラーがあります。再保存すると上書きされます。
				</p>
			)}
		</div>
	);
}
