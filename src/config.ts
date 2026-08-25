import z from '@deepseek-ai/schemastery'

export interface StockLookupPluginConfig {
  enabled: boolean
  quoteTtlMs: number
}

export const Config: z<StockLookupPluginConfig> = z.object({
  enabled: z.boolean().default(true)
    .description('Register the stock lookup tools with the agent.'),
  quoteTtlMs: z.number().default(15_000)
    .description('Cache lifetime for live quotes, in milliseconds.'),
})
