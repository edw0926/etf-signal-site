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
    <main className="max-w-[1020px] mx-auto px-6 pb-16">
      {/* Header */}
      <header className="pt-8">
        <div className="flex items-end justify-between pb-6 flex-wrap gap-3">
          <div>
            <div className="font-mono text-[10px] tracking-[4px] uppercase mb-2 flex items-center gap-2" style={{ color: 'var(--green)' }}>
              <span className="inline-block w-5 h-px" style={{ background: 'var(--green)' }} />
              Taiwan ETF Signal Lab
            </div>
            <h1 className="text-[28px] font-black tracking-tight leading-none">
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

        {/* Nav hint */}
        <nav className="flex gap-0.5 flex-wrap" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0', marginBottom: '44px' }}>
          {[
            { label: '市場溫度儀表板', active: true },
            { label: '策略方法論' },
          ].map(item => (
            <div
              key={item.label}
              className="font-mono text-[11px] tracking-widest uppercase px-4 py-2.5 cursor-pointer transition-all duration-200"
              style={{
                color: item.active ? 'var(--green)' : 'var(--muted)',
                borderBottom: item.active ? '2px solid var(--green)' : '2px solid transparent',
                marginBottom: '-1px',
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>
      </header>

      {/* 基礎市值型 */}
      <Section tag="base" tagLabel="基礎市值型" desc="追蹤台灣50指數 · 適合長期定期定額">
        <ETFGrid etfs={base} startDelay={40} />
      </Section>

      {/* 正2 槓桿型 */}
      <Section tag="lev" tagLabel="正2 槓桿型" desc="單日放大2倍報酬 · 有波動耗損 · 適合短中線 · 需要開立信用帳戶">
        <ETFGrid etfs={lev2} startDelay={40} />
      </Section>

      {/* 反1 反向型 */}
      <Section tag="inv" tagLabel="反1 反向型" desc="單日反向1倍 · 長期持有損耗嚴重 · 僅適合短線空頭避險">
        <ETFGrid etfs={inv1} startDelay={40} />
      </Section>

      {/* AdSense — Article Bottom */}
      <div className="flex justify-center my-10">
        <div className="w-full max-w-[728px] h-[90px] flex items-center justify-center text-xs font-mono rounded border border-dashed" style={{ color: 'var(--muted2)', borderColor: 'var(--border2)' }}>
          {/* Replace with Google AdSense ins tag — 728×90 */}
          AD SLOT · ARTICLE BOTTOM 728×90
        </div>
      </div>

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
  const tagStyle = {
    base: { color: 'var(--blue)', background: 'rgba(74,158,255,.08)', border: '1px solid rgba(74,158,255,.2)' },
    lev: { color: 'var(--green)', background: 'rgba(0,217,139,.08)', border: '1px solid rgba(0,217,139,.2)' },
    inv: { color: 'var(--red)', background: 'rgba(240,69,90,.08)', border: '1px solid rgba(240,69,90,.2)' },
  }[tag]

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3.5 mb-4">
        <div className="font-mono text-[10px] tracking-[3px] uppercase px-3 py-1 rounded font-semibold" style={tagStyle}>
          {tagLabel}
        </div>
        <div className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</div>
      </div>
      {children}
    </div>
  )
}

function ETFGrid({ etfs, startDelay }: { etfs: ETFData[]; startDelay: number }) {
  return (
    <div className="grid gap-3.5 mb-10" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
      {etfs.map((etf, i) => (
        <ETFCard key={etf.ticker} etf={etf} delay={startDelay + i * 40} />
      ))}
    </div>
  )
}
