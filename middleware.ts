import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
	// レスポンスヘッダーにパス情報を追加
	const response = NextResponse.next();
	response.headers.set("x-pathname", request.nextUrl.pathname);
	return response;
}
