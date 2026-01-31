import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
  title: "Mahjic - The Open Rating System for American Mahjong",
  description:
    "The free, open rating system for American Mahjong. Play at any club, track your skill, and own your rating forever. Clubs: become a Verified Source today.",
  keywords: [
    "mahjong",
    "american mahjong",
    "rating system",
    "elo",
    "mahjong club",
    "mahjong league",
  ],
  authors: [{ name: "Mahjic" }],
  openGraph: {
    title: "Mahjic - The Open Rating System for American Mahjong",
    description:
      "The free, open rating system for American Mahjong. Play at any club, track your skill, and own your rating forever.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
