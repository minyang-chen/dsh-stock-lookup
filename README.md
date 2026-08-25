# dsh-stock-lookup

A [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) plugin that gives the agent two tools for stock research:

- **`stock_resolve`** — resolve a company name or partial ticker to a US stock symbol using the bundled SEC EDGAR company index (~10,000 companies). Returns ticker, CIK, official company name, and a direct SEC EDGAR filing link.
- **`stock_profile`** — fetch a live stock quote and company profile (price, change, P/E, market cap, sector, industry, description, and more) via Yahoo Finance.

No API keys required. No external services beyond Yahoo Finance.

<p align="center">
  <img src="./assets/preview.svg" alt="dsh-stock-lookup overview" width="760"/>
</p>

<p align="center">
  <img src="./assets/preview.png" alt="dsh-stock-lookup in action" width="720"/>
</p>

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

## Update to latest version

```sh
# Pull latest commit from GitHub and rebuild:
dsh plugin --profile web update dsh-stock-lookup

# Or remove and re-add:
dsh plugin --profile web remove dsh-stock-lookup
dsh plugin --profile web add github:minyang-chen/dsh-stock-lookup
```

> Restart DSH after updating.

## Tools

### `stock_resolve`

Resolve a company name or ticker to a stock symbol.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `query` | string | ✅ | Company name, partial name, or ticker. E.g. `"Apple"`, `"nvidia"`, `"TSLA"` |
| `limit` | number | | Max results to return (1–10, default 5) |

**What the agent says:**
```
Found 1 match for "Apple":
• AAPL — Apple Inc. (CIK 320193)
  SEC EDGAR: https://www.sec.gov/cgi-bin/browse-edgar?...
```

<details>
<summary>Raw tool response (JSON)</summary>

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

</details>

### `stock_profile`

Get a live quote and company profile by ticker symbol.

| Parameter | Type | Required | Description |
|---|---|---|---|
| `ticker` | string | ✅ | Stock ticker. E.g. `"AAPL"`, `"NVDA"`, `"BRK-B"` |

**What the agent says:**
```
Apple (AAPL) — $310.34 on Nasdaq, up $0.99 (+0.32%) from the previous close of $309.35,
as of the 2026-08-24 close.

  Volume:        34.4M shares
  Market cap:    ~$4.53T
  52-week range: $224.69 – $344.57
  Valuation:     trailing P/E 35.5, forward P/E 32.5, EPS (TTM) $8.75
  Sector:        Technology — Consumer Electronics
  Country:       United States
```

<details>
<summary>Raw tool response (JSON)</summary>

```json
{
  "status": "ok",
  "data": {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "exchange": "NasdaqGS",
    "currency": "USD",
    "price": 310.34,
    "change": 0.99,
    "change_percent": 0.32,
    "previous_close": 309.35,
    "market_cap": 4529157832704,
    "trailing_pe": 35.47,
    "forward_pe": 32.54,
    "eps_trailing_twelve_months": 8.75,
    "fifty_two_week_high": 344.57,
    "fifty_two_week_low": 224.69,
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "country": "United States",
    "description": "Apple Inc. designs, manufactures, and markets smartphones..."
  }
}
```

</details>

## Usage examples

Just ask the agent naturally — it selects the right tool automatically.

**Direct ticker lookup** (agent skips `stock_resolve`, calls `stock_profile` directly):
```
What is Apple's current stock price?
```

**Company name → symbol → profile** (two-tool chain):
```
What sector is Nvidia in?
```
Agent calls `stock_resolve("nvidia")` → finds `NVDA` → calls `stock_profile("NVDA")`.

**Ambiguous name:**
```
Look up Amazon stock
```

**Get the SEC EDGAR filing link:**
```
Give me the SEC EDGAR filing link for Microsoft
```
Agent calls `stock_resolve("Microsoft")` and surfaces the direct link to EDGAR filings.

**Find multiple companies by name:**
```
Find all companies with "apple" in the name
```
Returns up to 10 matches with ticker, CIK, and EDGAR link for each.

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

- **Symbol resolution**: bundled [SEC EDGAR company tickers](https://www.sec.gov/files/company_tickers.json) — ~10,000 US-listed companies. The plugin automatically refreshes this data from SEC EDGAR if it is more than 7 days old when DSH starts. If the refresh fails (no network, SEC unavailable), the bundled copy is used as fallback.
- **Live quotes & profiles**: [Yahoo Finance](https://finance.yahoo.com) via [yahoo-finance2](https://github.com/gadicc/node-yahoo-finance2)

To force a manual refresh at any time:

```sh
npm run update-sec-data
git add data/company_tickers.json
git commit -m "chore: refresh SEC EDGAR company tickers"
```

## License

MIT
