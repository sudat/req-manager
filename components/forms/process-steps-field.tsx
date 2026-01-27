"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	buildYamlProcessSteps,
	parseYamlProcessSteps,
	type ProcessStepItem,
} from "@/lib/utils/yaml";

type ProcessStepsFieldProps = {
	label: string;
	value: string;
	onChange: (value: string) => void;
	helperText?: string;
	whenPlaceholder?: string;
	whoPlaceholder?: string;
	actionPlaceholder?: string;
};

export function ProcessStepsField({
	label,
	value,
	onChange,
	helperText,
	whenPlaceholder = "いつ（タイミング）",
	whoPlaceholder = "誰が（ロール）",
	actionPlaceholder = "何をするか",
}: ProcessStepsFieldProps): ReactNode {
	const parsed = useMemo(() => parseYamlProcessSteps(value), [value]);
	const [items, setItems] = useState<ProcessStepItem[]>(
		parsed.value.length > 0
			? parsed.value
			: [{ when: "", who: "", action: "" }]
	);

	useEffect(() => {
		const next =
			parsed.value.length > 0
				? parsed.value
				: [{ when: "", who: "", action: "" }];
		setItems(next);
	}, [parsed.value]);

	const commit = (nextItems: ProcessStepItem[]) => {
		setItems(nextItems);
		onChange(buildYamlProcessSteps(nextItems));
	};

	const handleItemChange = (
		index: number,
		key: keyof ProcessStepItem,
		nextValue: string
	) => {
		const nextItems = items.map((item, idx) =>
			idx === index ? { ...item, [key]: nextValue } : item
		);
		commit(nextItems);
	};

	const handleAdd = () => {
		commit([...items, { when: "", who: "", action: "" }]);
	};

	const handleRemove = (index: number) => {
		const nextItems = items.filter((_, idx) => idx !== index);
		commit(nextItems.length > 0 ? nextItems : [{ when: "", who: "", action: "" }]);
	};

	return (
		<div className="space-y-2">
			<Label className="text-[12px] font-medium text-slate-500">{label}</Label>
			<div className="space-y-2">
				{items.map((item, index) => (
					<div
						key={`${label}-${index}`}
						className="grid gap-2 md:grid-cols-[1.2fr_1fr_2fr_auto]"
					>
						<Input
							value={item.when}
							onChange={(e) => handleItemChange(index, "when", e.target.value)}
							placeholder={whenPlaceholder}
							className="text-[14px]"
						/>
						<Input
							value={item.who}
							onChange={(e) => handleItemChange(index, "who", e.target.value)}
							placeholder={whoPlaceholder}
							className="text-[14px]"
						/>
						<Input
							value={item.action}
							onChange={(e) => handleItemChange(index, "action", e.target.value)}
							placeholder={actionPlaceholder}
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
