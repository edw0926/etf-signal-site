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
  const bias = formatBias(etf.current.bias)
  const biasColor = etf.current.bias > 0 ? 'var(--red)' : 'var(--green)'
  const wr365 = etf.winrates['365d']?.win_rate
  const med365 = etf.winrates['365d']?.median_ret ?? null
  const wr90 = etf.winrates['90d']?.win_rate
  const med90 = etf.winrates['90d']?.median_ret ?? null

  if (etf.type === 'inv1') {
    return [
      { label: '月線乖離', val: bias, color: biasColor },
      { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--red)' },
      { label: '365日中位', val: formatRet(med365), color: 'var(--red)' },
    ]
  }
  if (etf.type === 'lev2') {
    return [
      { label: '月線乖離', val: bias, color: biasColor },
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--green)' },
      { label: '90日中位', val: formatRet(med90), color: 'var(--green)' },
    ]
  }
  // Fall back to 90d win rate when 365d median is unavailable (Infinity in source data)
  if (med365 === null) {
    return [
      { label: '月線乖離', val: bias, color: biasColor },
      { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--green)' },
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--green)' },
    ]
  }
  return [
    { label: '月線乖離', val: bias, color: biasColor },
    { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--green)' },
    { label: '365日中位', val: formatRet(med365), color: 'var(--green)' },
  ]
}

export default function ETFCard({ etf, delay = 0 }: { etf: ETFData; delay?: number }) {
  const sig = etf.current.signal
  const col = signalColors[sig] ?? signalColors.red
  const warn = getWarnText(etf)
  const stats = getCardStats(etf)
  const sigIcon = etf.type === 'inv1' ? '✕' : sig === 'green' ? '↓↓' : sig === 'yellow' ? '→' : '↑↑'

  return (
    <Link href={`/etf/${etf.ticker}`} className="block no-underline group">
      <div
        className="animate-fadeUp rounded-2xl pt-6 px-6 pb-5 cursor-pointer relative transition-all duration-200 group-hover:-translate-y-1"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderTop: `3px solid ${col.card}`,
          borderRadius: '14px',
          animationDelay: `${delay}ms`,
          minWidth: '280px',
        }}
        onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 10px 40px ${col.shadow}`)}
        onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
      >

        {/* Card head */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-mono text-[11px] tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
              {etf.ticker}.TW
            </div>
            <div className="text-[17px] font-bold leading-tight">{etf.name}</div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>{etf.index}</div>
            <div className="font-mono text-[9px] mt-1 tracking-tight" style={{ color: 'var(--muted2)' }}>
              回測 {etf.data_range} · {etf.sample_months}個月
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono"
              style={{ background: col.bg, color: col.text, boxShadow: `0 0 20px ${col.shadow}` }}
            >
              {sigIcon}
            </div>
            <div className="font-mono text-[9px] tracking-wide" style={{ color: col.text }}>
              {etf.current.label}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div className="font-mono text-[9px] tracking-widest uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
                {s.label}
              </div>
              <div className="font-mono text-[15px] font-semibold" style={{ color: s.color }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* Warning */}
        {warn && (
          <div
            className="mt-4 text-[11px] rounded-md font-mono tracking-tight"
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
