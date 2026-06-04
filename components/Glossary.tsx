// F2：名詞說明摺疊區塊 — <details>/<summary> 原生 HTML，不需要 client JS
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
      className="rounded-xl mb-6"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      <summary
        className="font-mono text-[11px] tracking-widest uppercase px-5 py-3.5 cursor-pointer select-none"
        style={{ color: 'var(--muted)', listStyle: 'none' }}
      >
        📖 名詞說明 <span style={{ color: 'var(--muted2)' }}>（點擊展開）</span>
      </summary>
      <div className="px-5 pb-5 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        {terms.map((t, i) => (
          <div key={i} className="mt-4">
            <div className="font-mono text-[11px] font-semibold mb-1" style={{ color: 'var(--text)' }}>
              {t.term}
            </div>
            <div className="text-[11px] leading-relaxed" style={{ color: 'var(--muted)', paddingLeft: '10px' }}>
              → {t.def}
            </div>
          </div>
        ))}
      </div>
    </details>
  )
}
