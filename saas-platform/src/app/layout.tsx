import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VibeTune | Your Mood, Curated by the Sky",
  description: "VibeTune harmonizes your environment with AI-driven weather music.",
  icons: {
    icon: [
      { url: "/assets/brand/vibetune_logo.png", type: "image/png", sizes: "any" },
      { url: "/assets/brand/vibetune_logo.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/assets/brand/vibetune_logo.png",
    apple: "/assets/brand/vibetune_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/assets/brand/vibetune_logo.png" sizes="any" />
          <link rel="apple-touch-icon" href="/assets/brand/vibetune_logo.png" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
