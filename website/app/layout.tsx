import type { Metadata } from "next";
import { Fraunces, Space_Grotesk, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  variable: "--font-korean",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Transparent Link Client | Glass Window Workspace",
  description:
    "A transparent browser window link client with tags, workspaces, and keyboard control.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${fraunces.variable} ${notoSansKr.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
