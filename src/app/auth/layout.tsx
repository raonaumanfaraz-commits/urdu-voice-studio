import type { Metadata } from "next";
import Link from "next/link";
import { Mic2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In — Urdu Voice Studio",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-ink text-lg">Urdu Voice Studio</span>
      </Link>
      {children}
    </div>
  );
}
