"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	buildYamlKeySourceList,
	parseYamlKeySourceList,
	type KeySourceItem,
} from "@/lib/utils/yaml";

type KeySourceListFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	namePlaceholder?: string;
	sourcePlaceholder?: string;
	helperText?: string;
};

export function KeySourceListField({
	label,
	value,
	onChange,
	namePlaceholder = "名称を入力",
	sourcePlaceholder = "ソースを入力",
	helperText,
}: KeySourceListFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlKeySourceList(value), [value]);
	const [items, setItems] = useState<KeySourceItem[]>(
		parsed.value.length > 0 ? parsed.value : [{ name: "", source: "" }]
	);

	useEffect(() => {
		const next = parsed.value.length > 0 ? parsed.value : [{ name: "", source: "" }];
		setItems(next);
	}, [parsed.value]);

	const commit = (nextItems: KeySourceItem[]) => {
		setItems(nextItems);
		onChange(buildYamlKeySourceList(nextItems));
	};

	const handleItemChange = (index: number, key: "name" | "source", nextValue: string) => {
		const nextItems = items.map((item, idx) =>
			idx === index ? { ...item, [key]: nextValue } : item
		);
		commit(nextItems);
	};

	const handleAdd = () => {
		commit([...items, { name: "", source: "" }]);
	};

	const handleRemove = (index: number) => {
		const nextItems = items.filter((_, idx) => idx !== index);
		commit(nextItems.length > 0 ? nextItems : [{ name: "", source: "" }]);
	};

	return (
		<div className="space-y-2">
			<Label className="text-[12px] font-medium text-slate-500">{label}</Label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div key={`${label}-${index}`} className="flex gap-2">
						<Input
							value={item.name}
							onChange={(e) => handleItemChange(index, "name", e.target.value)}
							placeholder={namePlaceholder}
							className="text-[14px]"
						/>
						<Input
							value={item.source}
							onChange={(e) => handleItemChange(index, "source", e.target.value)}
							placeholder={sourcePlaceholder}
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
				<Button type="button" variant="outline" className="h-8 text-[12px]" onClick={handleAdd}>
					追加
				</Button>
			</div>
			{helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
			{parsed.error && (
				<p className="text-[12px] text-rose-600">
					既存のYAMLに構文エラーがあります。表示は概算です。
				</p>
			)}
		</div>
	);
}
