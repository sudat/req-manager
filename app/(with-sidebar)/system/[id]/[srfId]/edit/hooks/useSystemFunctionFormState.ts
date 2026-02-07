import { useState } from "react";
import type {
	SrfCategory,
	SrfStatus,
	EntryPoint,
	SystemDesignItem,
} from "@/lib/domain";
import type { SystemFunction } from "@/lib/domain";
import type { Requirement } from "@/lib/domain/forms";
import type { DesignTarget, SystemDesignItemV2 } from "@/lib/domain/schemas/system-design";
import type { DesignDocumentDraft } from "@/components/forms/design-document-list";
import type { NewDesignItem, CodeRef } from "./types";

const INITIAL_DESIGN_ITEM: NewDesignItem = {
	category: "database",
	title: "",
	description: "",
	priority: "medium",
};

const INITIAL_CODE_REF: CodeRef = {
	githubUrl: "",
	paths: [""],
	note: "",
};

/**
 * システム機能フォームの状態管理フック
 */
export function useSystemFunctionFormState() {
	// ローディング状態
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [existingSrf, setExistingSrf] = useState<SystemFunction | null>(null);

	// 基本情報
	const [category, setCategory] = useState<SrfCategory>("screen");
	const [status, setStatus] = useState<SrfStatus>("not_implemented");
	const [title, setTitle] = useState("");
	const [summary, setSummary] = useState("");
	const [designPolicy, setDesignPolicy] = useState("");

	// システム設計（V2）
	const [designTargets, setDesignTargets] = useState<DesignTarget[]>([]);
	const [designItemsV2, setDesignItemsV2] = useState<SystemDesignItemV2[]>([]);

	// システム設計（レガシー）
	const [systemDesign, setSystemDesign] = useState<SystemDesignItem[]>([]);
	const [newDesignItem, setNewDesignItem] = useState<NewDesignItem>(INITIAL_DESIGN_ITEM);

	// コード参照
	const [codeRefs, setCodeRefs] = useState<CodeRef[]>([]);
	const [newCodeRef, setNewCodeRef] = useState<CodeRef>(INITIAL_CODE_REF);

	// エントリポイント
	const [entryPoints, setEntryPoints] = useState<EntryPoint[]>([]);

	// DD
	const [designDocuments, setDesignDocuments] = useState<DesignDocumentDraft[]>([]);

	// システム要件
	const [systemRequirements, setSystemRequirements] = useState<Requirement[]>([]);

	return {
		// ローディング状態
		loading,
		setLoading,
		saving,
		setSaving,
		error,
		setError,
		existingSrf,
		setExistingSrf,
		// 基本情報
		category,
		setCategory,
		status,
		setStatus,
		title,
		setTitle,
		summary,
		setSummary,
		designPolicy,
		setDesignPolicy,
		// システム設計（V2）
		designTargets,
		setDesignTargets,
		designItemsV2,
		setDesignItemsV2,
		// システム設計（レガシー）
		systemDesign,
		setSystemDesign,
		newDesignItem,
		setNewDesignItem,
		// コード参照
		codeRefs,
		setCodeRefs,
		newCodeRef,
		setNewCodeRef,
		// エントリポイント
		entryPoints,
		setEntryPoints,
		// DD
		designDocuments,
		setDesignDocuments,
		// システム要件
		systemRequirements,
		setSystemRequirements,
	};
}
