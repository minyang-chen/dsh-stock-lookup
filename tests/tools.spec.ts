import { describe, it, expect, vi } from 'vitest'
import { SecIndex } from '../src/datasource/sec-index.ts'
import { YahooClient } from '../src/datasource/yahoo-client.ts'
import { createResolveSymbolTool } from '../src/tools/resolve-symbol.ts'
import { createStockProfileTool } from '../src/tools/stock-profile.ts'
import { resolve } from 'node:path'

const DATA_PATH = resolve(process.cwd(), 'data/company_tickers.json')

// ── stock_resolve tool ────────────────────────────────────────────────────────

describe('stock_resolve tool', () => {
  const index = new SecIndex(DATA_PATH)
  const tool = createResolveSymbolTool(index)

  it('has the correct name', () => {
    expect(tool.name).toBe('stock_resolve')
  })

  it('returns results for "Apple"', async () => {
    const raw = await tool.execute({ query: 'Apple' }, {} as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('ok')
    expect(result.data.length).toBeGreaterThanOrEqual(1)
    const tickers = result.data.map((d: { ticker: string }) => d.ticker)
    expect(tickers).toContain('AAPL')
  })

  it('returns results for exact ticker NVDA', async () => {
    const raw = await tool.execute({ query: 'NVDA' }, {} as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('ok')
    expect(result.data[0].ticker).toBe('NVDA')
    expect(result.data[0].cik).toBeGreaterThan(0)
    expect(result.data[0].sec_url).toContain('sec.gov')
  })

  it('returns error for empty query', async () => {
    const raw = await tool.execute({ query: '' }, {} as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('error')
  })

  it('respects the limit parameter', async () => {
    const raw = await tool.execute({ query: 'tech', limit: 2 }, {} as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('ok')
    expect(result.data.length).toBeLessThanOrEqual(2)
  })

  it('caps limit at 10', async () => {
    const raw = await tool.execute({ query: 'inc', limit: 99 }, {} as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('ok')
    expect(result.data.length).toBeLessThanOrEqual(10)
  })
})

// ── stock_profile tool (mocked Yahoo) ────────────────────────────────────────

describe('stock_profile tool', () => {
  const mockQuote = vi.fn()
  const fakeYahoo = { quote: mockQuote } as unknown as YahooClient
  const tool = createStockProfileTool(fakeYahoo)

  it('has the correct name', () => {
    expect(tool.name).toBe('stock_profile')
  })

  it('returns a success envelope for a valid ticker', async () => {
    mockQuote.mockResolvedValueOnce({
      symbol: 'AAPL',
      name: 'Apple Inc.',
      price: 195.5,
      market_cap: 3_000_000_000_000,
      sector: 'Technology',
    })

    const raw = await tool.execute({ ticker: 'AAPL' }, { signal: undefined } as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('ok')
    expect(result.data.symbol).toBe('AAPL')
    expect(result.data.price).toBe(195.5)
    expect(result.data.sector).toBe('Technology')
  })

  it('returns error envelope when Yahoo throws', async () => {
    mockQuote.mockRejectedValueOnce(new Error('network error'))
    const raw = await tool.execute({ ticker: 'AAPL' }, { signal: undefined } as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('error')
    expect(result.error).toContain('network error')
  })

  it('returns error for empty ticker', async () => {
    const raw = await tool.execute({ ticker: '' }, { signal: undefined } as never)
    const result = JSON.parse(raw as string)
    expect(result.status).toBe('error')
  })

  it('normalizes ticker to uppercase before calling yahoo', async () => {
    mockQuote.mockResolvedValueOnce({ symbol: 'MSFT', price: 420 })
    await tool.execute({ ticker: 'msft' }, { signal: undefined } as never)
    expect(mockQuote).toHaveBeenCalledWith('MSFT', undefined)
  })
})
