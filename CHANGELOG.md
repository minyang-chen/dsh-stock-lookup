# Changelog

## 0.1.0 — 2026-08-25

- Initial release
- `stock_resolve` tool: resolve company name or ticker via bundled SEC EDGAR index (~10,000 companies)
- `stock_profile` tool: live quote + company profile via Yahoo Finance (price, P/E, market cap, sector, industry, description)
- `scripts/smoke.mjs`: live end-to-end smoke test (`npm run smoke`)
- `scripts/update-sec-data.mjs`: refresh bundled SEC data from source (`npm run update-sec-data`)
