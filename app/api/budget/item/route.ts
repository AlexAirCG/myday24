import { NextResponse } from "next/server";
import { addBudgetItem, updateBudgetItemPercent } from "@/app/lib/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title = String(body?.title || "");
    const row = await addBudgetItem(title);
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = String(body?.id || "");
    const percent = Number(body?.percent);
    await updateBudgetItemPercent(id, percent);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to update item" },
      { status: 500 }
    );
  }
}
