"use client";

import { useEffect, useState } from "react";
import { validateYaml, type YamlValidationResult } from "@/lib/utils/yaml";

type UseYamlValidationOptions = {
	debounceMs?: number;
	required?: boolean;
	requiredMessage?: string;
};

export function useYamlValidation(
	value: string,
	options: UseYamlValidationOptions = {}
): YamlValidationResult {
	const { debounceMs = 300, required = false, requiredMessage = "必須です" } = options;
	const [diag, setDiag] = useState<YamlValidationResult>({ ok: true });

	useEffect(() => {
		const timer = window.setTimeout(() => {
			if (!value.trim()) {
				if (required) {
					setDiag({ ok: false, message: requiredMessage });
				} else {
					setDiag({ ok: true });
				}
				return;
			}
			setDiag(validateYaml(value));
		}, debounceMs);

		return () => window.clearTimeout(timer);
	}, [value, debounceMs, required, requiredMessage]);

	return diag;
}
