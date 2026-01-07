import { NextResponse } from "next/server";
import { setTotalBudget } from "@/app/lib/actions";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const val = Number(body?.total);
    await setTotalBudget(Number.isFinite(val) ? val : 0);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Failed to set total" },
      { status: 500 }
    );
  }
}
