/**
 * Reports translation coverage: every literal key passed to t() across src/
 * is compared against src/i18n/locales/hi.json.
 *
 * A key with no Hindi entry silently renders English, so this is the signal
 * for what still needs translating.
 *
 * Usage: node scripts/check-i18n.mjs [--missing-only]
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const LOCALES = 'src/i18n/locales/hi.json'
const SRC = 'src'
const missingOnly = process.argv.includes('--missing-only')

const hi = JSON.parse(readFileSync(LOCALES, 'utf8'))

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) {
      if (entry === 'i18n') continue
      yield* walk(p)
    } else if (/\.tsx?$/.test(entry)) {
      yield p
    }
  }
}

// Matches t('Key') and t("Key") with a literal string first argument.
const CALL = /\bt\(\s*(['"])((?:\\.|(?!\1)[^\\])*)\1/g

const used = new Map()
for (const file of walk(SRC)) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(CALL)) {
    const key = m[2].replace(/\\(['"])/g, '$1')
    if (!key.trim()) continue
    if (!used.has(key)) used.set(key, new Set())
    used.get(key).add(file)
  }
}

const missing = [...used.entries()].filter(([k]) => !(k in hi)).sort(([a], [b]) => a.localeCompare(b))
const translated = used.size - missing.length
const pct = ((translated / used.size) * 100).toFixed(1)

console.log(`t() keys used: ${used.size}`)
console.log(`translated:    ${translated}`)
console.log(`missing:       ${missing.length}`)
console.log(`coverage:      ${pct}%`)

if (missing.length) {
  console.log(`\n--- missing ${missing.length} ---`)
  for (const [key, files] of missing) {
    // JSON.stringify escapes a key that itself contains a quote, so the report
    // stays parseable by scripts/split-missing.mjs.
    console.log(`  ${JSON.stringify(key)}  (${[...files].join(', ')})`)
  }
}

// Flag entries that are untranslated placeholders.
const stubs = Object.entries(hi).filter(([, v]) => /^(TODO|TBD|XXX)$/i.test(String(v).trim()))
if (stubs.length) {
  console.log(`\n--- ${stubs.length} TODO stub values in hi.json ---`)
  for (const [k] of stubs.slice(0, 30)) console.log(`  "${k}"`)
}

if (!missing.length && !stubs.length) {
  console.log('\nAll t() keys are translated.')
}

if (!missingOnly && existsSync(LOCALES)) {
  const extra = Object.keys(hi).filter((k) => !used.has(k))
  if (extra.length) {
    console.log(`\n(hi.json has ${extra.length} unused keys - fine, reserved vocabulary)`)
  }
}