import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import crypto from "crypto";

type LemonEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired";

function planFromVariantName(variantName: string): {
  plan: "free" | "starter" | "pro";
  charsLimit: number;
} {
  const lower = variantName.toLowerCase();
  if (lower.includes("pro")) return { plan: "pro", charsLimit: 500_000 };
  if (lower.includes("starter")) return { plan: "starter", charsLimit: 100_000 };
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

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let payload: {
    meta: { event_name: LemonEvent; custom_data?: { user_id?: string } };
    data: {
      attributes: {
        user_email?: string;
        variant_name?: string;
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

  const event = payload.meta.event_name;
  const userId = payload.meta.custom_data?.user_id;
  const userEmail = payload.data.attributes.user_email;
  const variantName = payload.data.attributes.variant_name ?? "";

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
      .single();
    profileId = data?.id ?? null;
  }

  if (!profileId) {
    console.warn("[lemon/webhook] Could not resolve profile for event", event);
    return NextResponse.json({ ok: true });
  }

  if (event === "subscription_created" || event === "subscription_updated") {
    const { plan, charsLimit } = planFromVariantName(variantName);
    await supabaseAdmin
      .from("profiles")
      .update({ plan, chars_limit: charsLimit })
      .eq("id", profileId);
  } else if (event === "subscription_cancelled" || event === "subscription_expired") {
    await supabaseAdmin
      .from("profiles")
      .update({ plan: "free", chars_limit: 5_000 })
      .eq("id", profileId);
  }

  return NextResponse.json({ ok: true });
}
