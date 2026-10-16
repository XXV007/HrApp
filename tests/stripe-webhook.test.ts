import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/app/api/stripe/webhook/route";

describe("Stripe webhook signatures", () => {
  const now = 1_700_000_000_000;
  const secret = "whsec_test";
  const payload = JSON.stringify({ id: "evt_test", type: "test.event" });

  function signature(timestamp: number, body = payload) {
    return crypto
      .createHmac("sha256", secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");
  }

  it("accepts a valid signed payload", () => {
    const timestamp = now / 1000;
    expect(
      verifyStripeSignature(
        payload,
        `t=${timestamp},v1=${signature(timestamp)}`,
        secret,
        now,
      ),
    ).toBe(true);
  });

  it("rejects tampered, malformed, and expired signatures", () => {
    const timestamp = now / 1000;
    expect(
      verifyStripeSignature(
        payload + " ",
        `t=${timestamp},v1=${signature(timestamp)}`,
        secret,
        now,
      ),
    ).toBe(false);
    expect(verifyStripeSignature(payload, "not-a-signature", secret, now)).toBe(
      false,
    );
    expect(
      verifyStripeSignature(
        payload,
        `t=${timestamp - 86401},v1=${signature(timestamp - 86401)}`,
        secret,
        now,
      ),
    ).toBe(false);
  });
});
