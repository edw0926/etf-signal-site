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
    <main style={{ width: '100%', maxWidth: '1020px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '64px' }}>
      {/* Header */}
      <header className="pt-8">
        <div className="flex items-end justify-between pb-7 flex-wrap gap-3">
          <div>
            <div className="font-mono text-[10px] tracking-[4px] uppercase mb-2 flex items-center gap-2" style={{ color: 'var(--green)' }}>
              <span className="inline-block w-5 h-px" style={{ background: 'var(--green)' }} />
              Taiwan ETF Signal Lab
            </div>
            <h1 className="text-[34px] font-black tracking-tight leading-none">
              台股<span style={{ color: 'var(--green)' }}>市值型 ETF</span> 訊號站
            </h1>
            {/* E1：一句話價值說明 */}
            <p className="text-[11px] mt-2.5 leading-relaxed" style={{ color: 'var(--muted)', maxWidth: '420px' }}>
              每日更新 · 以 20 日均線乖離率判斷現在買進是偏貴還是偏便宜<br />
              偏低估區間（≤ −5%）進場，歷史勝率較高；偏高估區間（≥ +5%）建議減少加碼，靜待回調
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="font-mono text-[11px] px-3.5 py-1.5 rounded-full flex items-center gap-1.5" style={{ border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--muted)' }}>
              <span className="live-dot w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--green)' }} />
              數據更新 {data.updated_at}
            </div>
            <div className="font-mono text-[10px] px-3.5 py-1.5 rounded-full" style={{ border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--muted2)' }}>
              ⚠ 歷史統計 · 僅供參考 · 非投資建議
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-0.5 flex-wrap" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0', marginBottom: '44px' }}>
          <div
            className="font-mono text-[11px] tracking-widest uppercase px-4 py-2.5"
            style={{ color: 'var(--green)', borderBottom: '2px solid var(--green)', marginBottom: '-1px' }}
          >
            市場溫度儀表板
          </div>
        </nav>
      </header>

      {/* G5：市場溫度儀表板 */}
      <MarketTemperature etfs={etfs} />

      {/* E2：操作建議橫幅 */}
      <ActionBanner etfs={etfs} />

      {/* 基礎市值型 */}
      <Section tag="base" tagLabel="基礎市值型" desc="追蹤台灣50指數 · 適合長期定期定額">
        <ETFGrid etfs={base} startDelay={40} maxCols={2} />
      </Section>

      {/* 正2 槓桿型 — 4 張，固定最多 2 欄讓排版整齊 */}
      <Section tag="lev" tagLabel="正2 槓桿型" desc="單日放大2倍報酬 · 有波動耗損 · 適合短中線 · 需要開立信用帳戶">
        <ETFGrid etfs={lev2} startDelay={40} maxCols={2} />
      </Section>

      {/* 反1 反向型 */}
      <Section tag="inv" tagLabel="反1 反向型" desc="單日反向1倍 · 長期持有損耗嚴重 · 僅適合短線空頭避險">
        <ETFGrid etfs={inv1} startDelay={40} />
      </Section>

      {/* F2：名詞說明摺疊區塊 */}
      <Glossary />

      <footer className="pt-7" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px] leading-loose text-center" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--red)' }}>⚠ 免責聲明：</strong>
          本站所有內容均為歷史統計資料，僅供教育與研究參考用途，
          <strong style={{ color: 'var(--red)' }}>不構成任何投資建議、推介或勸誘買賣任何金融商品</strong>。<br />
          歷史勝率不代表未來績效，投資必有風險，實際交易前請自行評估風險承受度，或諮詢合格理財顧問。<br />
          本站由獨立研究者維護，與任何券商、投信公司無商業利益關係。
        </p>
      </footer>
    </main>
  )
}

function Section({
  tag, tagLabel, desc, children,
}: {
  tag: 'base' | 'lev' | 'inv'
  tagLabel: string
  desc: string
  children: React.ReactNode
}) {
  const accentColor = {
    base: 'var(--blue)',
    lev: 'var(--green)',
    inv: 'var(--red)',
  }[tag]

  return (
    <div style={{ marginTop: '48px', marginBottom: '8px' }}>
      {/* Section title with left accent border */}
      <div style={{ borderLeft: `4px solid ${accentColor}`, paddingLeft: '14px', marginBottom: '8px' }}>
        <h2
          className="font-black leading-tight"
          style={{ fontSize: '1.4rem', color: 'var(--text)' }}
        >
          {tagLabel}
        </h2>
      </div>
      {/* Description */}
      <div className="text-[12px] mb-5" style={{ color: 'var(--muted)', paddingLeft: '18px' }}>
        {desc}
      </div>
      {children}
    </div>
  )
}

// G5：市場溫度儀表板
function MarketTemperature({ etfs }: { etfs: ETFData[] }) {
  // 以基礎型 + 正2型判斷溫度（反1不納入，因邏輯相反）
  const relevant = etfs.filter(e => e.type === 'base' || e.type === 'lev2')
  const greenCount  = relevant.filter(e => e.current.signal === 'green').length
  const yellowCount = relevant.filter(e => e.current.signal === 'yellow').length
  const redCount    = relevant.filter(e => e.current.signal === 'red').length
  const total = relevant.length

  const greenETFs = relevant.filter(e => e.current.signal === 'green').map(e => e.ticker)

  let tempColor: string
  let tempIcon: string
  let tempTitle: string
  let tempDesc: string

  if (greenCount > 0) {
    tempColor = 'var(--green)'
    tempIcon = '🟢'
    tempTitle = '偏冷 — 有標的進入偏低估'
    tempDesc = `出現偏低估訊號，歷史上為相對好的進場時機，建議關注以下標的：${greenETFs.join('、')}`
  } else if (redCount === total) {
    tempColor = 'var(--red)'
    tempIcon = '🔴'
    tempTitle = '偏熱 — 全面偏高估'
    tempDesc = '目前台股市值型 ETF 全面偏高估，整體建議觀望為主，維持定期定額但暫停額外加碼。'
  } else {
    tempColor = 'var(--yellow)'
    tempIcon = '🟡'
    tempTitle = '中性 — 混合訊號'
    tempDesc = '部分標的偏高估，部分回落至中性，可選擇性針對已回落的標的考慮加碼。'
  }

  return (
    <div
      className="rounded-xl mb-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${tempColor}`, padding: '22px 24px 20px' }}
    >
      <div className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'var(--muted)' }}>
        🌡 市場溫度計
      </div>

      <div className="text-[20px] font-black mb-3" style={{ color: tempColor }}>
        {tempIcon} {tempTitle}
      </div>

      {/* 溫度進度條 */}
      <div className="flex h-2 rounded-full overflow-hidden mb-5" style={{ background: 'var(--border)' }}>
        {total > 0 && <>
          <div style={{ width: `${(greenCount / total) * 100}%`,  background: '#00d98b', transition: 'width .3s' }} />
          <div style={{ width: `${(yellowCount / total) * 100}%`, background: '#f0b429', transition: 'width .3s' }} />
          <div style={{ width: `${(redCount / total) * 100}%`,    background: '#f0455a', transition: 'width .3s' }} />
        </>}
      </div>

      <div className="text-[13px] mb-4 leading-relaxed" style={{ color: '#b8c8e0' }}>{tempDesc}</div>

      <div className="flex flex-wrap gap-3">
        {greenCount  > 0 && <span className="font-mono text-[11px]" style={{ color: 'var(--green)'  }}>🟢 偏低估 {greenCount} 檔</span>}
        {yellowCount > 0 && <span className="font-mono text-[11px]" style={{ color: 'var(--yellow)' }}>🟡 中性 {yellowCount} 檔</span>}
        {redCount    > 0 && <span className="font-mono text-[11px]" style={{ color: 'var(--red)'    }}>🔴 偏高估 {redCount} 檔</span>}
      </div>
    </div>
  )
}

// E2：操作建議橫幅
function ActionBanner({ etfs }: { etfs: ETFData[] }) {
  const relevant = etfs.filter(e => e.type === 'base' || e.type === 'lev2')
  const greenETFs  = relevant.filter(e => e.current.signal === 'green')
  const yellowETFs = relevant.filter(e => e.current.signal === 'yellow')
  const redCount   = relevant.filter(e => e.current.signal === 'red').length
  const total      = relevant.length

  const actionable = [...greenETFs, ...yellowETFs]

  let lines: string[]
  if (redCount === total) {
    lines = [
      '目前所有標的均處於偏高估區間。',
      '建議：維持既有定期定額，暫停額外加碼，等待乖離率回落至 −5% 以下再考慮擴大買入。',
    ]
  } else {
    lines = actionable.map(e => {
      const zone = e.current.signal === 'green' ? '偏低估' : '中性'
      return `${e.ticker}（${e.name}）已回落至${zone}區間，歷史上為相對好的進場時機，可考慮加碼。`
    })
  }

  return (
    <div
      className="rounded-xl mt-8 mb-2"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid #e07b39',
        padding: '22px 24px 20px',
      }}
    >
      <div className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: '#e07b39' }}>
        📋 現在的操作建議
      </div>
      <div className="text-[13px] leading-relaxed" style={{ color: '#b8c8e0' }}>
        {lines.map((l, i) => <div key={i} className={i > 0 ? 'mt-2' : ''}>{l}</div>)}
      </div>
    </div>
  )
}

function ETFGrid({ etfs, startDelay, maxCols = 3 }: { etfs: ETFData[]; startDelay: number; maxCols?: number }) {
  const gridClass = maxCols === 2
    ? 'grid grid-cols-1 md:grid-cols-2 gap-5 mb-10'
    : 'grid grid-cols-1 md:grid-cols-3 gap-5 mb-10'
  return (
    <div className={gridClass}>
      {etfs.map((etf, i) => (
        <ETFCard key={etf.ticker} etf={etf} delay={startDelay + i * 40} />
      ))}
    </div>
  )
}
