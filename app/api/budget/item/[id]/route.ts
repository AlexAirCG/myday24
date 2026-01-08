import { NextRequest, NextResponse } from "next/server";
import { deleteBudgetItem } from "@/app/lib/actions";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await deleteBudgetItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
