import { NextResponse } from "next/server";
import { getCandidates } from "@/lib/data";
import { requireCompany } from "@/lib/auth";
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireCompany())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const person = getCandidates().find(c => c.id === id);
  return person ? NextResponse.json(person) : NextResponse.json({ error: "Person not found" }, { status: 404 });
}
