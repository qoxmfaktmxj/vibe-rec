import type { Metadata } from "next";
import { IBM_Plex_Mono, Sora } from "next/font/google";
import "./globals.css";

const body = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const headline = Sora({
  variable: "--font-headline",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Vibe Rec",
  description: "Precision-first recruiting workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${headline.variable} ${body.variable} ${mono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
