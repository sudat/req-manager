import { supabase } from "@/lib/supabase/client";
import { failIfMissingConfig } from "./crud-factory";

export type KeyLabelContext = "product_requirement" | "design_document_details";

type KeyLabelMappingRow = {
	id: string;
	project_id: string;
	context: KeyLabelContext;
	physical_key: string;
	logical_label: string;
	created_at: string;
	updated_at: string;
};

const normalizePhysicalKey = (value: string): string =>
	value
		.trim()
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2")
		.replace(/[-\s]+/g, "_")
		.toLowerCase();

export const listKeyLabelMappings = async (
	projectId: string,
	context: KeyLabelContext
): Promise<{ data: Record<string, string> | null; error: string | null }> => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const { data, error } = await supabase
		.from("key_label_mappings")
		.select("physical_key, logical_label")
		.eq("project_id", projectId)
		.eq("context", context);

	if (error) return { data: null, error: error.message };

	const mapped = (data as Array<Pick<KeyLabelMappingRow, "physical_key" | "logical_label">>).reduce<
		Record<string, string>
	>((acc, row) => {
		acc[row.physical_key] = row.logical_label;
		return acc;
	}, {});

	return { data: mapped, error: null };
};

export const upsertKeyLabelMappings = async (input: {
	projectId: string;
	context: KeyLabelContext;
	mappings: Record<string, string>;
}): Promise<{ data: true | null; error: string | null }> => {
	const configError = failIfMissingConfig();
	if (configError) return configError;

	const rows = Object.entries(input.mappings)
		.map(([physicalKey, logicalLabel]) => ({
			project_id: input.projectId,
			context: input.context,
			physical_key: normalizePhysicalKey(physicalKey),
			logical_label: logicalLabel.trim(),
		}))
		.filter((row) => row.physical_key.length > 0 && row.logical_label.length > 0);

	if (rows.length === 0) {
		return { data: true, error: null };
	}

	const { error } = await supabase
		.from("key_label_mappings")
		.upsert(rows, { onConflict: "project_id,context,physical_key" });

	if (error) return { data: null, error: error.message };
	return { data: true, error: null };
};
