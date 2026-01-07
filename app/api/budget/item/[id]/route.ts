import { NextResponse } from "next/server";
import { deleteBudgetItem } from "@/app/lib/actions";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    await deleteBudgetItem(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
