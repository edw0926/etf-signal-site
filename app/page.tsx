import { getAllETFs, getSignalsData } from '@/lib/data'
import { ETFData } from '@/types/etf'
import ETFCard from '@/components/ETFCard'
import Glossary from '@/components/Glossary'

export const dynamic = 'force-static'

export default function Home() {
  const data = getSignalsData()
  const etfs = Object.values(data.etfs)

  const base = etfs.filter(e => e.type === 'base')
  const lev2 = etfs.filter(e => e.type === 'lev2')
  const inv1 = etfs.filter(e => e.type === 'inv1')

  return (
    <main style={{ width: '100%', maxWidth: '1020px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '72px' }}>
      {/* Header */}
      <header className="pt-10 pb-10" style={{ borderBottom: '1px solid var(--border)', marginBottom: '36px' }}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-[30px] font-black tracking-tight leading-tight mb-3">
              台股市值型 ETF 訊號站
            </h1>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '460px' }}>
              每日更新，以 20 日均線乖離率判斷現在買進是偏貴還是偏便宜。
              偏低估區間（≤ −5%）進場，歷史勝率較高；偏高估區間（≥ +5%）建議減少加碼，靜待回調。
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 pt-1">
            <div className="text-[12px] flex items-center gap-2" style={{ color: 'var(--muted)' }}>
              <span className="live-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--green)' }} />
              數據更新 <span className="font-mono">{data.updated_at}</span>
            </div>
            <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>
              歷史統計 · 僅供參考 · 非投資建議
            </div>
          </div>
        </div>
      </header>

      {/* 市場訊號總覽 */}
      <MarketOverview etfs={etfs} />

      <Section accent="var(--blue)" title="基礎市值型" desc="追蹤台灣50指數，適合長期定期定額">
        <ETFGrid etfs={base} startDelay={40} maxCols={2} />
      </Section>

      <Section accent="var(--green)" title="正2 槓桿型" desc="單日放大 2 倍報酬，有波動耗損，適合短中線，需開立信用帳戶">
        <ETFGrid etfs={lev2} startDelay={40} maxCols={2} />
      </Section>

      <Section accent="var(--orange)" title="反1 反向型" desc="單日反向 1 倍，長期持有損耗嚴重，僅適合短線空頭避險">
        <ETFGrid etfs={inv1} startDelay={40} />
      </Section>

      {/* 名詞說明 */}
      <Glossary />

      <footer className="pt-8 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[12px] leading-loose text-center" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text2)' }}>免責聲明：</strong>
          本站所有內容均為歷史統計資料，僅供教育與研究參考用途，
          不構成任何投資建議、推介或勸誘買賣任何金融商品。<br />
          歷史勝率不代表未來績效，投資必有風險，實際交易前請自行評估風險承受度，或諮詢合格理財顧問。<br />
          本站由獨立研究者維護，與任何券商、投信公司無商業利益關係。
        </p>
      </footer>
    </main>
  )
}

function Section({
  accent, title, desc, children,
}: {
  accent: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: '72px' }}>
      <div className="flex items-baseline gap-3" style={{ marginBottom: '10px' }}>
        <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent, transform: 'translateY(-1px)' }} />
        <h2 className="font-black leading-tight" style={{ fontSize: '1.3rem', color: 'var(--text)' }}>
          {title}
        </h2>
      </div>
      <div className="text-[13px]" style={{ color: 'var(--muted)', paddingLeft: '20px', marginBottom: '40px' }}>
        {desc}
      </div>
      {children}
    </section>
  )
}

// 市場訊號總覽（溫度計 + 操作建議）
function MarketOverview({ etfs }: { etfs: ETFData[] }) {
  const relevant = etfs.filter(e => e.type === 'base' || e.type === 'lev2')
  const greenETFs  = relevant.filter(e => e.current.signal === 'green')
  const yellowETFs = relevant.filter(e => e.current.signal === 'yellow')
  const redCount   = relevant.filter(e => e.current.signal === 'red').length
  const greenCount = greenETFs.length
  const yellowCount = yellowETFs.length
  const total = relevant.length

  let accentColor: string
  let statusTag: string
  let summaryLine: string
  let actionLines: string[]

  if (greenCount > 0) {
    accentColor = 'var(--green)'
    statusTag = '偏冷 · 有標的進入偏低估'
    summaryLine = `目前台股市值型 ETF 有 ${greenCount} 檔進入偏低估區間`
    actionLines = greenETFs.map(e => `${e.ticker}（${e.name}）已進入偏低估，歷史上為相對好的進場時機，可考慮加碼。`)
  } else if (redCount === total) {
    accentColor = 'var(--red)'
    statusTag = '偏熱 · 全面偏高估'
    summaryLine = `目前台股市值型 ETF 全面偏高估（${redCount} 檔）`
    actionLines = ['維持既有定期定額，暫停額外加碼，等待乖離率回落至 −5% 以下再考慮擴大買入。']
  } else {
    accentColor = 'var(--yellow)'
    statusTag = '中性 · 混合訊號'
    summaryLine = `目前有 ${yellowCount} 檔中性、${redCount} 檔偏高估`
    actionLines = yellowETFs.length > 0
      ? yellowETFs.map(e => `${e.ticker}（${e.name}）回落至中性區間，可照常執行定期定額。`)
      : ['部分標的偏高估，可維持原有定期定額計畫，暫不擴大加碼。']
  }

  return (
    <div
      className="rounded-xl"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${accentColor}`,
        padding: '24px 28px 22px',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: accentColor }} />
        <span className="text-[15px] font-bold" style={{ color: accentColor, fontFamily: 'var(--font-noto-sans)' }}>
          {statusTag}
        </span>
      </div>

      <div className="text-[13px] mb-4" style={{ color: 'var(--muted)' }}>
        {summaryLine}
      </div>

      {/* 訊號分布條 */}
      <div className="flex h-1.5 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)', gap: '2px' }}>
        {total > 0 && <>
          {greenCount  > 0 && <div style={{ width: `${(greenCount  / total) * 100}%`, background: 'var(--green)' }} />}
          {yellowCount > 0 && <div style={{ width: `${(yellowCount / total) * 100}%`, background: 'var(--yellow)' }} />}
          {redCount    > 0 && <div style={{ width: `${(redCount    / total) * 100}%`, background: 'var(--red)' }} />}
        </>}
      </div>
      <div className="flex flex-wrap gap-4 mb-5">
        {greenCount  > 0 && <SignalCount color="var(--green)"  label="偏低估" count={greenCount} />}
        {yellowCount > 0 && <SignalCount color="var(--yellow)" label="中性"   count={yellowCount} />}
        {redCount    > 0 && <SignalCount color="var(--red)"    label="偏高估" count={redCount} />}
      </div>

      {/* 操作建議 */}
      <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="text-[12px] font-medium mb-1.5" style={{ color: 'var(--muted)' }}>操作建議</div>
        <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>
          {actionLines.map((l, i) => <div key={i} className={i > 0 ? 'mt-1.5' : ''}>{l}</div>)}
        </div>
      </div>
    </div>
  )
}

function SignalCount({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <span className="text-[12px] flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {label} <span className="font-mono" style={{ color: 'var(--text2)' }}>{count}</span> 檔
    </span>
  )
}

function ETFGrid({ etfs, startDelay, maxCols = 3 }: { etfs: ETFData[]; startDelay: number; maxCols?: number }) {
  const gridClass = maxCols === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-5'
    : 'grid grid-cols-1 md:grid-cols-3 gap-5'
  return (
    <div className={gridClass}>
      {etfs.map((etf, i) => (
        <ETFCard key={etf.ticker} etf={etf} delay={startDelay + i * 40} />
      ))}
    </div>
  )
}
