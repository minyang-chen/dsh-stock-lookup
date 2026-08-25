import { describe, it, expect, beforeAll } from 'vitest'
import { SecIndex } from '../src/datasource/sec-index.ts'
import { resolve } from 'node:path'

const DATA_PATH = resolve(process.cwd(), 'data/company_tickers.json')

describe('SecIndex', () => {
  let index: SecIndex

  beforeAll(() => {
    index = new SecIndex(DATA_PATH)
  })

  it('loads the full index', async () => {
    const size = await index.size()
    expect(size).toBeGreaterThan(5000)
  })

  it('finds AAPL by exact ticker', async () => {
    const results = await index.search('AAPL')
    expect(results).toHaveLength(1)
    expect(results[0]!.ticker).toBe('AAPL')
    expect(results[0]!.title).toMatch(/apple/i)
    expect(results[0]!.cik).toBeGreaterThan(0)
    expect(results[0]!.secUrl).toContain('sec.gov')
  })

  it('finds NVDA by exact ticker (case-insensitive)', async () => {
    const results = await index.search('nvda')
    expect(results[0]!.ticker).toBe('NVDA')
  })

  it('finds Apple by company name substring', async () => {
    const results = await index.search('apple', 5)
    expect(results.length).toBeGreaterThanOrEqual(1)
    const tickers = results.map((r) => r.ticker)
    expect(tickers).toContain('AAPL')
  })

  it('finds Microsoft by name', async () => {
    const results = await index.search('microsoft')
    const tickers = results.map((r) => r.ticker)
    expect(tickers).toContain('MSFT')
  })

  it('returns empty array for unknown query', async () => {
    const results = await index.search('ZZZZNOTAREALCOMPANY9999')
    expect(results).toHaveLength(0)
  })

  it('respects the limit parameter', async () => {
    const results = await index.search('tech', 3)
    expect(results.length).toBeLessThanOrEqual(3)
  })

  it('byTicker returns the correct entry', async () => {
    const entry = await index.byTicker('MSFT')
    expect(entry).toBeDefined()
    expect(entry!.ticker).toBe('MSFT')
    expect(entry!.title).toMatch(/microsoft/i)
  })

  it('byTicker returns undefined for unknown ticker', async () => {
    const entry = await index.byTicker('ZZZNOPE')
    expect(entry).toBeUndefined()
  })
})
