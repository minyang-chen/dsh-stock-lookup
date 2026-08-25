# Plugin Market Submission — dsh-stock-lookup

**Date:** 2026-08-25
**Repo:** https://github.com/minyang-chen/dsh-stock-lookup
**Status:** Ready to submit after 10+ commits and `dsh-plugin` topic added

---

## Pre-submission checklist

- [ ] Repo is at least 1 day old
- [ ] 10 or more commits
- [ ] `dsh-plugin` topic added to GitHub repo settings
- [ ] `dsh.bundle` manifest declared in `package.json` ✅ (already done)
- [ ] `cordis.patch.yml` present at repo root ✅ (already done)
- [ ] Description is accurate and matches actual code ✅
- [ ] README describes what the plugin does ✅

---

## Submission YAML

Create this file in the `awesome-dsh-plugin` repo:

**Filename:** `data/plugins/minyang-chen__dsh-stock-lookup.yml`

```yaml
url: https://github.com/minyang-chen/dsh-stock-lookup
name: minyang-chen/dsh-stock-lookup
category: tools
description:
  en: Resolve a company name to a US stock symbol via SEC EDGAR and fetch live price and profile via Yahoo Finance.
```

---

## Submission steps

```sh
# 1. Fork awesome-dsh-plugin if not already forked
#    https://github.com/deepseek-ai/awesome-dsh-plugin

# 2. Clone your fork
git clone https://github.com/minyang-chen/awesome-dsh-plugin.git
cd awesome-dsh-plugin

# 3. Create a branch
git checkout -b add-dsh-stock-lookup

# 4. Add the plugin YAML file
cat > data/plugins/minyang-chen__dsh-stock-lookup.yml << 'EOF'
url: https://github.com/minyang-chen/dsh-stock-lookup
name: minyang-chen/dsh-stock-lookup
category: tools
description:
  en: Resolve a company name to a US stock symbol via SEC EDGAR and fetch live price and profile via Yahoo Finance.
EOF

# 5. Regenerate both READMEs (required by the market CI gate)
npm ci
node scripts/generate-readme.mjs

# 6. Commit all three files together
git add data/plugins/minyang-chen__dsh-stock-lookup.yml README.md README.zh.md
git commit -m "add: minyang-chen/dsh-stock-lookup"

# 7. Push and open a PR against the upstream repo
git push origin add-dsh-stock-lookup
```

Then open a PR at: https://github.com/deepseek-ai/awesome-dsh-plugin/compare

---

## Category reference

Valid categories: `ui` `usage` `theme` `model` `identity` `session` `memory`
`tools` `browser` `vision` `voice` `docs` `skill` `workflow` `git` `notify`
`dev` `security` `remote` `market` `fun`

`tools` is correct for this plugin — it registers agent tools, not UI or theme changes.

---

## CI gate checks (automatic)

The PR CI verifies:
- `dsh.bundle` manifest present in `package.json`
- Repo is ≥ 1 day old
- Repo has ≥ 10 commits
- YAML format is valid
- READMEs regenerate cleanly
- Description does not overstate (CI cannot verify this — a maintainer reads the repo)

---

## Notes

- Description must be accurate. "Resolve a company name to a US stock symbol via SEC EDGAR and
  fetch live price and profile via Yahoo Finance" matches exactly what the two tools do.
- `required: true` on optional params causes TS errors in `defineTool` — omit `required` for optional params.
- The bundled `data/company_tickers.json` (SEC EDGAR) should be refreshed periodically on new releases.
  Download latest from: https://www.sec.gov/files/company_tickers.json
