import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await deleteSession();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
