import type { Metadata } from "next";
import AppNav from "@/components/AppNav";

export const metadata: Metadata = { title: "Projects — Urdu Voice Studio" };

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <AppNav />
      <main className="flex-1">{children}</main>
    </div>
  );
}
