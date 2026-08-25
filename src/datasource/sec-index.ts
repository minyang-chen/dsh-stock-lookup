import { createReadStream } from 'node:fs'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

/** One entry from SEC company_tickers.json */
export interface SecEntry {
  cik: number
  ticker: string
  title: string
  /** Direct SEC EDGAR company page URL */
  secUrl: string
}

interface RawEntry {
  cik_str: number
  ticker: string
  title: string
}

/**
 * Lazy-loaded in-memory index of the SEC company_tickers.json file.
 * The file ships with the plugin in the `data/` directory.
 *
 * Supports two search modes:
 *   - exact ticker match (case-insensitive)
 *   - fuzzy company name match (substring, case-insensitive)
 */
export class SecIndex {
  private entries: SecEntry[] | undefined
  private loadPromise: Promise<void> | undefined

  /** Path to the bundled company_tickers.json, relative to this file at runtime. */
  private readonly dataPath: string

  constructor(dataPath?: string) {
    // At runtime (after build), this file is at lib/datasource/sec-index.js
    // and data/company_tickers.json is two levels up at the package root.
    this.dataPath = dataPath ?? resolve(import.meta.dirname ?? __dirname, '../../data/company_tickers.json')
  }

  /** Resolve the index, loading it on first call. */
  private async load(): Promise<SecEntry[]> {
    if (this.entries !== undefined) return this.entries
    if (this.loadPromise === undefined) {
      this.loadPromise = this._load()
    }
    await this.loadPromise
    return this.entries!
  }

  private async _load(): Promise<void> {
    // Stream-parse to avoid holding the raw string in memory alongside the parsed result.
    const raw = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = createReadStream(this.dataPath)
      stream.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)))
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
      stream.on('error', reject)
    })

    const parsed = JSON.parse(raw) as Record<string, RawEntry>
    this.entries = Object.values(parsed).map((e) => ({
      cik: e.cik_str,
      ticker: e.ticker,
      title: e.title,
      secUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${e.cik_str}&type=10-K&dateb=&owner=include&count=10`,
    }))
  }

  /**
   * Find entries by ticker (exact, case-insensitive) or by company name
   * (case-insensitive substring match).
   *
   * Returns up to `limit` results, with exact ticker matches first.
   */
  async search(query: string, limit = 10): Promise<SecEntry[]> {
    const entries = await this.load()
    const q = query.trim().toUpperCase()

    // Exact ticker match — return immediately, no need to scan further
    const exact = entries.filter((e) => e.ticker === q)
    if (exact.length > 0) return exact.slice(0, limit)

    // Prefix ticker match (e.g. "APP" → AAPL, APPN…)
    const tickerPrefix = entries.filter((e) => e.ticker.startsWith(q))

    // Substring company name match (case-insensitive)
    const qLower = query.trim().toLowerCase()
    const nameMatch = entries.filter((e) => e.title.toLowerCase().includes(qLower))

    // Merge: ticker prefix first, then name matches, deduped by ticker
    const seen = new Set<string>()
    const results: SecEntry[] = []
    for (const e of [...tickerPrefix, ...nameMatch]) {
      if (seen.has(e.ticker)) continue
      seen.add(e.ticker)
      results.push(e)
      if (results.length >= limit) break
    }
    return results
  }

  /** Look up a single entry by exact ticker. Returns undefined if not found. */
  async byTicker(ticker: string): Promise<SecEntry | undefined> {
    const entries = await this.load()
    const t = ticker.trim().toUpperCase()
    return entries.find((e) => e.ticker === t)
  }

  /** Total number of entries loaded. Useful for tests. */
  async size(): Promise<number> {
    const entries = await this.load()
    return entries.length
  }
}
