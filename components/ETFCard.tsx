'use client'
import Link from 'next/link'
import { ETFData } from '@/types/etf'

function formatBias(bias: number) {
  return (bias >= 0 ? '+' : '') + bias.toFixed(2) + '%'
}
function formatRet(val: number | null) {
  if (val === null) return 'N/A'
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%'
}

const signalColors = {
  green: { card: '#00d98b', text: 'var(--green)', bg: 'rgba(0,217,139,.08)', shadow: 'rgba(0,217,139,.15)' },
  yellow: { card: '#f0b429', text: 'var(--yellow)', bg: 'rgba(240,180,41,.08)', shadow: 'rgba(240,180,41,.15)' },
  red: { card: '#f0455a', text: 'var(--red)', bg: 'rgba(240,69,90,.08)', shadow: 'rgba(240,69,90,.15)' },
}

const badgeStyle = {
  green: { background: 'rgba(0,217,139,.18)', color: '#00d98b', border: '1px solid rgba(0,217,139,.35)' },
  yellow: { background: 'rgba(240,180,41,.18)', color: '#f0b429', border: '1px solid rgba(240,180,41,.35)' },
  red: { background: 'rgba(240,69,90,.18)', color: '#f0455a', border: '1px solid rgba(240,69,90,.35)' },
}

const badgeLabel = {
  green: '🟢 偏低估',
  yellow: '🟡 中性',
  red: '🔴 偏高估',
}

function getWarnText(etf: ETFData): { text: string; type: 'y' | 'r' | 'g' } | null {
  const { signal } = etf.current
  if (etf.type === 'inv1') {
    const wr365 = etf.winrates['365d']?.win_rate ?? 0
    return { text: `🔴 歷史365天持有勝率僅${wr365}%，長期持有損耗極大，非多頭環境下慎用`, type: 'r' }
  }
  if (signal === 'red' && etf.type === 'lev2') {
    return { text: `⚡ 目前乖離率過高，進場風險放大。等待回測至 −7% 以下再考慮`, type: 'y' }
  }
  if (signal === 'red') {
    return { text: `🔴 現在位置偏高估，短期波動風險較高，長期持有仍具優勢`, type: 'r' }
  }
  if (signal === 'green') {
    return { text: `✅ 月線偏低估，歷史上為相對好的進場時機`, type: 'g' }
  }
  return null
}

function getCardStats(etf: ETFData) {
  const wr365 = etf.winrates['365d']?.win_rate
  const med365 = etf.winrates['365d']?.median_ret ?? null
  const wr90 = etf.winrates['90d']?.win_rate
  const med90 = etf.winrates['90d']?.median_ret ?? null

  if (etf.type === 'inv1') {
    return [
      { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--red)' },
      { label: '365日中位', val: formatRet(med365), color: 'var(--red)' },
    ]
  }
  if (etf.type === 'lev2') {
    return [
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--green)' },
      { label: '90日中位', val: formatRet(med90), color: 'var(--green)' },
    ]
  }
  if (med365 === null) {
    return [
      { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--green)' },
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--green)' },
    ]
  }
  return [
    { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--green)' },
    { label: '365日中位', val: formatRet(med365), color: 'var(--green)' },
  ]
}

export default function ETFCard({ etf, delay = 0 }: { etf: ETFData; delay?: number }) {
  const sig = etf.current.signal
  const col = signalColors[sig] ?? signalColors.red
  const badge = badgeStyle[sig] ?? badgeStyle.red
  const label = badgeLabel[sig] ?? badgeLabel.red
  const warn = getWarnText(etf)
  const stats = getCardStats(etf)
  const biasNum = etf.current.bias
  const biasStr = formatBias(biasNum)
  const biasColor = biasNum > 0 ? 'var(--red)' : 'var(--green)'

  return (
    <Link href={`/etf/${etf.ticker}`} className="block no-underline group">
      <div
        className="animate-fadeUp cursor-pointer relative transition-all duration-200 group-hover:-translate-y-1"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderTop: `3px solid ${col.card}`,
          borderRadius: '14px',
          padding: '22px 24px 20px',
          animationDelay: `${delay}ms`,
          minWidth: '280px',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 10px 40px ${col.shadow}`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
      >

        {/* Layer 1: Ticker + Name + Signal Badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <div className="font-mono text-[11px] tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
              {etf.ticker}.TW
            </div>
            <div className="text-[18px] font-black leading-tight">{etf.name}</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{etf.index}</div>
          </div>
          {/* Signal badge — colored block label */}
          <div
            className="flex-shrink-0 text-[11px] font-bold font-mono px-2.5 py-1 rounded-md whitespace-nowrap"
            style={badge}
          >
            {label}
          </div>
        </div>

        {/* Layer 2: Price + Bias */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
              月線乖離率
            </div>
            <div className="font-mono text-[32px] font-black leading-none" style={{ color: biasColor }}>
              {biasStr}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="font-mono text-[10px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
              最新股價
            </div>
            <div className="font-mono text-[22px] font-bold leading-none" style={{ color: 'var(--text)' }}>
              {etf.current.latest_price != null ? `$${etf.current.latest_price}` : '—'}
            </div>
          </div>
        </div>

        {/* Layer 3: Win rate + median return */}
        <div
          className="grid gap-4 pt-4"
          style={{
            borderTop: '1px solid var(--border)',
            gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
          }}
        >
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
                {s.label}
              </div>
              <div className="font-mono text-[16px] font-bold" style={{ color: s.color }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Layer 4: Backtest range — small, muted */}
        <div className="font-mono text-[9px] mt-3 tracking-tight" style={{ color: 'var(--muted2)' }}>
          回測 {etf.data_range} · {etf.sample_months} 個月
        </div>

        {/* Warning */}
        {warn && (
          <div
            className="mt-3 text-[11px] rounded-md font-mono tracking-tight"
            style={{
              padding: '10px 14px',
              lineHeight: '1.6',
              ...(warn.type === 'r'
                ? { color: 'var(--red)', background: 'rgba(240,69,90,.08)', border: '1px solid rgba(240,69,90,.2)' }
                : warn.type === 'y'
                ? { color: 'var(--yellow)', background: 'rgba(240,180,41,.08)', border: '1px solid rgba(240,180,41,.2)' }
                : { color: 'var(--green)', background: 'rgba(0,217,139,.08)', border: '1px solid rgba(0,217,139,.2)' }),
            }}
          >
            {warn.text}
          </div>
        )}
      </div>
    </Link>
  )
}
