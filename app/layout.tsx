import type { Metadata } from 'next'
import { Noto_Sans_TC, Noto_Serif_TC, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const notoSansTC = Noto_Sans_TC({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-noto-sans',
  display: 'swap',
})

const notoSerifTC = Noto_Serif_TC({
  weight: ['600', '900'],
  subsets: ['latin'],
  variable: '--font-noto-serif',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '台股市值型 ETF 訊號站 | 月線乖離率回測分析',
  description:
    '以月線乖離率（20日均線）為核心，提供台股市值型ETF（0050、006208、00631L等）歷史回測勝率、季節性分析與當前訊號，僅供教育研究參考，非投資建議。',
  openGraph: {
    title: '台股市值型 ETF 訊號站',
    description: '月線乖離率回測分析 · 0050 / 00631L / 正2 / 反1',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW" className={`${notoSansTC.variable} ${notoSerifTC.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        {/* AdSense — Header Banner (hidden until ad account is ready) */}
        <div style={{ display: 'none' }}>
          {/* Replace with Google AdSense ins tag — 728×90 leaderboard */}
        </div>

        <div className="relative w-full flex flex-col items-center">{children}</div>
      </body>
    </html>
  )
}
