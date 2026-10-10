"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Loader2, Globe, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createSupabaseBrowserClient();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/studio`,
      },
    });
  }

  if (success) {
    return (
      <div className="card w-full max-w-sm p-8 text-center animate-fade-up">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-ink mb-2">Check your email</h2>
        <p className="text-sm text-ink-muted">
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/auth/login" className="btn-secondary mt-6 inline-flex">Back to Sign In</Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm p-8 animate-fade-up">
      <h1 className="text-xl font-bold text-ink mb-1">Create account</h1>
      <p className="text-sm text-ink-muted mb-6">Free — 5,000 characters to start</p>

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="btn-secondary w-full mb-4"
        id="btn-google-register"
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

      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="section-label mb-1.5 block" htmlFor="full-name">Full name</label>
          <input
            id="full-name"
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </div>
        <div>
          <label className="section-label mb-1.5 block" htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
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
          <label className="section-label mb-1.5 block" htmlFor="reg-password">Password</label>
          <input
            id="reg-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            minLength={8}
            required
            autoComplete="new-password"
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
          id="btn-register-submit"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create free account
        </button>
      </form>

      <p className="text-xs text-ink-muted text-center mt-5">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
