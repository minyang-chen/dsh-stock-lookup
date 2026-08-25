# dsh-stock-lookup

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that gives the agent two tools for stock research:

- **`stock_resolve`** — resolve a company name or partial ticker to a US stock symbol using the bundled SEC EDGAR company index (~10,000 companies). Returns ticker, CIK, official company name, and a direct SEC EDGAR filing link.
- **`stock_profile`** — fetch a live stock quote and company profile (price, change, P/E, market cap, sector, industry, description, and more) via Yahoo Finance.

No API keys required. No external services beyond Yahoo Finance.

## Install

```sh
# From npm (after publish):
dsh plugin --profile web add dsh-stock-lookup

# From GitHub (no npm publish needed):
dsh plugin --profile web add github:minyang-chen/dsh-stock-lookup

# From a local clone:
dsh plugin --profile web add /path/to/dsh-stock-lookup
```

> After installing, restart DSH: `dsh web`

## Tools

### `stock_resolve`

Resolve a company name or ticker to a stock symbol.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Company name, partial name, or ticker. E.g. `"Apple"`, `"nvidia"`, `"TSLA"` |
| `limit` | number | | Max results to return (1–10, default 5) |

**Example response:**
```json
{
  "status": "ok",
  "data": [
    {
      "ticker": "AAPL",
      "company": "Apple Inc.",
      "cik": 320193,
      "sec_url": "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=320193&type=10-K..."
    }
  ]
}
```

### `stock_profile`

Get a live quote and company profile by ticker symbol.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ticker` | string | ✅ | Stock ticker. E.g. `"AAPL"`, `"NVDA"`, `"BRK-B"` |

**Example response:**
```json
{
  "status": "ok",
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "price": 195.89,
    "change_percent": 0.0142,
    "market_cap": 3020000000000,
    "trailing_pe": 32.1,
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "country": "United States",
    "description": "Apple Inc. designs, manufactures, and markets smartphones..."
  }
}
```

## Typical agent workflow

```
User: "What is Nvidia's current stock price?"

Agent:
  1. stock_resolve("nvidia") → finds NVDA
  2. stock_profile("NVDA")  → returns live price + profile
```

## Configuration

| Option | Default | Description |
|---|---|---|
| `enabled` | `true` | Register tools with the agent |
| `quoteTtlMs` | `15000` | Quote cache lifetime in milliseconds |

## Data sources

- **Symbol resolution**: bundled [SEC EDGAR company tickers](https://www.sec.gov/files/company_tickers.json) — updated with each plugin release
- **Live quotes & profiles**: [Yahoo Finance](https://finance.yahoo.com) via [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2)

## License

MIT
