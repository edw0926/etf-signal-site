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
  const signal = etf.current.signal === 'green' ? '偏低估' : etf.current.signal === 'yellow' ? '中性' : '偏高估'
  return {
    title: `${etf.ticker} ${etf.name} 訊號分析 | 台股ETF訊號站`,
    description: `${etf.name}（${etf.ticker}）當前訊號：${signal}，月線乖離率${formatBias(etf.current.bias)}。回測區間 ${etf.data_range}，${etf.sample_months}個月歷史數據。`,
  }
}

// 區塊標題（統一樣式，取代 emoji 標頭）
function SectionTitle({ children, accent = 'var(--muted2)' }: { children: React.ReactNode; accent?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="inline-block w-1 h-3.5 rounded-full flex-shrink-0" style={{ background: accent }} />
      <span className="text-[13px] font-bold" style={{ color: 'var(--text2)', fontFamily: 'var(--font-noto-sans)' }}>
        {children}
      </span>
    </div>
  )
}

export default async function ETFDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params
  const etf = getETFByTicker(ticker)
  if (!etf) notFound()

  const data = getSignalsData()
  const allETFs = Object.values(data.etfs)

  const sig = etf.current.signal
  const sigColor = sig === 'green' ? 'var(--green)' : sig === 'yellow' ? 'var(--yellow)' : 'var(--red)'

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
    base: { color: 'var(--blue)',   background: 'rgba(110,168,247,.1)', border: '1px solid rgba(110,168,247,.25)' },
    lev:  { color: 'var(--green)',  background: 'rgba(63,214,143,.1)',  border: '1px solid rgba(63,214,143,.25)' },
    inv:  { color: 'var(--orange)', background: 'rgba(217,138,79,.1)',  border: '1px solid rgba(217,138,79,.25)' },
  }[typeTag]

  const threshold = etf.type === 'lev2' ? 7 : 5

  // 目標股價
  const neutralTarget = Math.round(etf.current.ma20 * (1 - threshold / 100) * 100) / 100
  const deepTarget = Math.round(neutralTarget * 0.9 * 100) / 100
  const pctToNeutral = ((etf.current.latest_price - neutralTarget) / etf.current.latest_price * 100)
  const pctToDeep = ((etf.current.latest_price - deepTarget) / etf.current.latest_price * 100)

  // 上次偏低估
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

  const inv1WR365 = etf.winrates['365d']?.win_rate ?? null

  const dcaRows = [
    { zone: 'green',  label: '偏低估', ratio: '150%', desc: '相對便宜，可考慮加碼',    active: sig === 'green',  color: 'var(--green)',  bg: 'rgba(63,214,143,.08)' },
    { zone: 'yellow', label: '中性',   ratio: '100%', desc: '照常執行定期定額',        active: sig === 'yellow', color: 'var(--yellow)', bg: 'rgba(227,176,75,.08)' },
    { zone: 'red',    label: '偏高估', ratio: '50%',  desc: '偏貴，建議縮減單次金額', active: sig === 'red',    color: 'var(--red)',    bg: 'rgba(239,111,129,.08)' },
  ]
  const currentDCA = dcaRows.find(r => r.active) ?? dcaRows[1]

  return (
    <main style={{ width: '100%', maxWidth: '1020px', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '72px' }}>
      {/* 返回 */}
      <div className="pt-7 mb-7">
        <Link href="/" className="text-[13px] no-underline transition-colors" style={{ color: 'var(--muted)' }}>
          ← 返回總覽
        </Link>
      </div>

      {/* 標題區 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={tagStyle}>
            {typeLabel}
          </div>
          <div className="font-mono text-[12px]" style={{ color: 'var(--muted)' }}>{etf.ticker}</div>
        </div>
        <div className="flex justify-between items-end flex-wrap gap-5">
          <div>
            <h1 className="text-[26px] font-black leading-tight mb-2">{etf.name}</h1>
            <div className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              追蹤指數：{etf.index}<br />
              回測
              <Tooltip text="使用歷史真實股價數據，模擬不同時間點買進的損益結果。歷史統計不代表未來績效保證。" />
              區間 {etf.data_range} · 有效樣本 {etf.sample_months} 個月
            </div>
          </div>
          <div className="text-right">
            {etf.type === 'inv1' ? (
              <div>
                <div className="text-[11px] mb-1" style={{ color: 'var(--muted)' }}>當前狀態</div>
                <div className="text-[18px] font-bold" style={{ color: 'var(--orange)', fontFamily: 'var(--font-noto-sans)' }}>
                  反向 ETF · 不建議長期持有
                </div>
                <div className="font-mono text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
                  乖離率 {formatBias(etf.current.bias)}
                  {inv1WR365 != null && ` · 365日勝率 ${inv1WR365}%`}
                </div>
              </div>
            ) : (
              <div>
                <div className="text-[11px] mb-1" style={{ color: 'var(--muted)' }}>當前訊號</div>
                <div className="flex items-center justify-end gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: sigColor }} />
                  <span className="text-[20px] font-bold" style={{ color: sigColor, fontFamily: 'var(--font-noto-sans)' }}>
                    {etf.current.label}
                  </span>
                </div>
                <div className="font-mono text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
                  月線乖離 {formatBias(etf.current.bias)}
                  <Tooltip text="現在股價距離近 20 日平均成本的差距百分比。正值代表比均價貴，負值代表比均價便宜。" />
                </div>
                <div className="font-mono text-[11px] mt-0.5" style={{ color: 'var(--muted2)' }}>
                  收盤 ${etf.current.latest_price} · MA20 ${etf.current.ma20}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 內容區 */}
      <div className="flex flex-col" style={{ gap: '32px' }}>

        {/* 反1 警示 */}
        {etf.type === 'inv1' && (
          <div className="rounded-xl p-6" style={{ background: 'rgba(217,138,79,.06)', border: '1px solid rgba(217,138,79,.25)' }}>
            <SectionTitle accent="var(--orange)">使用警示</SectionTitle>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>
              {inv1WR365 != null && (
                <p className="mb-2">
                  本標的歷史 <strong style={{ color: 'var(--orange)' }}>365 日勝率僅 {inv1WR365}%</strong>，
                  長期持有損耗極大，不建議作為主要投資標的，僅適合短線空頭避險使用。
                </p>
              )}
              <p style={{ color: 'var(--muted)' }}>
                反1 ETF 追蹤每日反向指數，乖離率與大盤方向相反，不適用偏高估／偏低估進場邏輯。
                當大盤上漲、乖離率為負，僅代表台股上漲趨勢強勁，並非此 ETF 的進場機會。
              </p>
            </div>
          </div>
        )}

        {/* 目標股價（僅偏高估且非反1） */}
        {sig === 'red' && etf.type !== 'inv1' && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <SectionTitle accent="var(--red)">回落參考目標價</SectionTitle>
            <div className="grid grid-cols-2 gap-6 mb-3">
              <div>
                <div className="text-[11px] mb-1.5" style={{ color: 'var(--muted)' }}>
                  回到中性區間（乖離 −{threshold}%）
                </div>
                <div className="font-mono text-[22px] font-semibold" style={{ color: 'var(--yellow)' }}>
                  ${neutralTarget}
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                  距現價 −{pctToNeutral.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[11px] mb-1.5" style={{ color: 'var(--muted)' }}>
                  偏低估深度目標（再跌 10%）
                </div>
                <div className="font-mono text-[22px] font-semibold" style={{ color: 'var(--green)' }}>
                  ${deepTarget}
                </div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>
                  距現價 −{pctToDeep.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="text-[11px]" style={{ color: 'var(--muted2)' }}>
              以上為靜態估算，均線每日變動，實際數值請持續追蹤。中性目標 = MA20 × {((1 - threshold / 100)).toFixed(2)}
            </div>
          </div>
        )}

        {/* 定期定額 */}
        {etf.type !== 'inv1' && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <SectionTitle accent={currentDCA.color}>定期定額參考做法</SectionTitle>
            <div
              className="flex items-center flex-wrap gap-x-3 gap-y-1 px-4 py-3 rounded-lg mb-3"
              style={{ background: currentDCA.bg, border: `1px solid ${currentDCA.color}30` }}
            >
              <span className="text-[12px] font-medium" style={{ color: currentDCA.color }}>目前建議</span>
              <span className="font-mono text-[17px] font-semibold" style={{ color: currentDCA.color }}>{currentDCA.ratio}</span>
              <span className="text-[13px]" style={{ color: 'var(--text2)' }}>{currentDCA.label} · {currentDCA.desc}</span>
            </div>
            <details className="chevron">
              <summary className="text-[12px] cursor-pointer select-none inline-flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                查看完整對照表 <span className="chev">▾</span>
              </summary>
              <div className="rounded-lg overflow-hidden mt-3" style={{ border: '1px solid var(--border)' }}>
                {dcaRows.map((row, i) => (
                  <div
                    key={row.zone}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{
                      background: row.active ? row.bg : 'transparent',
                      borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                    <div className="text-[12px] w-16 flex-shrink-0" style={{ color: row.active ? row.color : 'var(--muted)' }}>
                      {row.label}
                    </div>
                    <div className="font-mono text-[13px] font-semibold w-14 flex-shrink-0" style={{ color: row.active ? row.color : 'var(--muted)' }}>
                      {row.ratio}
                    </div>
                    <div className="text-[12px]" style={{ color: row.active ? 'var(--text2)' : 'var(--muted2)' }}>
                      {row.desc}
                    </div>
                    {row.active && (
                      <div className="ml-auto text-[10px] px-2 py-0.5 rounded-full flex-shrink-0" style={{ color: row.color, border: `1px solid ${row.color}50` }}>
                        目前狀態
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
            <div className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>
              此為基於歷史統計的參考建議，非投資建議，請依個人財務狀況自行判斷。
            </div>
          </div>
        )}

        {/* 所有持有期勝率 */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>
            所有持有期勝率
            <Tooltip text="歷史上在同樣時間點買進，持有滿指定天數後仍有獲利的比例。例如 365日勝率 71% = 過去持有一年，有 71% 的時間是賺錢的。" />
            <span className="font-normal" style={{ color: 'var(--muted2)' }}>（全時段，不限觸發條件）</span>
          </SectionTitle>
          {(['30d','60d','90d','180d','365d'] as const).map((period, i) => {
            const wr = etf.winrates[period]
            if (!wr) return null
            const label = { '30d':'30 天', '60d':'60 天', '90d':'90 天', '180d':'180 天', '365d':'365 天' }[period]
            const med = formatRet(wr.median_ret)
            return (
              <div key={period} className="flex items-center gap-4 mb-3.5">
                <div className="text-[12px] w-[52px] flex-shrink-0" style={{ color: 'var(--muted)' }}>{label}</div>
                <div className="flex-1 h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${wr.win_rate}%`, background: 'var(--green)' }} />
                </div>
                <div className="font-mono text-[13px] font-semibold w-[46px] text-right" style={{ color: 'var(--text2)' }}>
                  {wr.win_rate}%
                </div>
                <div className="text-[12px] w-[92px]" style={{ color: 'var(--muted)' }}>
                  中位 <span className="font-mono">{med}</span>
                  {i === 0 && <Tooltip text="歷史持有報酬排在中間的數字。比平均值更穩定，不會被少數極端值拉偏。" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* 條件勝率對照表 */}
        {etf.conditional_winrates && etf.type !== 'inv1' && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <SectionTitle>不同時機進場，結果差多少？</SectionTitle>
            <p className="text-[12px] mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
              本站核心策略：等乖離率偏低時才加碼。以下是歷史上在三種時機進場、持有 12 個月後的實際差異。
            </p>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="grid grid-cols-4 px-4 py-2.5 text-[11px]" style={{ background: 'var(--surface2)', color: 'var(--muted)' }}>
                <div>進場時機</div>
                <div className="text-center">樣本數</div>
                <div className="text-center">12月勝率</div>
                <div className="text-center">中位報酬</div>
              </div>
              {[
                { key: 'green'  as const, label: `偏低估 ≤ −${threshold}%`,               color: 'var(--green)',  bg: 'rgba(63,214,143,.06)' },
                { key: 'yellow' as const, label: `中性 −${threshold}%～+${threshold}%`,   color: 'var(--yellow)', bg: 'transparent' },
                { key: 'red'    as const, label: `偏高估 ≥ +${threshold}%`,               color: 'var(--red)',    bg: 'rgba(239,111,129,.05)' },
              ].map((row, i) => {
                const zone = etf.conditional_winrates![row.key]
                return (
                  <div
                    key={row.key}
                    className="grid grid-cols-4 items-center px-4 py-3"
                    style={{ background: row.bg, borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className="text-[12px] flex items-center gap-2">
                      <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                      <span style={{ color: 'var(--text2)' }}>{row.label}</span>
                    </div>
                    <div className="font-mono text-[12px] text-center" style={{ color: 'var(--muted)' }}>{zone.count}</div>
                    <div className="font-mono text-[14px] font-semibold text-center" style={{ color: zone.win_rate != null ? 'var(--text)' : 'var(--muted2)' }}>
                      {zone.win_rate != null ? `${zone.win_rate}%` : 'N/A'}
                    </div>
                    <div className="font-mono text-[14px] font-semibold text-center" style={{ color: zone.median_ret != null ? (zone.median_ret >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--muted2)' }}>
                      {zone.median_ret != null ? `${zone.median_ret >= 0 ? '+' : ''}${zone.median_ret}%` : 'N/A'}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-[11px] mt-3" style={{ color: 'var(--muted2)' }}>
              歷史統計，樣本數越少代表該區間出現次數越少，參考性越低。
            </div>
          </div>
        )}

        {/* 近 24 個月乖離率走勢 */}
        {bh.length >= 3 && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <SectionTitle>近 24 個月乖離率走勢</SectionTitle>
            <p className="text-[12px] mb-5 leading-relaxed" style={{ color: 'var(--muted)' }}>
              看出上次偏低估是什麼時候，以及目前處於歷史高低位的哪個位置。
            </p>
            <BiasHistoryChart history={bh} etfType={etf.type} currentBias={etf.current.bias} />
            <div className="flex gap-5 mt-4 text-[11px]" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(239,111,129,.35)' }} />
                偏高估 ≥ +{threshold}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(227,176,75,.3)' }} />
                中性
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: 'rgba(63,214,143,.35)' }} />
                偏低估 ≤ −{threshold}%
              </span>
            </div>
          </div>
        )}

        {/* 上次偏低估 */}
        <div className="rounded-xl px-6 py-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>上次進入偏低估區間</SectionTitle>
          {lastUnderMonth ? (
            <div className="text-[14px]" style={{ color: 'var(--green)' }}>
              <span className="font-mono font-semibold">{lastUnderMonth}</span>
              <span className="text-[13px] ml-2" style={{ color: 'var(--muted)' }}>距今約 {monthsAgo} 個月前</span>
            </div>
          ) : (
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              過去 {bh.length > 0 ? `${bh.length} 個月` : '24 個月'}內未出現偏低估訊號，顯示目前市場持續維持在均線以上。
            </div>
          )}
        </div>

        {/* 各月份中位報酬 */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>
            各月份進場 · 持有 90 天中位報酬
            <span className="font-normal" style={{ color: 'var(--muted2)' }}>（{etf.data_range} 真實回測）</span>
          </SectionTitle>
          <div className="flex items-end gap-1.5 h-[130px] mt-5">
            {Object.entries(seasonal).map(([m, d]) => {
              const val = d.median_ret ?? 0
              const h = Math.abs(val) / maxAbs * 88
              const isPos = val >= 0
              const sign = isPos ? '+' : ''
              return (
                <div key={m} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
                  <div className="font-mono text-[9px]" style={{ color: isPos ? 'var(--green)' : 'var(--red)' }}>
                    {sign}{val.toFixed(1)}%
                  </div>
                  <div
                    className="w-full min-h-[2px]"
                    style={{
                      height: `${h}%`,
                      background: isPos ? 'var(--green)' : 'var(--red)',
                      borderRadius: '4px 4px 0 0',
                      opacity: 0.85,
                    }}
                  />
                  <div className="text-[10px]" style={{ color: 'var(--muted)' }}>{m}月</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 月份效應熱度圖 */}
        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <SectionTitle>月份效應熱度圖<span className="font-normal" style={{ color: 'var(--muted2)' }}>（持有 90 天勝率）</span></SectionTitle>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mt-5">
            {Object.entries(seasonal).map(([m, d]) => {
              const norm = maxWR === minWR ? 0.5 : (d.win_rate - minWR) / (maxWR - minWR)
              const a = 0.08 + norm * 0.55
              const isWin = d.win_rate >= 60
              const bg = isWin ? `rgba(63,214,143,${a})` : `rgba(239,111,129,${(1 - norm) * 0.45 + 0.08})`
              return (
                <div
                  key={m}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5"
                  style={{ background: bg }}
                  title={`${m}月 勝率 ${d.win_rate}% · 樣本 ${d.sample} 筆`}
                >
                  <div className="text-[10px]" style={{ color: 'rgba(255,255,255,.5)' }}>{m}月</div>
                  <div className="font-mono text-[11px] font-semibold" style={{ color: 'var(--text)' }}>{d.win_rate}%</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
            {(() => {
              const sorted = Object.entries(seasonal).sort((a, b) => (b[1].win_rate) - (a[1].win_rate))
              const top3 = sorted.slice(0, 3).map(([m, d]) => `${m}月（${d.win_rate}%）`).join('、')
              const bot1 = sorted.slice(-1).map(([m, d]) => `${m}月（${d.win_rate}%）`).join('')
              return <>
                歷史統計強勢月：<strong style={{ color: 'var(--green)' }}>{top3}</strong>；
                弱勢月：<strong style={{ color: 'var(--red)' }}>{bot1}</strong> 相對最低。
              </>
            })()}
          </div>
        </div>

        {/* 正2 提醒 */}
        {etf.type === 'lev2' && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--yellow)' }}>
            <SectionTitle accent="var(--yellow)">正2 持有期重要提醒</SectionTitle>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>
              正2 ETF 追蹤的是<strong style={{ color: 'var(--yellow)' }}>單日報酬的兩倍</strong>，長期持有會因
              <strong style={{ color: 'var(--yellow)' }}>波動耗損（Volatility Decay）</strong>導致績效低於預期。
              建議持有期以 <strong style={{ color: 'var(--yellow)' }}>30～90 天</strong>為主，並在乖離率回到 −7% 以下後才考慮建倉。
            </div>
          </div>
        )}

        {/* 反1 補充說明 */}
        {etf.type === 'inv1' && (
          <div className="rounded-xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: '3px solid var(--orange)' }}>
            <SectionTitle accent="var(--orange)">反1 使用重要說明</SectionTitle>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--text2)' }}>
              反1 ETF 每日反向追蹤指數，長期持有因<strong style={{ color: 'var(--orange)' }}>波動耗損</strong>損失極大。
              歷史上台股長期走多，反1 長期持有勝率極低，<strong style={{ color: 'var(--orange)' }}>僅適合短線空頭避險</strong>，不建議長期持有。
            </div>
          </div>
        )}
      </div>

      {/* 其他 ETF */}
      <div className="mt-12 mb-10">
        <div className="text-[13px] font-bold mb-4" style={{ color: 'var(--text2)' }}>其他 ETF</div>
        <div className="flex flex-wrap gap-2">
          {allETFs.filter(e => e.ticker !== etf.ticker).map(e => (
            <Link
              key={e.ticker}
              href={`/etf/${e.ticker}`}
              className="text-[12px] px-3.5 py-1.5 rounded-full no-underline transition-all duration-200"
              style={{ border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--muted)' }}
            >
              <span className="font-mono">{e.ticker}</span> · {e.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 名詞說明 */}
      <Glossary />

      <footer className="pt-8 mt-4" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[12px] leading-loose text-center" style={{ color: 'var(--muted)' }}>
          <strong style={{ color: 'var(--text2)' }}>免責聲明：</strong>
          本站所有內容均為歷史統計資料，僅供教育與研究參考用途，
          不構成任何投資建議、推介或勸誘買賣任何金融商品。<br />
          歷史勝率不代表未來績效，投資必有風險，實際交易前請自行評估風險承受度，或諮詢合格理財顧問。
        </p>
      </footer>
    </main>
  )
}

// 乖離率走勢 SVG 折線圖（純 server-side，無 client JS）
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

  const W = 560, H = 140
  const padL = 36, padR = 10, padT = 14, padB = 24
  const cW = W - padL - padR
  const cH = H - padT - padB

  const yMin = -20, yMax = 20
  const thr = etfType === 'lev2' ? 7 : 5

  const bToY = (b: number) =>
    padT + cH * (yMax - Math.max(yMin, Math.min(yMax, b))) / (yMax - yMin)
  const iToX = (i: number) =>
    padL + (history.length < 2 ? 0 : (cW * i) / (history.length - 1))

  const yTop = bToY(thr)
  const y0   = bToY(0)
  const yBot = bToY(-thr)

  const pts = history
    .map((p, i) => `${iToX(i).toFixed(1)},${bToY(p.bias).toFixed(1)}`)
    .join(' ')

  const lastX = iToX(history.length - 1)
  const lastBias = history[history.length - 1].bias
  const lastY = bToY(lastBias)
  const dotColor =
    lastBias <= -thr ? '#3fd68f' : lastBias >= thr ? '#ef6f81' : '#e3b04b'

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
      <rect x={padL} y={padT}  width={cW} height={yTop - padT}     fill="rgba(239,111,129,.07)" />
      <rect x={padL} y={yTop}  width={cW} height={yBot - yTop}      fill="rgba(227,176,75,.04)" />
      <rect x={padL} y={yBot}  width={cW} height={padT + cH - yBot} fill="rgba(63,214,143,.07)" />

      {/* 門檻虛線 */}
      <line x1={padL} y1={yTop} x2={padL + cW} y2={yTop} stroke="rgba(239,111,129,.35)"  strokeWidth="1" strokeDasharray="3,3" />
      <line x1={padL} y1={y0}   x2={padL + cW} y2={y0}   stroke="rgba(255,255,255,.09)" strokeWidth="1" />
      <line x1={padL} y1={yBot} x2={padL + cW} y2={yBot} stroke="rgba(63,214,143,.35)"  strokeWidth="1" strokeDasharray="3,3" />

      {/* Y 軸標籤 */}
      <text x={padL - 5} y={yTop + 3.5} textAnchor="end" fontSize="9" fill="rgba(239,111,129,.6)"  fontFamily="var(--font-ibm-mono), monospace">+{thr}%</text>
      <text x={padL - 5} y={y0 + 3.5}   textAnchor="end" fontSize="9" fill="rgba(255,255,255,.28)" fontFamily="var(--font-ibm-mono), monospace">0%</text>
      <text x={padL - 5} y={yBot + 3.5} textAnchor="end" fontSize="9" fill="rgba(63,214,143,.6)"   fontFamily="var(--font-ibm-mono), monospace">-{thr}%</text>

      {/* 折線 */}
      <polyline
        points={pts}
        fill="none"
        stroke="rgba(180,205,240,.85)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 目前位置 */}
      <circle cx={lastX} cy={lastY} r="7" fill="none" stroke={dotColor} strokeWidth="1.5" opacity="0.4" />
      <circle cx={lastX} cy={lastY} r="4" fill={dotColor} stroke="var(--surface)" strokeWidth="1.5" />

      {/* X 軸標籤 */}
      {labelIdxs.map(i =>
        i < history.length ? (
          <text key={i} x={iToX(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.3)" fontFamily="var(--font-ibm-mono), monospace">
            {history[i].month}
          </text>
        ) : null
      )}
    </svg>
  )
}
