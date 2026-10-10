"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Loader2, Globe } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/studio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
      },
    });
  }

  return (
    <div className="card w-full max-w-sm p-8 animate-fade-up">
      <h1 className="text-xl font-bold text-ink mb-1">Sign in</h1>
      <p className="text-sm text-ink-muted mb-6">Access your Urdu Voice Studio</p>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="btn-secondary w-full mb-4"
        id="btn-google-login"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-surface-4" />
        <span className="text-xs text-ink-subtle">or</span>
        <div className="flex-1 h-px bg-surface-4" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label className="section-label mb-1.5 block" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="section-label mb-1.5 block" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
          id="btn-email-login"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign in
        </button>
      </form>

      <p className="text-xs text-ink-muted text-center mt-5">
        Don&apos;t have an account?{" "}
        <Link href="/auth/register" className="text-brand-400 hover:text-brand-300 font-medium">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
