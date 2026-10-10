"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic2, FolderOpen, User, LogOut, Menu, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/studio", label: "Studio", icon: Mic2 },
  { href: "/projects", label: "Projects", icon: FolderOpen },
  { href: "/account", label: "Account", icon: User },
];

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 glass border-b border-surface-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/studio" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center group-hover:bg-brand-500 transition-colors">
              <Mic2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-ink text-sm">Urdu Voice Studio</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith(href)
                    ? "bg-brand-600/20 text-brand-400"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-all duration-200 ml-2 border-l border-surface-3 pl-4"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden btn-ghost p-2"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-surface-3 bg-surface-1 px-4 py-3 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith(href)
                  ? "bg-brand-600/20 text-brand-400"
                  : "text-ink-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-ink-muted hover:text-ink hover:bg-surface-2 transition-all w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
