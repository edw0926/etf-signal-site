export interface WinrateEntry {
  count: number
  win_count: number
  win_rate: number
  median_ret: number | null
  mean_ret: number | null
  max_ret: number | null
  min_ret: number | null
}

export interface SeasonalEntry {
  win_rate: number
  median_ret: number | null
  mean_ret: number | null
  sample: number
}

export interface ETFCurrent {
  signal: 'green' | 'yellow' | 'red'
  label: string
  bias: number
  latest_price: number
  ma20: number
}

export interface ConditionalZone {
  count: number
  win_rate: number | null
  median_ret: number | null
}

export interface BiasPoint {
  month: string
  bias: number
}

export interface ETFData {
  ticker: string
  name: string
  type: 'base' | 'lev2' | 'inv1'
  index: string
  data_range: string
  sample_months: number
  current: ETFCurrent
  winrates: Record<string, WinrateEntry>
  seasonal: Record<string, SeasonalEntry>
  conditional_winrates?: {
    green: ConditionalZone
    yellow: ConditionalZone
    red: ConditionalZone
  }
  bias_history?: BiasPoint[]
}

export interface SignalsData {
  updated_at: string
  etfs: Record<string, ETFData>
}
