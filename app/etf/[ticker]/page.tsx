import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getETFByTicker, getAllTickers, getSignalsData, formatBias, formatRet } from '@/lib/data'
import { ETFData, SeasonalEntry, BiasPoint } from '@/types/etf'
import Tooltip from '@/components/Tooltip'
import Glossary from '@/components/Glossary'

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

  // G2: Target price calculation
  const threshold = etf.type === 'lev2' ? 7 : 5
  const neutralTarget = Math.round(etf.current.ma20 * (1 - threshold / 100) * 100) / 100
  const deepTarget = Math.round(neutralTarget * 0.9 * 100) / 100
  const pctToNeutral = ((etf.current.latest_price - neutralTarget) / etf.current.latest_price * 100)
  const pctToDeep = ((etf.current.latest_price - deepTarget) / etf.current.latest_price * 100)

  // G4: Last undervalued time from bias_history
  const bh = etf.bias_history ?? []
  const lowThresh = etf.type === 'lev2' ? -7 : -5
  const lastUnderIdx = (() => {
    for (let i = bh.length - 1; i >= 0; i--) {
      if (bh[i].bias <= lowThresh) return i
    }
    return -1
  })()
  const lastUnderMonth = lastUnderIdx >= 0 ? bh[lastUnderIdx].month : null
  const monthsAgo = lastUnderIdx >= 0 ? bh.length - 1 - lastUnderIdx : null

  return (
    <main style={{ width: '100%', maxWidth: '1020px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '64px' }}>
      {/* 返回按鈕 */}
      <div className="pt-6 mb-6">
        <Link href="/" className="font-mono text-[11px] tracking-widest uppercase transition-colors" style={{ color: 'var(--muted)' }}>
          ← 返回儀表板
        </Link>
      </div>

      {/* 類型標籤 */}
      <div className="flex items-center gap-3.5 mb-6">
        <div className="font-mono text-[10px] tracking-[3px] uppercase px-3 py-1 rounded font-semibold" style={tagStyle}>
          {typeLabel}
        </div>
      </div>

      {/* 主要資訊面板 */}
      <div className="animate-fadeUp rounded-[18px] p-8 mb-11" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>

        {/* 標題列 + 當前訊號 */}
        <div className="flex justify-between items-start mb-7 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black">{etf.name}（{etf.ticker}）</h2>
            <div className="font-mono text-[11px] mt-1.5 leading-loose" style={{ color: 'var(--muted)' }}>
              追蹤指數：{etf.index}<br />
              回測
              <Tooltip text="使用歷史真實股價數據，模擬不同時間點買進的損益結果。歷史統計不代表未來績效保證。" />
              區間：{etf.data_range} · 有效樣本 {etf.sample_months} 個月
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>當前訊號</div>
            <div className="font-mono text-xl font-bold" style={{ color: sigColor }}>
              {etf.current.label} {etf.type !== 'inv1' ? sigIcon : '✕'}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
              月線乖離 {formatBias(etf.current.bias)}
              <Tooltip text="現在股價距離近 20 日平均成本的差距百分比。正值代表比均價貴，負值代表比均價便宜。" />
            </div>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          <Chip type={sig === 'red' ? 'r' : sig === 'green' ? 'g' : 'y'}>
            {sig === 'red' ? '✕' : sig === 'green' ? '✓' : '△'} 月線乖離 {formatBias(etf.current.bias)}（{sig === 'red' ? `超過 +${threshold}% 高估門檻` : sig === 'green' ? `低於 −${threshold}% 低估區間` : '中性區間'}）
          </Chip>
          <Chip type={sig === 'red' ? 'r' : sig === 'green' ? 'g' : 'y'}>
            {sig === 'red' ? '✕' : sig === 'green' ? '✓' : '△'} 當前收盤 {etf.current.latest_price} · MA20 = {etf.current.ma20}
          </Chip>
        </div>

        {/* G2：目標股價（僅偏高估且非反1時顯示） */}
        {sig === 'red' && etf.type !== 'inv1' && (
          <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(240,69,90,.06)', border: '1px solid rgba(240,69,90,.2)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'var(--red)' }}>
              🎯 回落參考目標價
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
                  回到中性區間（乖離 −{threshold}%）
                </div>
                <div className="font-mono text-[20px] font-black" style={{ color: 'var(--yellow)' }}>
                  NT$ {neutralTarget}
                </div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  尚需下跌 {pctToNeutral.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>
                  偏低估深度目標（再跌 10%）
                </div>
                <div className="font-mono text-[20px] font-black" style={{ color: 'var(--green)' }}>
                  NT$ {deepTarget}
                </div>
                <div className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  尚需下跌 {pctToDeep.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="font-mono text-[9px]" style={{ color: 'var(--muted2)' }}>
              ⚠ 以上為靜態估算，均線每日變動，實際數值請持續追蹤。中性目標 = MA20 × {((1 - threshold / 100)).toFixed(2)}
            </div>
          </div>
        )}

        {/* G3：定期定額加碼比例建議 */}
        {etf.type !== 'inv1' && (
          <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'var(--muted)' }}>
              💰 定期定額投資人的參考做法
            </div>
            <div className="rounded-lg overflow-hidden mb-2" style={{ border: '1px solid var(--border)' }}>
              {[
                {
                  zone: 'green',
                  label: '🟢 偏低估',
                  ratio: '150%',
                  desc: '相對便宜，可考慮加碼',
                  active: sig === 'green',
                  color: 'var(--green)',
                  bg: 'rgba(0,217,139,.08)',
                },
                {
                  zone: 'yellow',
                  label: '🟡 中性',
                  ratio: '100%',
                  desc: '照常執行定期定額',
                  active: sig === 'yellow',
                  color: 'var(--yellow)',
                  bg: 'rgba(240,180,41,.06)',
                },
                {
                  zone: 'red',
                  label: '🔴 偏高估',
                  ratio: '50%',
                  desc: '偏貴，建議縮減單次金額',
                  active: sig === 'red',
                  color: 'var(--red)',
                  bg: 'rgba(240,69,90,.08)',
                },
              ].map((row, i) => (
                <div
                  key={row.zone}
                  className="flex items-center gap-3 px-4 py-2.5"
                  style={{
                    background: row.active ? row.bg : 'transparent',
                    borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div className="font-mono text-[11px] w-20 flex-shrink-0" style={{ color: row.active ? row.color : 'var(--muted)' }}>
                    {row.label}
                  </div>
                  <div className="font-mono text-[13px] font-bold w-14 flex-shrink-0" style={{ color: row.active ? row.color : 'var(--muted)' }}>
                    {row.ratio}
                  </div>
                  <div className="text-[11px]" style={{ color: row.active ? 'var(--text)' : 'var(--muted2)' }}>
                    {row.desc}
                  </div>
                  {row.active && (
                    <div className="ml-auto font-mono text-[9px] px-2 py-0.5 rounded-full" style={{ background: row.bg, color: row.color, border: `1px solid ${row.color}` }}>
                      目前狀態
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="font-mono text-[9px]" style={{ color: 'var(--muted2)' }}>
              ⚠ 此為基於歷史統計的參考建議，非投資建議，請依個人財務狀況自行判斷。
            </div>
          </div>
        )}

        {/* 推導邏輯 */}
        <div className="rounded-[10px] p-5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderLeft: '3px solid var(--green)' }}>
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3" style={{ color: 'var(--green)' }}>
            📐 推導邏輯 — 月線乖離率
            <Tooltip text="現在股價距離近 20 日平均成本的差距百分比。正值代表比均價貴，負值代表比均價便宜。偏高估（≥+5%）建議減少加碼；偏低估（≤−5%）歷史勝率較高。" />
          </div>
          <div className="text-sm leading-loose" style={{ color: '#b8c8e0' }}>
            本站以 <strong style={{ color: 'var(--green)' }}>月線乖離率（20日均線）</strong> 作為核心判斷指標：<br /><br />
            ✅ <strong style={{ color: 'var(--green)' }}>偏低估（乖離 ≤ −{threshold}%）</strong>：歷史上為相對好的進場時機，長期勝率偏高<br />
            🟡 <strong style={{ color: 'var(--yellow)' }}>中性區間（−{threshold}% ~ +{threshold}%）</strong>：普通定期定額繼續執行即可<br />
            🔴 <strong style={{ color: 'var(--red)' }}>偏高估（乖離 ≥ +{threshold}%）</strong>：短期回調風險偏高，建議減少單次加碼金額<br /><br />
            ⚠️ 本統計為歷史數據，不代表未來結果，不構成投資建議。
          </div>
        </div>

        {/* 所有持有期勝率 */}
        <div className="mb-7">
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-3.5" style={{ color: 'var(--muted)' }}>
            ▸ 所有持有期<span style={{ letterSpacing: 0 }}>勝率</span>
            <Tooltip text="歷史上在同樣時間點買進，持有滿指定天數後仍有獲利的比例。例如 365日勝率 71% = 過去持有一年，有 71% 的時間是賺錢的。" />
            （全時段，不限觸發條件）
          </div>
          {(['30d','60d','90d','180d','365d'] as const).map((period, i) => {
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
                <div className="font-mono text-[11px] ml-1" style={{ color: 'var(--muted)' }}>
                  中位 {med}
                  {i === 0 && <Tooltip text="歷史持有報酬排在中間的數字。比平均值更穩定，不會被少數極端值拉偏。" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* E3：依進場乖離率分區的條件勝率對照表 */}
        {etf.conditional_winrates && etf.type !== 'inv1' && (
          <div className="rounded-xl p-5 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-1" style={{ color: 'var(--muted)' }}>
              ▸ 不同時機進場，結果差多少？
            </div>
            <div className="text-[11px] mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
              本站核心策略：等乖離率偏低時才加碼。以下是歷史上在三種時機進場、<strong style={{ color: 'var(--text)' }}>持有 12 個月後</strong>的實際差異。
            </div>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {/* Header */}
              <div className="grid grid-cols-4 px-4 py-2 font-mono text-[9px] tracking-widest uppercase" style={{ background: 'var(--border)', color: 'var(--muted)' }}>
                <div>進場時機</div>
                <div className="text-center">樣本數</div>
                <div className="text-center">12月勝率</div>
                <div className="text-center">中位報酬</div>
              </div>
              {[
                {
                  key: 'green' as const,
                  label: `🟢 偏低估（≤ −${threshold}%）`,
                  color: 'var(--green)',
                  bg: 'rgba(0,217,139,.07)',
                },
                {
                  key: 'yellow' as const,
                  label: `🟡 中性（−${threshold}% ～ +${threshold}%）`,
                  color: 'var(--yellow)',
                  bg: 'transparent',
                },
                {
                  key: 'red' as const,
                  label: `🔴 偏高估（≥ +${threshold}%）`,
                  color: 'var(--red)',
                  bg: 'rgba(240,69,90,.05)',
                },
              ].map((row, i) => {
                const zone = etf.conditional_winrates![row.key]
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-4 items-center px-4 py-3"
                    style={{
                      background: row.bg,
                      borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div className="font-mono text-[10px]" style={{ color: row.color }}>{row.label}</div>
                    <div className="font-mono text-[12px] font-semibold text-center" style={{ color: 'var(--muted)' }}>
                      {zone.count}
                    </div>
                    <div className="font-mono text-[14px] font-bold text-center" style={{ color: zone.win_rate != null ? row.color : 'var(--muted2)' }}>
                      {zone.win_rate != null ? `${zone.win_rate}%` : 'N/A'}
                    </div>
                    <div className="font-mono text-[14px] font-bold text-center" style={{ color: zone.median_ret != null ? (zone.median_ret >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted2)' }}>
                      {zone.median_ret != null ? `${zone.median_ret >= 0 ? '+' : ''}${zone.median_ret}%` : 'N/A'}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="font-mono text-[9px] mt-2.5" style={{ color: 'var(--muted2)' }}>
              ⚠ 歷史統計，樣本數越少代表該區間出現次數越少，參考性越低。
            </div>
          </div>
        )}

        {/* G1：近 24 個月乖離率走勢圖 */}
        {bh.length >= 3 && (
          <div className="rounded-xl p-5 mb-4" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <div className="font-mono text-[10px] tracking-[2px] uppercase mb-1" style={{ color: 'var(--muted)' }}>
              ▸ 近 24 個月乖離率走勢
            </div>
            <div className="text-[10px] mb-4" style={{ color: 'var(--muted2)' }}>
              讓你看出上次偏低估是什麼時候，以及目前處於歷史高低位的哪個位置。
            </div>
            <BiasHistoryChart history={bh} etfType={etf.type} currentBias={etf.current.bias} />
            <div className="flex gap-4 mt-3 font-mono text-[9px]" style={{ color: 'var(--muted2)' }}>
              <span style={{ color: 'rgba(240,69,90,.6)' }}>■ 偏高估（≥+{threshold}%）</span>
              <span style={{ color: 'rgba(240,180,41,.5)' }}>■ 中性</span>
              <span style={{ color: 'rgba(0,217,139,.6)' }}>■ 偏低估（≤−{threshold}%）</span>
            </div>
          </div>
        )}

        {/* G4：上次進入偏低估的時間點 */}
        <div className="rounded-xl px-5 py-4 mb-7" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <div className="font-mono text-[10px] tracking-[2px] uppercase mb-2" style={{ color: 'var(--muted)' }}>
            ▸ 上次進入偏低估區間
          </div>
          {lastUnderMonth ? (
            <div className="font-mono text-[13px]" style={{ color: 'var(--green)' }}>
              📅 {lastUnderMonth}（距今約 {monthsAgo} 個月前）
            </div>
          ) : (
            <div className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>
              過去 {bh.length > 0 ? `${bh.length} 個月` : '24 個月'}內未出現偏低估訊號，
              顯示目前市場持續維持在均線以上。
            </div>
          )}
        </div>

        {/* 各月份中位報酬柱狀圖 */}
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

        {/* 月份效應熱度圖 */}
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

        {/* 正2 提醒 */}
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

        {/* 反1 說明 */}
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

      {/* 廣告位（暫時隱藏）*/}

      {/* 其他 ETF */}
      <div className="mb-10">
        <div className="font-mono text-[10px] tracking-[3px] uppercase mb-4" style={{ color: 'var(--muted)' }}>▸ 其他 ETF</div>
        <div className="flex flex-wrap gap-2">
          {allETFs.filter(e => e.ticker !== etf.ticker).map(e => (
            <Link
              key={e.ticker}
              href={`/etf/${e.ticker}`}
              className="font-mono text-[11px] px-3.5 py-1.5 rounded-full transition-all duration-200"
              style={{ border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--muted)' }}
            >
              {e.ticker} · {e.name}
            </Link>
          ))}
        </div>
      </div>

      {/* F2：名詞說明摺疊區塊 */}
      <Glossary />

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

// ── 子元件 ─────────────────────────────────────────────────────────────────

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

// G1：乖離率走勢 SVG 折線圖（純 server-side，無需 client JS）
function BiasHistoryChart({
  history,
  etfType,
  currentBias,
}: {
  history: BiasPoint[]
  etfType: string
  currentBias: number
}) {
  if (history.length < 3) return null

  const W = 560, H = 130
  const padL = 34, padR = 8, padT = 14, padB = 22
  const cW = W - padL - padR
  const cH = H - padT - padB

  const yMin = -20, yMax = 20
  const thr = etfType === 'lev2' ? 7 : 5

  // clamp + map bias value to SVG y coordinate
  const bToY = (b: number) =>
    padT + cH * (yMax - Math.max(yMin, Math.min(yMax, b))) / (yMax - yMin)
  const iToX = (i: number) =>
    padL + (history.length < 2 ? 0 : (cW * i) / (history.length - 1))

  const yTop = bToY(thr)   // e.g. +5% line
  const y0   = bToY(0)
  const yBot = bToY(-thr)  // e.g. -5% line

  const pts = history
    .map((p, i) => `${iToX(i).toFixed(1)},${bToY(p.bias).toFixed(1)}`)
    .join(' ')

  const lastX = iToX(history.length - 1)
  const lastBias = history[history.length - 1].bias
  const lastY = bToY(lastBias)
  const dotColor =
    lastBias <= -thr ? '#00d98b' : lastBias >= thr ? '#f0455a' : '#f0b429'

  // Show label every 6 months + first + last
  const labelIdxs = [...new Set([
    0,
    ...Array.from({ length: history.length }, (_, i) => i).filter(i => i % 6 === 0),
    history.length - 1,
  ])]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      {/* 背景色區 */}
      <rect x={padL} y={padT}    width={cW} height={yTop - padT}           fill="rgba(240,69,90,.08)" />
      <rect x={padL} y={yTop}    width={cW} height={yBot - yTop}            fill="rgba(240,180,41,.05)" />
      <rect x={padL} y={yBot}    width={cW} height={padT + cH - yBot}       fill="rgba(0,217,139,.08)" />

      {/* 分隔虛線 */}
      <line x1={padL} y1={yTop} x2={padL + cW} y2={yTop}
        stroke="rgba(240,69,90,.3)" strokeWidth="1" strokeDasharray="3,2" />
      <line x1={padL} y1={y0}   x2={padL + cW} y2={y0}
        stroke="rgba(255,255,255,.08)" strokeWidth="1" />
      <line x1={padL} y1={yBot} x2={padL + cW} y2={yBot}
        stroke="rgba(0,217,139,.3)" strokeWidth="1" strokeDasharray="3,2" />

      {/* Y 軸標籤 */}
      <text x={padL - 3} y={yTop + 3.5}  textAnchor="end" fontSize="8.5" fill="rgba(240,69,90,.55)"  fontFamily="monospace">+{thr}%</text>
      <text x={padL - 3} y={y0 + 3.5}    textAnchor="end" fontSize="8.5" fill="rgba(255,255,255,.22)" fontFamily="monospace">0%</text>
      <text x={padL - 3} y={yBot + 3.5}  textAnchor="end" fontSize="8.5" fill="rgba(0,217,139,.55)"  fontFamily="monospace">-{thr}%</text>

      {/* 折線 */}
      <polyline
        points={pts}
        fill="none"
        stroke="rgba(148,198,255,.8)"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 目前位置圓點 */}
      <circle cx={lastX} cy={lastY} r="6"   fill="none"     stroke={dotColor} strokeWidth="1" opacity="0.45" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={dotColor} />

      {/* X 軸月份標籤 */}
      {labelIdxs.map(i =>
        i < history.length ? (
          <text
            key={i}
            x={iToX(i)}
            y={H - 5}
            textAnchor="middle"
            fontSize="8.5"
            fill="rgba(255,255,255,.28)"
            fontFamily="monospace"
          >
            {history[i].month}
          </text>
        ) : null
      )}
    </svg>
  )
}
