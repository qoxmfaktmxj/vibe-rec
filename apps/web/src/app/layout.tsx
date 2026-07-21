import type { Metadata } from "next";
import { Sora, Spline_Sans_Mono } from "next/font/google";

import "wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css";
import "./globals.css";

const headline = Sora({
  variable: "--font-headline-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = Spline_Sans_Mono({
  variable: "--font-mono-spline",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "HireFlow",
  description: "채용 운영과 지원 경험을 한 흐름으로 연결하는 HireFlow 워크스페이스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${headline.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
