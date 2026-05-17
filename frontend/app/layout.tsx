import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "QuantScreen | 리스크 필터링 미국 주식 대시보드",
  description:
    "퀀트 지표 기반 9대 투자 테마 분석 & 상장폐지 위험 종목 자동 필터링",
  keywords: "미국주식, 퀀트분석, PER, PEG, ROE, 배당주, 성장주, 투자",
  openGraph: {
    title: "QuantScreen",
    description: "리스크 필터링 기반 테마별 미국 주식 분석 대시보드",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
