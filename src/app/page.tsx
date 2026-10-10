import Link from "next/link";
import { Mic2, Zap, Globe, Shield, ChevronRight, Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Urdu Voice Studio — Natural Urdu Text-to-Speech",
  description:
    "Type your Urdu script, get a natural-sounding voice-over in seconds. Powered by Google Cloud TTS Chirp3-HD.",
};

const FEATURES = [
  {
    icon: Mic2,
    title: "Chirp3-HD Quality",
    description:
      "Google's latest neural TTS model delivers remarkably natural Urdu pronunciation and intonation.",
  },
  {
    icon: Zap,
    title: "Instant Synthesis",
    description:
      "Generate broadcast-quality audio in seconds, not minutes. Download as MP3 or WAV instantly.",
  },
  {
    icon: Globe,
    title: "RTL-Native Editor",
    description:
      "Our editor handles Urdu, Roman Urdu, and English scripts seamlessly with correct directionality.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Your scripts are end-to-end protected. API keys never leave the server.",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "",
    chars: "5,000",
    description: "Try the studio with no commitment",
    cta: "Start free",
    ctaHref: "/auth/register",
    features: [
      "5,000 characters / month",
      "All Urdu & English voices",
      "MP3 download",
      "1 saved project",
    ],
    highlight: false,
  },
  {
    name: "Starter",
    price: "$9",
    period: "/mo",
    chars: "100,000",
    description: "For podcasters and content creators",
    cta: "Get started",
    ctaHref: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_STARTER ?? "/auth/register",
    features: [
      "100,000 characters / month",
      "All Urdu & English voices",
      "MP3 + WAV download",
      "Unlimited saved projects",
      "Speed & pitch control",
      "Email support",
    ],
    highlight: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    chars: "500,000",
    description: "For studios and agencies",
    cta: "Go Pro",
    ctaHref: process.env.NEXT_PUBLIC_LEMON_CHECKOUT_PRO ?? "/auth/register",
    features: [
      "500,000 characters / month",
      "All voices, priority queue",
      "MP3 + WAV download",
      "Unlimited projects",
      "API access (coming soon)",
      "Priority support",
    ],
    highlight: false,
  },
];

const FAQ = [
  {
    q: "Which Urdu voices are available?",
    a: "We offer all Google Cloud TTS Urdu voices across Chirp3-HD, WaveNet (ur-IN-Wavenet-A/B), and Standard (ur-IN-Standard-A/B) models. WaveNet and Standard voices support custom pitch modulation, while Chirp3-HD offers high-definition studio clarity.",
  },
  {
    q: "What is a 'character'?",
    a: "One character = one Unicode code point in your script (letters, spaces, punctuation). Your monthly quota counts the total characters of all scripts you synthesize.",
  },
  {
    q: "Can I use Roman Urdu or English?",
    a: "Yes. The editor accepts Urdu script (RTL), Roman Urdu, and English. The voice you pick determines the accent and language rendering.",
  },
  {
    q: "Is my API key safe?",
    a: "Absolutely. Your Google TTS API key lives only on our server in a restricted environment variable and is never sent to the browser.",
  },
  {
    q: "What audio formats are supported?",
    a: "MP3 for all plans. WAV is available on Starter and Pro.",
  },
  {
    q: "How do I cancel my subscription?",
    a: "You can cancel anytime from the Account page. Your plan stays active until the end of the billing period, then reverts to Free.",
  },
];

// Sample demo voices (pre-recorded blobs would replace these in production)
const DEMO_VOICES = [
  { label: "Female — Achernar (Chirp3-HD)", name: "ur-IN-Chirp3-HD-Achernar", desc: "Clear, warm female voice" },
  { label: "Male — Achird (Chirp3-HD)", name: "ur-IN-Chirp3-HD-Achird", desc: "Deep, authoritative male voice" },
  { label: "Female — WaveNet A", name: "ur-IN-Wavenet-A", desc: "Expressive female voice with pitch control" },
  { label: "Male — WaveNet B", name: "ur-IN-Wavenet-B", desc: "Natural male voice with pitch control" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface text-ink">
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 glass border-b border-surface-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Mic2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink text-sm">Urdu Voice Studio</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-ink-muted">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#pricing" className="hover:text-ink transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-ink transition-colors">FAQ</a>
            <Link href="/auth/login" className="hover:text-ink transition-colors">Sign in</Link>
            <Link href="/auth/register" className="btn-primary py-2 text-xs">Get started free</Link>
          </nav>
          <Link href="/auth/register" className="sm:hidden btn-primary py-2 text-xs">Start free</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-900/60 border border-brand-700/40 text-brand-300 text-xs font-semibold mb-6 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse-slow" />
            Chirp3-HD · ur-IN voices · Live
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-ink leading-tight mb-5 animate-fade-up">
            Type your script,<br />
            <span className="text-gradient">hear it in Urdu</span>
          </h1>

          <p className="text-lg text-ink-muted max-w-2xl mx-auto mb-8 animate-fade-up animate-delay-100">
            Natural-sounding Urdu voice-overs in seconds — powered by Google Cloud TTS Chirp3-HD.
            No recording studio needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up animate-delay-200">
            <Link href="/auth/register" className="btn-primary text-base px-7 py-3" id="hero-cta">
              Start for free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link href="#demo" className="btn-ghost text-base px-7 py-3">
              Hear a sample
            </Link>
          </div>
        </div>
      </section>

      {/* ── Demo player ── */}
      <section id="demo" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="card p-6">
          <p className="section-label mb-4">Voice Samples</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {DEMO_VOICES.map((v) => (
              <div key={v.name} className="bg-surface-2 rounded-xl p-4 border border-surface-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">{v.label}</p>
                    <p className="text-xs text-ink-muted">{v.desc}</p>
                  </div>
                  <span className="badge-starter ml-2">{v.name.includes("Achernar") ? "Female" : "Male"}</span>
                </div>
                <p className="text-xs text-ink-subtle mb-3 font-mono bg-surface-3 rounded px-2 py-1">
                  {v.name}
                </p>
                <p className="text-sm text-ink-muted italic">
                  Sample audio available after you sign in and generate your first voice-over.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Why Urdu Voice Studio</p>
          <h2 className="text-3xl font-bold text-ink">Everything you need for Urdu TTS</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className="card p-5 hover:border-brand-600/50 transition-all duration-300"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-9 h-9 rounded-lg bg-brand-600/15 flex items-center justify-center mb-4">
                <Icon className="w-4.5 h-4.5 text-brand-400" />
              </div>
              <h3 className="text-sm font-semibold text-ink mb-2">{title}</h3>
              <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Pricing</p>
          <h2 className="text-3xl font-bold text-ink">Simple, transparent pricing</h2>
          <p className="text-ink-muted mt-2 text-sm">No hidden fees. Cancel any time.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`card p-7 flex flex-col ${
                plan.highlight
                  ? "border-brand-600/70 shadow-xl shadow-brand-900/30 relative"
                  : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-starter px-3 py-1 text-xs">Most popular</span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-1">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-ink">{plan.price}</span>
                  {plan.period && <span className="text-ink-muted text-sm">{plan.period}</span>}
                </div>
                <p className="text-xs text-ink-subtle mt-1">{plan.description}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-muted">
                    <Check className="w-3.5 h-3.5 text-brand-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={plan.highlight ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
                id={`pricing-cta-${plan.name.toLowerCase()}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="text-center mb-10">
          <p className="section-label mb-3">FAQ</p>
          <h2 className="text-3xl font-bold text-ink">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="card group cursor-pointer"
            >
              <summary className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-ink list-none select-none">
                {q}
                <ChevronRight className="w-4 h-4 text-ink-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="px-5 pb-4 text-sm text-ink-muted leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-3 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-subtle">
          <div className="flex items-center gap-2">
            <Mic2 className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-ink-muted">Urdu Voice Studio</span>
          </div>
          <p>© {new Date().getFullYear()} Urdu Voice Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-ink-muted transition-colors">Privacy</a>
            <a href="#" className="hover:text-ink-muted transition-colors">Terms</a>
            <a href="#" className="hover:text-ink-muted transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
