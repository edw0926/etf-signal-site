import fs from 'fs'
import path from 'path'
import { SignalsData, ETFData } from '@/types/etf'

function sanitize(obj: unknown): unknown {
  if (typeof obj === 'number' && !isFinite(obj)) return null
  if (Array.isArray(obj)) return obj.map(sanitize)
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, sanitize(v)])
    )
  }
  return obj
}

export function getSignalsData(): SignalsData {
  const raw = fs.readFileSync(path.join(process.cwd(), 'public', 'etf_signals.json'), 'utf-8')
  // Replace bare Infinity tokens (invalid JSON from Python serialization)
  const cleaned = raw.replace(/:\s*Infinity\b/g, ': null').replace(/:\s*-Infinity\b/g, ': null')
  const parsed = JSON.parse(cleaned)
  return sanitize(parsed) as SignalsData
}

export function getAllETFs(): ETFData[] {
  const data = getSignalsData()
  return Object.values(data.etfs)
}

export function getETFByTicker(ticker: string): ETFData | null {
  const data = getSignalsData()
  return data.etfs[ticker] ?? null
}

export function getAllTickers(): string[] {
  const data = getSignalsData()
  return Object.keys(data.etfs)
}

export function formatBias(bias: number): string {
  return (bias >= 0 ? '+' : '') + bias.toFixed(2) + '%'
}

export function formatRet(val: number | null): string {
  if (val === null) return 'N/A'
  return (val >= 0 ? '+' : '') + val.toFixed(1) + '%'
}
