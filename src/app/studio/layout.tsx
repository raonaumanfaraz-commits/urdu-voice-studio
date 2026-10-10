import type { Metadata } from "next";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Studio — Urdu Voice Studio",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
