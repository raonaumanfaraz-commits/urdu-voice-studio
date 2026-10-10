import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

type LemonEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired";

function planFromVariantName(variantName: string, productName?: string): {
  plan: "free" | "starter" | "pro";
  charsLimit: number;
} {
  const combined = `${variantName} ${productName ?? ""}`.toLowerCase();
  if (combined.includes("pro")) return { plan: "pro", charsLimit: 500_000 };
  if (combined.includes("starter")) return { plan: "starter", charsLimit: 100_000 };
  return { plan: "free", charsLimit: 5_000 };
}

export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[lemon/webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: {
    meta: {
      event_name: LemonEvent | string;
      custom_data?: { user_id?: string; userId?: string };
    };
    data: {
      attributes: {
        user_email?: string;
        variant_name?: string;
        product_name?: string;
        status?: string;
        ends_at?: string | null;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.meta?.event_name;
  const customData = payload.meta?.custom_data;
  const userId = customData?.user_id ?? customData?.userId;
  const userEmail = payload.data?.attributes?.user_email;
  const variantName = payload.data?.attributes?.variant_name ?? "";
  const productName = payload.data?.attributes?.product_name ?? "";

  if (!userId && !userEmail) {
    console.warn("[lemon/webhook] No user identifier in payload");
    return NextResponse.json({ ok: true });
  }

  // Resolve user profile
  let profileId: string | null = null;

  if (userId) {
    profileId = userId;
  } else if (userEmail) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
    profileId = data?.id ?? null;
  }

  if (!profileId) {
    console.warn("[lemon/webhook] Could not resolve profile for event", event);
    return NextResponse.json({ ok: true });
  }

  if (event === "subscription_created" || event === "subscription_updated") {
    const status = payload.data?.attributes?.status;
    if (status === "cancelled" || status === "expired" || status === "unpaid") {
      await supabaseAdmin
        .from("profiles")
        .update({
          plan: "free",
          chars_limit: 5_000,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    } else {
      const { plan, charsLimit } = planFromVariantName(variantName, productName);
      await supabaseAdmin
        .from("profiles")
        .update({
          plan,
          chars_limit: charsLimit,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    }
  } else if (event === "subscription_cancelled" || event === "subscription_expired") {
    await supabaseAdmin
      .from("profiles")
      .update({
        plan: "free",
        chars_limit: 5_000,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);
  }

  return NextResponse.json({ ok: true });
}
