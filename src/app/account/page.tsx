"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/types";
import { QuotaBar } from "@/components/ui";
import {
  User, ArrowUpRight, Zap, Shield, Check, Loader2,
} from "lucide-react";

const PLANS = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    chars: "5,000",
    features: ["5k chars/month", "All Urdu & English voices", "MP3 download", "1 project"],
    checkoutUrl: null,
  },
  {
    key: "starter",
    name: "Starter",
    price: "$9/mo",
    chars: "100,000",
    features: ["100k chars/month", "All voices", "MP3 + WAV", "Unlimited projects", "Email support"],
    checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_STARTER,
  },
  {
    key: "pro",
    name: "Pro",
    price: "$29/mo",
    chars: "500,000",
    features: ["500k chars/month", "Priority queue", "MP3 + WAV", "API access (soon)", "Priority support"],
    checkoutUrl: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO,
  },
] as const;

export default function AccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data as Profile);
          setLoading(false);
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-ink-muted">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading account…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64 text-ink-muted text-sm">
        Could not load account. Please refresh.
      </div>
    );
  }

  const currentPlan = PLANS.find((p) => p.key === profile.plan) ?? PLANS[0];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="page-title">Account</h1>
        <p className="text-sm text-ink-muted mt-0.5">Manage your plan and usage</p>
      </div>

      {/* ── Profile card ── */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center shrink-0">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-brand-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">{profile.full_name ?? "User"}</p>
            <p className="text-xs text-ink-muted">{profile.email}</p>
          </div>
          <div className="ml-auto">
            <span
              className={
                profile.plan === "pro"
                  ? "badge-pro"
                  : profile.plan === "starter"
                  ? "badge-starter"
                  : "badge-free"
              }
            >
              {currentPlan.name}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quota card ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-brand-400" />
          <p className="text-sm font-semibold text-ink">Monthly Usage</p>
        </div>
        <QuotaBar used={profile.chars_used} limit={profile.chars_limit} plan={profile.plan} />
        <p className="text-xs text-ink-subtle mt-3">
          Quota resets on the 1st of each month. Unused characters do not roll over.
        </p>
      </div>

      {/* ── Plan cards ── */}
      <div>
        <p className="section-label mb-3">Available Plans</p>
        <div className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.key === profile.plan;
            const isUpgrade =
              (plan.key === "starter" && profile.plan === "free") ||
              (plan.key === "pro" && (profile.plan === "free" || profile.plan === "starter"));

            return (
              <div
                key={plan.key}
                className={`card p-5 flex flex-col ${isCurrent ? "border-brand-600/70" : ""}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-bold text-ink">{plan.name}</p>
                  {isCurrent && (
                    <span className="badge-starter text-[10px]">Current</span>
                  )}
                </div>
                <p className="text-2xl font-extrabold text-ink mb-1">{plan.price}</p>
                <p className="text-xs text-ink-muted mb-4">{plan.chars} chars/mo</p>
                <ul className="space-y-2 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-ink-muted">
                      <Check className="w-3 h-3 text-brand-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="btn-secondary w-full justify-center cursor-default opacity-50 text-xs py-2">
                    Active
                  </div>
                ) : isUpgrade && plan.checkoutUrl ? (
                  <a
                    href={plan.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full justify-center text-xs py-2"
                    id={`btn-upgrade-${plan.key}`}
                  >
                    Upgrade
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Cancel info ── */}
      {profile.plan !== "free" && (
        <div className="card p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-ink-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Cancellation</p>
              <p className="text-xs text-ink-muted leading-relaxed">
                You can cancel your {currentPlan.name} plan at any time from your{" "}
                <strong>Lemon Squeezy customer portal</strong>. Your plan stays active until the end of
                the current billing period, then your account automatically reverts to Free.
              </p>
              <a
                href="https://app.lemonsqueezy.com/my-orders"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost text-xs mt-3 px-0"
                id="btn-manage-billing"
              >
                Manage billing
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Danger zone ── */}
      <div className="card p-5 border-red-900/40">
        <p className="text-sm font-semibold text-red-400 mb-1">Danger Zone</p>
        <p className="text-xs text-ink-muted mb-3">
          Deleting your account is permanent and removes all projects and audio files.
        </p>
        <button
          className="text-xs text-red-500 hover:text-red-400 underline transition-colors"
          onClick={() => alert("To delete your account, please contact support.")}
          id="btn-delete-account"
        >
          Delete my account
        </button>
      </div>
    </div>
  );
}
