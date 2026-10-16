import { NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";
export async function GET() {
  const membership = await requireCompany();
  if (!membership)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await (
    await getSupabase()
  )
    .from("companies")
    .select("plan,subscription_status,current_period_end")
    .single();
  return error
    ? NextResponse.json({ error: "Unable to load plan" }, { status: 503 })
    : NextResponse.json(data);
}
