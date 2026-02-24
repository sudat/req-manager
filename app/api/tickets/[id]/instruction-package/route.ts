import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getChangeRequestById, updateChangeRequestStatus } from "@/lib/data/change-requests";
import {
  buildModificationPackage,
  renderModificationPackageMarkdown,
} from "@/lib/data/modification-packages";
import { CURRENT_PROJECT_ID_KEY, DEFAULT_PROJECT_ID } from "@/lib/constants/project";

const toErrorStatus = (message: string): number => {
  if (message.includes("疑義リンク")) return 409;
  if (message.includes("影響調査")) return 409;
  if (message.includes("変更要求")) return 404;
  return 400;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: changeRequestId } = await params;
    const cookieStore = await cookies();
    const projectId = cookieStore.get(CURRENT_PROJECT_ID_KEY)?.value ?? DEFAULT_PROJECT_ID;
    const format = request.nextUrl.searchParams.get("format") ?? "markdown";

    const { data: changeRequest } = await getChangeRequestById(changeRequestId, projectId);
    if (!changeRequest) {
      return NextResponse.json({ error: "変更要求が見つかりません" }, { status: 404 });
    }
    if (changeRequest.status === "open") {
      return NextResponse.json(
        { error: "影響調査が未完了です。先に影響調査を実行してください" },
        { status: 409 }
      );
    }

    const { data: modificationPackage, error } = await buildModificationPackage(
      changeRequestId,
      projectId
    );
    if (error || !modificationPackage) {
      return NextResponse.json({ error: error ?? "改修指示パッケージの生成に失敗しました" }, { status: toErrorStatus(error ?? "") });
    }

    if (changeRequest.status === "review") {
      await updateChangeRequestStatus(changeRequestId, "approved", projectId);
    }

    if (format === "json") {
      return NextResponse.json({ package: modificationPackage }, { status: 200 });
    }

    const markdown = renderModificationPackageMarkdown(modificationPackage);
    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="instruction-package-${changeRequestId}.md"`,
      },
    });
  } catch (error) {
    console.error("Instruction package generation error:", error);
    return NextResponse.json({ error: "改修指示パッケージの生成に失敗しました" }, { status: 500 });
  }
}
