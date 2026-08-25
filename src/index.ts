import type {} from '@deepseek-ai/dsh-tools'
import type { Context } from '@deepseek-ai/cordis'
import { Config, type StockLookupPluginConfig } from './config.ts'
import { SecIndex } from './datasource/sec-index.ts'
import { YahooClient } from './datasource/yahoo-client.ts'
import { createResolveSymbolTool } from './tools/resolve-symbol.ts'
import { createStockProfileTool } from './tools/stock-profile.ts'

export const name = 'dsh-stock-lookup'
export const inject = ['tools']

export { Config }
export type { StockLookupPluginConfig }

export function apply(ctx: Context, config: StockLookupPluginConfig): void {
  if (!config.enabled) return

  const secIndex = new SecIndex()
  const yahoo = new YahooClient({ quoteTtlMs: config.quoteTtlMs })

  ctx.tools.register(createResolveSymbolTool(secIndex))
  ctx.tools.register(createStockProfileTool(yahoo))
}
