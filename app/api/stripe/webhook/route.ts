import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { getAdmin } from "@/lib/auth";
export function verifyStripeSignature(raw: string, sig: string, secret: string, now = Date.now()) {
  const parts = sig.split(",").reduce<Record<string, string[]>>((result, item) => {
    const [key, value] = item.split("=", 2);
    if (key && value) (result[key] ??= []).push(value);
    return result;
  }, {});
  if (!parts.t?.[0] || !parts.v1?.length) return false;
  const age = Math.abs(now / 1000 - Number(parts.t[0]));
  if (age > 86400) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${parts.t[0]}.${raw}`)
    .digest("hex");
  return parts.v1.some(
    (candidate) =>
      expected.length === candidate.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(candidate)),
  );
}
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("stripe-signature") || "";
  if (!process.env.STRIPE_WEBHOOK_SECRET || !sig ||
    !verifyStripeSignature(raw, sig, process.env.STRIPE_WEBHOOK_SECRET))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!event.id || !event.type)
    return NextResponse.json({ error: "Malformed event" }, { status: 400 });
  const db = getAdmin();
  const { error: insertError } = await db
    .from("stripe_events")
    .insert({
      id: event.id,
      type: event.type,
      created_at_event: new Date((event.created || 0) * 1000).toISOString(),
      payload: event,
    });
  if (insertError?.code === "23505")
    return NextResponse.json({ received: true, deduplicated: true });
  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  const obj = event.data?.object || {};
  const company = obj.metadata?.company;
  if (company) {
    const { data: latest } = await db
      .from("stripe_events")
      .select("created_at_event")
      .eq("type", event.type)
      .filter("payload->data->object->metadata->>company", "eq", company)
      .order("created_at_event", { ascending: false })
      .limit(1)
      .maybeSingle();
    const eventTime = new Date((event.created || 0) * 1000).toISOString();
    if (latest?.created_at_event === eventTime) {
      const plan =
        event.type === "customer.subscription.deleted" ||
        obj.status === "canceled"
          ? "free"
          : "paid";
      await db
        .from("companies")
        .update({
          plan,
          subscription_status: obj.status,
          current_period_end: obj.current_period_end
            ? new Date(obj.current_period_end * 1000).toISOString()
            : null,
          last_billing_event_at: eventTime,
        })
        .eq("slug", company)
        .or(`last_billing_event_at.is.null,last_billing_event_at.lte.${eventTime}`)
        .select();
    }
  }
  return NextResponse.json({ received: true });
}
