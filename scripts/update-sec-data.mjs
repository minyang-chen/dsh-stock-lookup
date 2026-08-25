#!/usr/bin/env node
/**
 * update-sec-data.mjs — refresh the bundled SEC EDGAR company tickers
 *
 * Downloads the latest company_tickers.json from SEC EDGAR and replaces
 * the bundled copy. Run before a new release to pick up newly listed companies.
 *
 * Usage:
 *   node scripts/update-sec-data.mjs
 */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const SEC_URL = 'https://www.sec.gov/files/company_tickers.json'
const OUT_PATH = resolve(fileURLToPath(import.meta.url), '../../data/company_tickers.json')

console.log(`Fetching ${SEC_URL} ...`)

const res = await fetch(SEC_URL, {
  headers: {
    // SEC EDGAR requires User-Agent with app name + contact email
    // See: https://www.sec.gov/os/accessing-edgar-data
    'User-Agent': 'dsh-stock-lookup/0.1.0 contact@example.com',
    'Accept': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  },
})

if (!res.ok) {
  console.error(`❌ HTTP ${res.status} ${res.statusText}`)
  process.exit(1)
}

const data = await res.json()
const entries = Object.values(data)
const json = JSON.stringify(data)

writeFileSync(OUT_PATH, json, 'utf8')

console.log(`✅ Updated data/company_tickers.json — ${entries.length.toLocaleString()} companies, ${(json.length / 1024).toFixed(0)} KB`)
console.log(`   Run 'npm test' to verify, then commit:`)
console.log(`   git add data/company_tickers.json && git commit -m "chore: refresh SEC EDGAR company tickers"`)
