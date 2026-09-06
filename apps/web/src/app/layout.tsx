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
        <template
          data-impeccable-direction="4062e4e4"
          dangerouslySetInnerHTML={{
            __html:
              "<!-- THESIS: 지원의 전 과정을 하나의 커리어 시그널로 보이며 카드형 SaaS 첫 화면을 거부한다. OWN-WORLD: 강한 시그널 블루, 라임 행동색, 잉크와 종이색, 궤도와 인덱스형 공고 행. STORY: 열린 역할을 발견하고 비교한 뒤 지원과 다음 단계를 같은 흐름으로 이해한다. FIRST VIEWPORT: 왼쪽의 대형 한국어 명제, 오른쪽의 실제 공고 시그널 맵, 아래의 단일 행동. FORM: 커리어 시그널 아틀라스, grounded direction 5, seed 4062e4e4. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance -->",
          }}
        />
        {children}
      </body>
    </html>
  );
}
