import { NextRequest, NextResponse } from "next/server";
import { updateTasksSortOrder } from "@/lib/data/tasks";

export async function POST(request: NextRequest) {
  try {
    const { updates, projectId } = await request.json();

    if (!Array.isArray(updates)) {
      return NextResponse.json(
        { error: "updates must be an array" },
        { status: 400 }
      );
    }

    const { data, error } = await updateTasksSortOrder(updates, projectId);

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
