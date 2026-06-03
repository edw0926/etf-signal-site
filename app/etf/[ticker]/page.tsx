import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getETFByTicker, getAllTickers, getSignalsData, formatBias, formatRet } from '@/lib/data'
import { ETFData, SeasonalEntry } from '@/types/etf'

export const dynamic = 'force-static'

export async function generateStaticParams() {
  return getAllTickers().map(ticker => ({ ticker }))
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params
  const etf = getETFByTicker(ticker)
  if (!etf) return {}
  const signal = etf.current.signal === 'green' ? '偏低估 ✅' : etf.current.signal === 'yellow' ? '中性 🟡' : '偏高估 🔴'
  return {
    title: `${etf.ticker} ${etf.name} 訊號分析 | 台股ETF訊號站`,
    description: `${etf.name}（${etf.ticker}）當前訊號：${signal}，月線乖離率${formatBias(etf.current.bias)}。回測區間 ${etf.data_range}，${etf.sample_months}個月歷史數據。`,
  }
}

const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

export default async function ETFDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const etf = getETFByTicker(ticker)
  if (!etf) notFound()

  const data = getSignalsData()
  const allETFs = Object.values(data.etfs)

  const sig = etf.current.signal
  const sigColor = sig === 'green' ? 'var(--green)' : sig === 'yellow' ? 'var(--yellow)' : 'var(--red)'
  const sigIcon = sig === 'green' ? '↓↓' : sig === 'yellow' ? '→' : '↑↑'

  const seasonal = etf.seasonal
  const seasonalVals = Object.values(seasonal) as SeasonalEntry[]
  const medians = seasonalVals.map(s => s.median_ret ?? 0)
  const maxAbs = Math.max(...medians.map(v => Math.abs(v)), 1)
  const winRates = seasonalVals.map(s => s.win_rate)
  const minWR = Math.min(...winRates)
  const maxWR = Math.max(...winRates)

  const typeLabel = etf.type === 'base' ? '基礎市值型' : etf.type === 'lev2' ? '正2 槓桿型' : '反1 反向型'
  const typeTag = etf.type === 'base' ? 'base' : etf.type === 'lev2' ? 'lev' : 'inv'

  const tagStyle = {
    base: { color: 'var(--blue)', background: 'rgba(74,158,255,.08)', border: '1px solid rgba(74,158,255,.2)' },
    lev: { color: 'var(--green)', background: 'rgba(0,217,139,.08)', border: '1px solid rgba(0,217,139,.2)' },
    inv: { color: 'var(--red)', background: 'rgba(240,69,90,.08)', border: '1px solid rgba(240,69,90,.2)' },
  }[typeTag]

  return (
    <main style={{ width: '100%', maxWidth: '1020px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '64px' }}>
      {/* Back nav */}
      <div className="pt-6 mb-6">
        <Link href="/" className="font-mono text-[11px] tracking-widest uppercase transition-colors" style={{ color: 'var(--muted)' }}>
          ← 返回儀表板
        </Link>
      </div>

      {/* Page header */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="font-mono text-[10px] tracking-[3px] uppercase px-3 py-1 rounded font-semibold" style={tagStyle}>
          {typeLabel}
        </div>
      </div>

      {/* Detail panel */}
      <div className="animate-fadeUp rounded-[18px] p-8 mb-11" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black">{etf.name}（{etf.ticker}）</h2>
            <div className="font-mono text-[11px] mt-1.5 leading-loose" style={{ color: 'var(--muted)' }}>
              追蹤指數：{etf.index}<br />
              回測區間：{etf.data_range} · 有效樣本 {etf.sample_months} 個月
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>當前訊號</div>
            <div className="font-mono text-xl font-bold" style={{ color: sigColor }}>
              {etf.current.label} {etf.type !== 'inv1' ? sigIcon : '✕'}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
              月線乖離 {formatBias(etf.current.bias)}
            </div>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Chip type={sig === 'red' ? 'r' : sig === 'green' ? 'g' : 'y'}>
            {sig === 'red' ? '✕' : sig === 'green' ? '✓' : '△'} 月線乖離 {formatBias(etf.current.bias)}（{sig === 'red' ? '超過 +5% 高估門檻' : sig === 'green' ? '低於 −5% 低估區間' : '中性區間'}）
          </Chip>
          <Chip type={sig === 'red' ? 'r' : sig === 'green' ? 'g' : 'y'}>
            {sig === 'red' ? '✕' : sig === 'green' ? '✓' : '△'} 當前收盤 {etf.current.latest_price} · MA20 = {etf.current.ma20}
          </Chip>
        </div>

        {/* Logic box */}
        <div className="rounded-[10px] p-5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)' }}>
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'var(--green)' }}>📐 推導邏輯</div>
          <div className="text-sm leading-loose" style={{ color: '#b8c8e0' }}>
            本站以 <strong style={{ color: 'var(--green)' }}>月線乖離率（20日均線）</strong> 作為核心判斷指標：<br /><br />
            ✅ <strong style={{ color: 'var(--green)' }}>偏低估（乖離 ≤ −5%）</strong>：歷史上為相對好的進場時機，長期勝率偏高<br />
            🟡 <strong style={{ color: 'var(--yellow)' }}>中性區間（−5% ~ +5%）</strong>：普通定期定額繼續執行即可<br />
            🔴 <strong style={{ color: 'var(--red)' }}>偏高估（乖離 ≥ +5%）</strong>：短期回調風險偏高，建議減少單次加碼金額<br /><br />
            ⚠️ 本統計為歷史數據，不代表未來結果，不構成投資建議。
          </div>
        </div>

        {/* Win rates */}
        <div className="mb-7">
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3.5" style={{ color: 'var(--muted)' }}>
            ▸ 所有持有期勝率（全時段，不限觸發條件）
          </div>
          {(['30d','60d','90d','180d','365d'] as const).map(period => {
            const wr = etf.winrates[period]
            if (!wr) return null
            const label = { '30d':'持有 30 天', '60d':'持有 60 天', '90d':'持有 90 天', '180d':'持有 180 天', '365d':'持有 365 天' }[period]
            const med = formatRet(wr.median_ret)
            return (
              <div key={period} className="flex items-center gap-3.5 mb-2.5">
                <div className="font-mono text-[11px] w-[76px] flex-shrink-0" style={{ color: 'var(--muted)' }}>{label}</div>
                <div className="flex-1 h-[7px] rounded overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded" style={{ width: `${wr.win_rate}%`, background: 'var(--green)' }} />
                </div>
                <div className="font-mono text-[13px] font-semibold w-[40px] text-right" style={{ color: 'var(--green)' }}>
                  {wr.win_rate}%
                </div>
                <div className="font-mono text-[11px] ml-1" style={{ color: 'var(--muted)' }}>中位 {med}</div>
              </div>
            )
          })}
        </div>

        {/* Monthly bar chart */}
        <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'var(--muted)' }}>
            ▸ 各月份進場 · 持有90天中位報酬（{etf.ticker} · {etf.data_range} 真實回測）
          </div>
          <div className="flex items-end gap-1.5 h-[130px]">
            {Object.entries(seasonal).map(([m, d]) => {
              const val = d.median_ret ?? 0
              const h = Math.abs(val) / maxAbs * 88
              const isPos = val >= 0
              const sign = isPos ? '+' : ''
              return (
                <div key={m} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                  <div className="font-mono text-[8px]" style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
                    {sign}{val.toFixed(1)}%
                  </div>
                  <div
                    className="w-full rounded-t min-h-[2px]"
                    style={{ height: `${h}%`, background: isPos ? 'var(--green)' : 'var(--red)' }}
                  />
                  <div className="font-mono text-[9px]" style={{ color: 'var(--muted)' }}>{m}月</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seasonal heatmap */}
        <div className="rounded-xl p-5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-4" style={{ color: 'var(--muted)' }}>
            ▸ 月份效應熱度圖（持有90天 · 勝率）
          </div>
          <div className="grid grid-cols-12 gap-1.5">
            {Object.entries(seasonal).map(([m, d]) => {
              const norm = maxWR === minWR ? 0.5 : (d.win_rate - minWR) / (maxWR - minWR)
              const a = 0.1 + norm * 0.7
              const isWin = d.win_rate >= 60
              const bg = isWin ? `rgba(0,217,139,${a})` : `rgba(240,69,90,${(1 - norm) * 0.6 + 0.1})`
              const vc = isWin ? 'var(--green)' : 'var(--red)'
              return (
                <div
                  key={m}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5"
                  style={{ background: bg }}
                  title={`${m}月 勝率 ${d.win_rate}% · 樣本 ${d.sample} 筆`}
                >
                  <div className="font-mono text-[9px]" style={{ color: 'rgba(255,255,255,.45)' }}>{m}月</div>
                  <div className="font-mono text-[10px] font-bold" style={{ color: vc }}>{d.win_rate}%</div>
                </div>
              )
            })}
          </div>
          {/* Strong/weak months summary */}
          <div className="mt-3.5 font-mono text-[10px] leading-loose" style={{ color: 'var(--muted)' }}>
            {(() => {
              const sorted = Object.entries(seasonal).sort((a, b) => (b[1].win_rate) - (a[1].win_rate))
              const top3 = sorted.slice(0, 3).map(([m, d]) => `${m}月（${d.win_rate}%）`).join('· ')
              const bot1 = sorted.slice(-1).map(([m, d]) => `${m}月（${d.win_rate}%）`).join('')
              return <>
                🟢 歷史統計強勢月：<strong style={{ color: 'var(--green)' }}>{top3}</strong><br />
                🔴 歷史統計弱勢月：<strong style={{ color: 'var(--red)' }}>{bot1}</strong> 相對最低
              </>
            })()}
          </div>
        </div>

        {/* Leveraged note */}
        {etf.type === 'lev2' && (
          <div className="rounded-[10px] p-4.5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--yellow)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-2.5" style={{ color: 'var(--yellow)' }}>⚡ 正2 持有期重要提醒</div>
            <div className="text-sm leading-loose" style={{ color: '#b8c8e0' }}>
              正2 ETF 追蹤的是<strong style={{ color: 'var(--yellow)' }}>單日報酬的兩倍</strong>，長期持有會因
              <strong style={{ color: 'var(--yellow)' }}>波動耗損（Volatility Decay）</strong>導致績效低於預期。
              建議持有期以 <strong style={{ color: 'var(--yellow)' }}>30～90天</strong> 為主，並在乖離率回到 −7% 以下後才考慮建倉。
            </div>
          </div>
        )}

        {etf.type === 'inv1' && (
          <div className="rounded-[10px] p-4.5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--red)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-2.5" style={{ color: 'var(--red)' }}>⚠ 反1 使用重要說明</div>
            <div className="text-sm leading-loose" style={{ color: '#b8c8e0' }}>
              反1 ETF 每日反向追蹤指數，長期持有因<strong style={{ color: 'var(--red)' }}>波動耗損</strong>損失極大。
              歷史上台股長期走多，反1長期持有勝率極低，<strong style={{ color: 'var(--red)' }}>僅適合短線空頭避險</strong>，不建議長期持有。
            </div>
          </div>
        )}
      </div>

      {/* AdSense — Article Bottom */}
      <div className="flex justify-center my-10">
        <div className="w-full max-w-[728px] h-[90px] flex items-center justify-center text-xs font-mono rounded border border-dashed" style={{ color: 'var(--muted2)', borderColor: 'var(--border2)' }}>
          {/* Replace with Google AdSense ins tag — 728×90 */}
          AD SLOT · ARTICLE BOTTOM 728×90
        </div>
      </div>

      {/* Other ETFs */}
      <div className="mb-10">
        <div className="font-mono text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--muted)' }}>▸ 其他 ETF</div>
        <div className="flex flex-wrap gap-2">
          {allETFs.filter(e => e.ticker !== etf.ticker).map(e => {
            const ec = e.current.signal === 'green' ? 'var(--green)' : e.current.signal === 'yellow' ? 'var(--yellow)' : 'var(--red)'
            return (
              <Link
                key={e.ticker}
                href={`/etf/${e.ticker}`}
                className="font-mono text-[11px] px-3.5 py-1.5 rounded-full transition-all duration-200"
                style={{ border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--muted)' }}
                onMouseEnter={undefined}
              >
                {e.ticker} · {e.name}
              </Link>
            )
          })}
        </div>
      </div>

      <footer className="pt-7" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11px] leading-loose text-center" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--red)' }}>⚠ 免責聲明：</strong>
          本站所有內容均為歷史統計資料，僅供教育與研究參考用途，
          <strong style={{ color: 'var(--red)' }}>不構成任何投資建議、推介或勸誘買賣任何金融商品</strong>。<br />
          歷史勝率不代表未來績效，投資必有風險，實際交易前請自行評估風險承受度，或諮詢合格理財顧問。
        </p>
      </footer>
    </main>
  )
}

function Chip({ type, children }: { type: 'g' | 'y' | 'r'; children: React.ReactNode }) {
  const styles = {
    g: { color: 'var(--green)', background: 'rgba(0,217,139,.08)', border: '1px solid rgba(0,217,139,.3)' },
    y: { color: 'var(--yellow)', background: 'rgba(240,180,41,.08)', border: '1px solid rgba(240,180,41,.3)' },
    r: { color: 'var(--red)', background: 'rgba(240,69,90,.08)', border: '1px solid rgba(240,69,90,.3)' },
  }[type]
  return (
    <div className="font-mono text-[11px] px-3.5 py-1.5 rounded-full" style={styles}>
      {children}
    </div>
  )
}
