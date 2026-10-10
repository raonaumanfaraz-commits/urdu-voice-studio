import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign In — Urdu Voice Studio",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <Image
          src="/uvs-glossy-logo.png"
          alt="Urdu Voice Studio"
          width={360}
          height={120}
          priority
          className="h-16 sm:h-20 w-auto object-contain rounded-lg group-hover:opacity-90 transition-opacity"
        />
      </Link>
      {children}
    </div>
  );
}
