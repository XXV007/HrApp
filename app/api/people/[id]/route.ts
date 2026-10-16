import { NextResponse } from "next/server";
import { getSupabase, requireCompany } from "@/lib/auth";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireCompany())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { data: row, error } = await (await getSupabase())
    .from("candidates")
    .select("document")
    .eq("id", id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load person" }, { status: 503 });
  const person = row?.document;
  return person ? NextResponse.json(person) : NextResponse.json({ error: "Person not found" }, { status: 404 });
}
