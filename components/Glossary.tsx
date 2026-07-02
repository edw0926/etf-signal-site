// 名詞說明摺疊區塊 — <details>/<summary> 原生 HTML，不需要 client JS
const terms = [
  {
    term: '月線乖離率（MA20 Deviation）',
    def: '以 20 個交易日的收盤均價為基準，計算目前股價偏離的百分比。正值代表股價高於均線（偏貴），負值代表低於均線（偏便宜）。',
  },
  {
    term: '勝率',
    def: '歷史回測期間，於各月份買進後持有指定天數，最終收盤價高於買進價的次數比例。',
  },
  {
    term: '中位報酬',
    def: '將所有歷史持有報酬由小到大排列，取最中間的數值。比算術平均值更能代表「典型」結果，不受極端值影響。',
  },
  {
    term: '偏高估 / 中性 / 偏低估',
    def: '本站定義：乖離率 ≥ +5% 為偏高估；−5%～+5% 為中性；≤ −5% 為偏低估。門檻根據歷史回測勝率分布設定。',
  },
  {
    term: '回測（Backtest）',
    def: '使用歷史真實股價數據，模擬不同時間點買進的損益結果。歷史統計不代表未來績效保證。',
  },
]

export default function Glossary() {
  return (
    <details
      className="chevron rounded-xl mt-12 mb-8"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <summary
        className="text-[13px] font-medium px-6 py-4 cursor-pointer select-none flex items-center justify-between"
        style={{ color: 'var(--text2)' }}
      >
        名詞說明
        <span className="chev text-[11px]" style={{ color: 'var(--muted)' }}>▾</span>
      </summary>
      <div className="px-6 pb-6 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        {terms.map((t, i) => (
          <div key={i} className="mt-5">
            <div className="text-[13px] font-medium mb-1.5" style={{ color: 'var(--text2)' }}>
              {t.term}
            </div>
            <div className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              {t.def}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
