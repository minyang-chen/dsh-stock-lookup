import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { YahooClient } from '../datasource/yahoo-client.ts'
import { guard, success } from '../util/errors.ts'
import { stringify } from '../util/stringify.ts'
import { jsonOutput, TOOL_TIMEOUT_MS } from './shared.ts'

export function createStockProfileTool(yahoo: YahooClient): ToolDefinition {
  return defineTool({
    name: 'stock_profile',
    description:
      'Get a live stock quote and company profile for a US-listed stock by ticker symbol. '
      + 'Returns current price, day change, 52-week range, market cap, P/E ratio, EPS, dividend yield, '
      + 'volume, sector, industry, country, employee count, website, and a brief business description. '
      + 'Use stock_resolve first if you only have a company name and need to find the ticker. '
      + 'Accepts standard US exchange tickers such as AAPL, MSFT, BRK-B, NVDA.',
    parameters: {
      ticker: {
        type: 'string' as const,
        required: true as const,
        description: 'Stock ticker symbol, e.g. "AAPL", "NVDA", "MSFT", "BRK-B".',
      },
    },
    output: jsonOutput(),
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: async (args, exec) => {
      const ticker = String(args.ticker ?? '').trim().toUpperCase()
      return stringify(
        await guard(async () => {
          if (ticker.length === 0) return { status: 'error' as const, error: 'ticker must not be empty' }
          const q = await yahoo.quote(ticker, exec.signal)
          return success(q)
        }),
      )
    },
  })
}
