import { NextResponse } from "next/server";
import { getSupabase, requireUser } from "@/lib/auth";
export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await (
    await getSupabase()
  )
    .from("companies")
    .select("plan,subscription_status,current_period_end")
    .single();
  return error
    ? NextResponse.json({ plan: "free", subscription_status: "inactive" })
    : NextResponse.json(data);
}
