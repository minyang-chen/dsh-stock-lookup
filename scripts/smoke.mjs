#!/usr/bin/env node
/**
 * smoke.mjs — Level 2 live smoke test for dsh-stock-lookup
 *
 * Tests the full data pipeline against real Yahoo Finance.
 * Run after `npm run build`:
 *   node scripts/smoke.mjs
 *   node scripts/smoke.mjs MSFT   (test a different ticker)
 */

import { SecIndex } from '../lib/datasource/sec-index.js'
import { YahooClient } from '../lib/datasource/yahoo-client.js'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ticker = process.argv[2]?.toUpperCase() ?? 'AAPL'
const dataPath = resolve(fileURLToPath(import.meta.url), '../../data/company_tickers.json')

const index = new SecIndex(dataPath)
const yahoo = new YahooClient({ quoteTtlMs: 15_000 })

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✅ ${label}`)
  passed++
}

function fail(label, reason) {
  console.log(`  ❌ ${label}: ${reason}`)
  failed++
}

// ── 1. SEC index load ─────────────────────────────────────────────────────────
console.log('\n=== 1. SEC index load ===')
try {
  const size = await index.size()
  if (size > 5000) ok(`loaded ${size.toLocaleString()} companies`)
  else fail('size check', `only ${size} entries`)
} catch (e) {
  fail('load', e.message)
}

// ── 2. stock_resolve — exact ticker ──────────────────────────────────────────
console.log(`\n=== 2. stock_resolve — exact ticker "${ticker}" ===`)
try {
  const results = await index.search(ticker, 1)
  if (results.length === 1 && results[0].ticker === ticker) {
    ok(`ticker=${results[0].ticker}  company="${results[0].title}"  cik=${results[0].cik}`)
    ok(`sec_url=${results[0].secUrl}`)
  } else {
    fail('exact match', `got ${results.length} results, expected 1 for ${ticker}`)
  }
} catch (e) {
  fail('search', e.message)
}

// ── 3. stock_resolve — company name ──────────────────────────────────────────
console.log('\n=== 3. stock_resolve — company name "nvidia" ===')
try {
  const results = await index.search('nvidia', 5)
  const tickers = results.map(r => r.ticker)
  if (tickers.includes('NVDA')) ok(`found NVDA in results: [${tickers.join(', ')}]`)
  else fail('name search', `NVDA not in [${tickers.join(', ')}]`)
} catch (e) {
  fail('name search', e.message)
}

// ── 4. stock_resolve — ambiguous name ────────────────────────────────────────
console.log('\n=== 4. stock_resolve — partial name "micro" (limit 3) ===')
try {
  const results = await index.search('micro', 3)
  if (results.length > 0) ok(`${results.length} results: ${results.map(r => r.ticker).join(', ')}`)
  else fail('partial name', 'no results')
} catch (e) {
  fail('partial name', e.message)
}

// ── 5. stock_profile — live quote ─────────────────────────────────────────────
console.log(`\n=== 5. stock_profile — live quote for ${ticker} ===`)
try {
  const q = await yahoo.quote(ticker)
  if (typeof q.price === 'number' && q.price > 0) {
    ok(`symbol=${q.symbol}  price=${q.price} ${q.currency ?? ''}  change=${q.change_percent !== undefined ? (q.change_percent * 100).toFixed(2) + '%' : 'n/a'}`)
  } else {
    fail('price', `got ${JSON.stringify(q.price)}`)
  }
  if (q.market_cap !== undefined) ok(`market_cap=${(q.market_cap / 1e9).toFixed(1)}B`)
  else console.log('  ⚠️  market_cap not available (extended hours or ETF)')

  if (q.sector) ok(`sector="${q.sector}"  industry="${q.industry ?? 'n/a'}"`)
  else console.log('  ⚠️  sector not available')

  if (q.description) ok(`description (first 100 chars): "${q.description.slice(0, 100)}…"`)
  else console.log('  ⚠️  description not available')

  console.log('\n  Full quote:')
  console.log(JSON.stringify(q, null, 2).split('\n').map(l => '  ' + l).join('\n'))
} catch (e) {
  fail('live quote', e.message)
}

// ── 6. stock_profile — second call hits cache ─────────────────────────────────
console.log(`\n=== 6. stock_profile — cache hit for ${ticker} ===`)
try {
  const start = Date.now()
  const q = await yahoo.quote(ticker)
  const ms = Date.now() - start
  if (ms < 5 && q.price !== undefined) ok(`cache returned in ${ms}ms`)
  else console.log(`  ⚠️  cache returned in ${ms}ms (expected <5ms)`)
} catch (e) {
  fail('cache', e.message)
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${passed} passed  ${failed} failed`)
if (failed === 0) console.log('  ✅ all smoke tests passed')
else console.log('  ❌ some tests failed — check output above')
console.log()
