# Skill: stock-lookup

Use the `stock_resolve` and `stock_profile` tools to answer questions about US stocks.

## When to use which tool

**Use `stock_profile` directly** when the user provides an exact ticker:
- "What is AAPL's price?" → `stock_profile("AAPL")`
- "Get me NVDA quote" → `stock_profile("NVDA")`

**Use `stock_resolve` first** when the user provides a company name or ambiguous input:
- "What is Apple's price?" → `stock_resolve("Apple")` → get ticker → `stock_profile("AAPL")`
- "Look up Nvidia" → `stock_resolve("nvidia")` → `NVDA` → `stock_profile("NVDA")`
- "Find Microsoft's SEC filing" → `stock_resolve("Microsoft")` → return `sec_url`

**Use `stock_resolve` only** when the user wants symbol information, not a live quote:
- "What is Apple's ticker symbol?" → `stock_resolve("Apple")`
- "Give me the SEC EDGAR link for Tesla" → `stock_resolve("Tesla")`
- "Find companies with 'micro' in the name" → `stock_resolve("micro", limit=10)`

## Tool reference

### stock_resolve
- `query` — company name, partial name, or ticker (e.g. `"Apple"`, `"nvidia"`, `"TSLA"`)
- `limit` — max results, 1–10, default 5
- Returns: `ticker`, `company`, `cik`, `sec_url` for each match

### stock_profile
- `ticker` — exact ticker symbol (e.g. `"AAPL"`, `"BRK-B"`)
- Returns: price, change, volume, market cap, P/E, EPS, dividend yield,
  52-week range, sector, industry, country, employees, website, description
