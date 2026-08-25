import { defineTool, type ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { SecIndex } from '../datasource/sec-index.ts'
import { guard, success } from '../util/errors.ts'
import { stringify } from '../util/stringify.ts'
import { jsonOutput, TOOL_TIMEOUT_MS } from './shared.ts'

export function createResolveSymbolTool(index: SecIndex): ToolDefinition {
  return defineTool({
    name: 'stock_resolve',
    description:
      'Resolve a company name or partial ticker to one or more US stock symbols using the SEC EDGAR company index. '
      + 'Returns the ticker symbol, CIK number, official company name, and a direct SEC EDGAR filing page link '
      + 'for each match. '
      + 'Use this tool first when the user provides a company name (e.g. "Apple", "Nvidia") or an ambiguous '
      + 'abbreviation, before calling stock_profile. '
      + 'For an exact ticker like "AAPL" or "MSFT", stock_profile can be called directly. '
      + 'Returns up to 10 matches sorted by relevance: exact ticker match first, then ticker prefix, '
      + 'then company name substring matches.',
    parameters: {
      query: {
        type: 'string' as const,
        required: true as const,
        description:
          'Company name, partial name, or ticker symbol to search for. '
          + 'Examples: "Apple", "nvidia", "TSLA", "amazon web services".',
      },
      limit: {
        type: 'number' as const,
        description: 'Maximum number of results to return. Defaults to 5, maximum 10.',
      },
    },
    output: jsonOutput(),
    timeoutMs: TOOL_TIMEOUT_MS,
    execute: async (args) => {
      const query = String(args.query ?? '').trim()
      const limit = Math.min(Math.max(1, Number(args.limit ?? 5)), 10)
      return stringify(
        await guard(async () => {
          if (query.length === 0) return { status: 'error' as const, error: 'query must not be empty' }
          const matches = await index.search(query, limit)
          return success(matches.map((e) => ({
            ticker: e.ticker,
            company: e.title,
            cik: e.cik,
            sec_url: e.secUrl,
          })))
        }),
      )
    },
  })
}
