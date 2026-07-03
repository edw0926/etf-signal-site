'use client'
import Link from 'next/link'
import { ETFData } from '@/types/etf'
import Tooltip from '@/components/Tooltip'

function formatBias(bias: number) {
  return (bias >= 0 ? '+' : '') + bias.toFixed(2) + '%'
}
function formatRet(val: number | null) {
  if (val === null) return 'N/A'
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%'
}

const signalTheme = {
  green:  { accent: 'var(--green)',  badgeBg: 'rgba(34,197,94,.12)',  badgeBorder: 'rgba(34,197,94,.3)',  shadow: 'rgba(34,197,94,.12)',  label: '偏低估' },
  yellow: { accent: 'var(--yellow)', badgeBg: 'rgba(234,179,8,.12)',  badgeBorder: 'rgba(234,179,8,.3)',  shadow: 'rgba(234,179,8,.12)',  label: '中性' },
  red:    { accent: 'var(--red)',    badgeBg: 'rgba(239,68,68,.12)',  badgeBorder: 'rgba(239,68,68,.3)',  shadow: 'rgba(239,68,68,.12)',  label: '偏高估' },
  inv:    { accent: 'var(--orange)', badgeBg: 'rgba(249,115,22,.12)', badgeBorder: 'rgba(249,115,22,.3)', shadow: 'rgba(249,115,22,.12)', label: '不建議' },
}

function getWarnText(etf: ETFData): { text: string; color: string } | null {
  const { signal } = etf.current
  if (etf.type === 'inv1') {
    const wr365 = etf.winrates['365d']?.win_rate ?? 0
    return { text: `歷史 365 天持有勝率僅 ${wr365}%，長期持有損耗極大，僅適合短線空頭避險`, color: 'var(--orange)' }
  }
  if (signal === 'red' && etf.type === 'lev2') {
    return { text: '乖離率過高，槓桿放大進場風險，建議等回落至 −7% 以下再考慮', color: 'var(--yellow)' }
  }
  if (signal === 'red') {
    return { text: '目前位置偏高估，短期波動風險較高；長期持有仍具優勢', color: 'var(--red)' }
  }
  if (signal === 'green') {
    return { text: '月線偏低估，歷史上為相對好的進場時機', color: 'var(--green)' }
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
      { label: '365日中位報酬', val: formatRet(med365), color: 'var(--red)' },
    ]
  }
  if (etf.type === 'lev2') {
    return [
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--text)' },
      { label: '90日中位報酬', val: formatRet(med90), color: med90 != null && med90 < 0 ? 'var(--red)' : 'var(--green)' },
    ]
  }
  if (med365 === null) {
    return [
      { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--text)' },
      { label: '90日勝率', val: wr90 != null ? wr90 + '%' : 'N/A', color: 'var(--text)' },
    ]
  }
  return [
    { label: '365日勝率', val: wr365 != null ? wr365 + '%' : 'N/A', color: 'var(--text)' },
    { label: '365日中位報酬', val: formatRet(med365), color: med365 < 0 ? 'var(--red)' : 'var(--green)' },
  ]
}

export default function ETFCard({ etf, delay = 0 }: { etf: ETFData; delay?: number }) {
  const sig = etf.current.signal
  const isInv = etf.type === 'inv1'
  const theme = isInv ? signalTheme.inv : (signalTheme[sig] ?? signalTheme.red)
  const warn = getWarnText(etf)
  const stats = getCardStats(etf)
  const biasNum = etf.current.bias
  const biasStr = formatBias(biasNum)
  const biasColor = biasNum > 0 ? 'var(--red)' : 'var(--green)'

  return (
    <Link href={`/etf/${etf.ticker}`} className="block no-underline group">
      <div
        className="animate-fadeUp cursor-pointer relative transition-all duration-200 group-hover:-translate-y-0.5"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '24px 26px 22px',
          animationDelay: `${delay}ms`,
          minWidth: '280px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.boxShadow = `0 8px 32px ${theme.shadow}`
          e.currentTarget.style.borderColor = 'var(--border2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.boxShadow = ''
          e.currentTarget.style.borderColor = 'var(--border)'
        }}
      >
        {/* 第一層：代號 + 名稱 + 訊號 badge */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 min-w-0 pr-3">
            <div className="font-mono text-[11px] mb-1.5" style={{ color: 'var(--muted)' }}>
              {etf.ticker}
            </div>
            <div className="text-[17px] font-bold leading-tight" style={{ fontFamily: 'var(--font-noto-sans)' }}>
              {etf.name}
            </div>
          </div>
          <div
            className="flex-shrink-0 flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{ background: theme.badgeBg, color: theme.accent, border: `1px solid ${theme.badgeBorder}` }}
          >
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />
            {theme.label}
          </div>
        </div>

        {/* 第二層：乖離率 + 股價 */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="text-[11px] mb-1.5 flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
              月線乖離率
              <Tooltip text="現在股價距離近 20 日平均成本的差距百分比。正值代表比均價貴，負值代表比均價便宜。" />
            </div>
            <div className="font-mono text-[30px] font-semibold leading-none tracking-tight" style={{ color: biasColor }}>
              {biasStr}
            </div>
          </div>
          <div className="text-right flex-shrink-0 ml-3">
            <div className="text-[11px] mb-1.5" style={{ color: 'var(--muted)' }}>最新股價</div>
            <div className="font-mono text-[20px] font-semibold leading-none" style={{ color: 'var(--text2)' }}>
              {etf.current.latest_price != null ? `$${etf.current.latest_price}` : '—'}
            </div>
          </div>
        </div>

        {isInv && (
          <div className="text-[11px] -mt-2 mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
            反向 ETF 乖離率方向與大盤相反，不作為進場判斷依據
          </div>
        )}

        {/* 第三層：勝率統計 */}
        <div
          className="grid gap-4 pt-5"
          style={{ borderTop: '1px solid var(--border)', gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}
        >
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-[11px] mb-1 flex items-center gap-0.5" style={{ color: 'var(--muted)' }}>
                {s.label}
                {i === 0 && s.label.includes('勝率') && (
                  <Tooltip text="歷史上在同樣時間點買進，持有滿指定天數後仍有獲利的比例。" />
                )}
                {s.label.includes('中位') && (
                  <Tooltip text="歷史持有報酬排在中間的數字。比平均值更穩定，不會被少數極端值拉偏。" />
                )}
              </div>
              <div className="font-mono text-[16px] font-semibold" style={{ color: s.color }}>
                {s.val}
              </div>
            </div>
          ))}
        </div>

        {/* 第四層：回測範圍 */}
        <div className="text-[11px] mt-4" style={{ color: 'var(--muted2)' }}>
          回測 {etf.data_range} · {etf.sample_months} 個月
        </div>

        {/* 提示文字 */}
        {warn && (
          <div
            className="mt-3.5 text-[12px] leading-relaxed pl-3"
            style={{ color: 'var(--text2)', borderLeft: `2px solid ${warn.color}` }}
          >
            {warn.text}
          </div>
        )}
      </div>
    </Link>
  )
}
