import { getAllETFs, getSignalsData } from '@/lib/data'
import { ETFData } from '@/types/etf'
import ETFCard from '@/components/ETFCard'

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
