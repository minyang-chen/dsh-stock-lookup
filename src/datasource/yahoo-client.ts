import YahooFinance from 'yahoo-finance2'

// yahoo-finance2 v4: must instantiate rather than use the default singleton
const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })

export interface QuoteResult {
  symbol: string
  name: string | undefined
  exchange: string | undefined
  currency: string | undefined
  market_state: string | undefined
  price: number | undefined
  change: number | undefined
  change_percent: number | undefined
  previous_close: number | undefined
  open: number | undefined
  day_high: number | undefined
  day_low: number | undefined
  volume: number | undefined
  market_cap: number | undefined
  fifty_two_week_high: number | undefined
  fifty_two_week_low: number | undefined
  trailing_pe: number | undefined
  forward_pe: number | undefined
  eps_trailing_twelve_months: number | undefined
  dividend_yield: number | undefined
  quote_time: string | undefined
  sector: string | undefined
  industry: string | undefined
  website: string | undefined
  description: string | undefined
  employees: number | undefined
  country: string | undefined
}

export interface YahooClientOptions {
  quoteTtlMs: number
}

interface CacheEntry {
  expiresAt: number
  data: QuoteResult
}

export class YahooClient {
  private readonly ttlMs: number
  private readonly cache = new Map<string, CacheEntry>()

  constructor(options: YahooClientOptions) {
    this.ttlMs = options.quoteTtlMs
  }

  async quote(ticker: string, signal?: AbortSignal): Promise<QuoteResult> {
    const key = ticker.toUpperCase()
    const cached = this.cache.get(key)
    if (cached !== undefined && Date.now() < cached.expiresAt) {
      return cached.data
    }

    // Fetch quote and quoteSummary in parallel for richer data
    const [q, summary] = await Promise.allSettled([
      yf.quote(key, {}, { fetchOptions: { signal } }),
      yf.quoteSummary(key, { modules: ['assetProfile', 'summaryProfile'] }, { fetchOptions: { signal } }),
    ])

    if (q.status === 'rejected') {
      throw new Error(`Yahoo Finance quote failed for ${key}: ${q.reason instanceof Error ? q.reason.message : String(q.reason)}`)
    }

    const raw = q.value as Record<string, unknown>
    const profile = summary.status === 'fulfilled'
      ? ((summary.value as Record<string, unknown>)?.assetProfile ?? (summary.value as Record<string, unknown>)?.summaryProfile) as Record<string, unknown> | undefined
      : undefined

    const result: QuoteResult = {
      symbol: String(raw.symbol ?? key),
      name: strVal(raw.longName) ?? strVal(raw.shortName),
      exchange: strVal(raw.fullExchangeName) ?? strVal(raw.exchange),
      currency: strVal(raw.currency),
      market_state: strVal(raw.marketState),
      price: numVal(raw.regularMarketPrice),
      change: roundVal(raw.regularMarketChange, 4),
      change_percent: roundVal(raw.regularMarketChangePercent, 4),
      previous_close: numVal(raw.regularMarketPreviousClose),
      open: numVal(raw.regularMarketOpen),
      day_high: numVal(raw.regularMarketDayHigh),
      day_low: numVal(raw.regularMarketDayLow),
      volume: numVal(raw.regularMarketVolume),
      market_cap: numVal(raw.marketCap),
      fifty_two_week_high: numVal(raw.fiftyTwoWeekHigh),
      fifty_two_week_low: numVal(raw.fiftyTwoWeekLow),
      trailing_pe: roundVal(raw.trailingPE, 4),
      forward_pe: roundVal(raw.forwardPE, 4),
      eps_trailing_twelve_months: numVal(raw.epsTrailingTwelveMonths),
      dividend_yield: roundVal(raw.dividendYield, 4),
      quote_time: isoVal(raw.regularMarketTime),
      sector: strVal(profile?.sector),
      industry: strVal(profile?.industry),
      website: strVal(profile?.website),
      description: strVal(profile?.longBusinessSummary)?.slice(0, 500),
      employees: numVal(profile?.fullTimeEmployees),
      country: strVal(profile?.country),
    }

    this.cache.set(key, { expiresAt: Date.now() + this.ttlMs, data: result })
    return result
  }
}

function strVal(v: unknown): string | undefined {
  return typeof v === 'string' && v.length > 0 ? v : undefined
}

function numVal(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function roundVal(v: unknown, digits: number): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v)) return undefined
  const f = 10 ** digits
  return Math.round(v * f) / f
}

function isoVal(v: unknown): string | undefined {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v.toISOString()
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = new Date(v < 1e11 ? v * 1000 : v)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  if (typeof v === 'string' && v.length > 0) {
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  return undefined
}
