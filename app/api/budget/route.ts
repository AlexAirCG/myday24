import { NextResponse } from "next/server";
import { loadBudget } from "@/app/lib/actions";

export async function GET() {
  try {
    const data = await loadBudget();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to load budget" },
      { status: 500 }
    );
  }
}
