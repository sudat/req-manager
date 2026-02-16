const APP_NAME = "要件管理DB";

const TITLE_ROUTES: Array<{ prefix: string; label: string }> = [
	{ prefix: "/product-requirement", label: "プロダクト要件" },
	{ prefix: "/dashboard", label: "ダッシュボード" },
	{ prefix: "/chat", label: "AIチャット" },
	{ prefix: "/ideas", label: "概念辞書" },
	{ prefix: "/tickets", label: "変更要求一覧" },
	{ prefix: "/baseline", label: "ベースライン履歴" },
	{ prefix: "/links", label: "要件リンク" },
	{ prefix: "/schema/er", label: "ER図" },
	{ prefix: "/schema/sequence", label: "シーケンス図" },
	{ prefix: "/export", label: "エクスポート" },
	{ prefix: "/settings", label: "設定" },
	{ prefix: "/projects", label: "設定" },
];

function matchPrefix(pathname: string, prefix: string): boolean {
	if (pathname === prefix) {
		return true;
	}

	return pathname.startsWith(`${prefix}/`);
}

function splitPathSegments(pathname: string): string[] {
	return pathname.split("/").filter(Boolean);
}

function resolveBusinessMenuLabel(pathname: string): string | null {
	if (!matchPrefix(pathname, "/business")) {
		return null;
	}

	const segments = splitPathSegments(pathname);

	if (segments.length === 1 || segments[1] === "create") {
		return "業務一覧";
	}

	if (segments.length >= 3 && segments[2] === "edit") {
		return "業務一覧";
	}

	return "業務一覧（詳細）";
}

function resolveSystemMenuLabel(pathname: string): string | null {
	if (!matchPrefix(pathname, "/system")) {
		return null;
	}

	const segments = splitPathSegments(pathname);

	if (segments.length === 1 || segments[1] === "create") {
		return "システム領域一覧";
	}

	if (segments.length >= 3 && segments[2] === "edit") {
		return "システム領域一覧";
	}

	return "システム機能一覧";
}

export function resolveMenuLabelFromPath(pathname: string): string | null {
	const businessLabel = resolveBusinessMenuLabel(pathname);
	if (businessLabel) return businessLabel;

	const systemLabel = resolveSystemMenuLabel(pathname);
	if (systemLabel) return systemLabel;

	const matchedRoute = TITLE_ROUTES.find((route) =>
		matchPrefix(pathname, route.prefix),
	);

	return matchedRoute?.label ?? null;
}

export function buildDocumentTitle(pathname: string): string {
	const label = resolveMenuLabelFromPath(pathname);

	if (!label) {
		return APP_NAME;
	}

	return `${APP_NAME} | ${label}`;
}
