import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Urdu Voice Studio — Natural Urdu Text-to-Speech",
  description:
    "Type your script, get a natural-sounding Urdu voice-over in seconds. Powered by Google Cloud TTS Chirp3-HD voices.",
  keywords: ["Urdu TTS", "Urdu text to speech", "Urdu voice over", "ur-IN"],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "Urdu Voice Studio",
    description: "Natural-sounding Urdu voice-overs in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
