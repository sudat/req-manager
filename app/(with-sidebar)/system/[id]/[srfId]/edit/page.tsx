"use client";

import { use } from "react";
import { redirect } from "next/navigation";

/**
 * 旧システム機能編集ページ（後方互換用リダイレクト）
 *
 * 編集機能は以下の3つのページに分割されました:
 * - /system/[id]/[srfId]/edit/basic - 基本情報編集
 * - /system/[id]/[srfId]/edit/requirements - システム要件編集
 * - /system/[id]/[srfId]/edit/design-documents - DD編集
 *
 * このページへのアクセスは詳細画面にリダイレクトされます。
 */
export default function SystemFunctionEditPage({
	params,
}: {
	params: Promise<{ id: string; srfId: string }>;
}) {
	const { id, srfId } = use(params);
	redirect(`/system/${id}/${srfId}`);
}
