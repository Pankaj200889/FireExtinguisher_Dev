import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Using Inter as standard
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fire Safety Inspector",
  description: "IS 2190:2024 Compliant Extinguisher Management",
  manifest: "/manifest.json",
  // Viewport usually in layout for Next 14 via export, but let's stick to simple first
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
