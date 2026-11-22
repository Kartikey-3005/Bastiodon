import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bastiodon - Child Cyber Safety & Parental Monitoring SaaS",
  description: "Real-time AI-powered child cyber safety, live content scanner, and browser extension control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}

