import { NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";

export async function GET() {
  const membership = await requireCompany();
  if (!membership) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await (await getSupabase())
    .from("profiles")
    .select("full_name,role,companies(name,plan,subscription_status,current_period_end)")
    .eq("id", membership.user.id)
    .single();
  if (error || !data) return NextResponse.json({ error: "Unable to load profile" }, { status: 503 });
  return NextResponse.json(data);
}
