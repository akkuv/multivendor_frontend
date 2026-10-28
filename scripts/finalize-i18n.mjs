/**
 * Folds translated batches (*.out.json) into src/i18n/locales/hi.json and
 * verifies placeholder parity, so a value never renders a literal {{token}}.
 *
 * Usage: node scripts/finalize-i18n.mjs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'

const LOCALES = 'src/i18n/locales/hi.json'

const readJson = (p, fb = {}) => {
  if (!existsSync(p)) return fb
  try {
    return JSON.parse(readFileSync(p, 'utf8'))
  } catch (err) {
    console.error(`  ! ${p}: ${err.message}`)
    return fb
  }
}

const hi = readJson(LOCALES)

/** Placeholders present in a string. */
const placeholders = (s) => {
  if (typeof s !== 'string') return []
  const out = new Set()
  for (const m of s.matchAll(/\{\{(\w+)\}\}/g)) out.add(m[1])
  return [...out].sort()
}

const batches = readdirSync('/tmp')
  .filter((f) => /^trans_batch_\d+\.out\.json$/.test(f))
  .sort()

if (!batches.length) {
  console.log('no *.out.json batches found')
  process.exit(0)
}

let added = 0
const problems = []
const stubbed = []

for (const f of batches) {
  const entries = readJson(`/tmp/${f}`)
  const keys = Object.keys(entries)
  let n = 0
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'string' || !value.trim()) {
      problems.push(`${f}: empty value for "${key}"`)
      continue
    }
    if (/^(TODO|TBD|XXX)$/i.test(value.trim())) {
      stubbed.push(key)
      continue
    }
    const kp = placeholders(key)
    const vp = placeholders(value)
    if (kp.join(',') !== vp.join(',')) {
      problems.push(
        `${f}: "${key}" placeholders key=[${kp}] value=[${vp}] -> value would render raw tokens`,
      )
    }
    if (!hi[key]) n++
    hi[key] = value
  }
  added += n
  console.log(`${f.padEnd(28)} keys=${String(keys.length).padStart(4)} new=${String(n).padStart(4)}`)
}

if (stubbed.length) {
  console.log(`\nskipped ${stubbed.length} TODO stub values:`)
  for (const k of stubbed.slice(0, 20)) console.log(`  "${k}"`)
}

const sorted = Object.fromEntries(Object.entries(hi).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(LOCALES, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')

console.log(`\nhi.json: ${Object.keys(sorted).length} keys (+${added} new)`)

if (problems.length) {
  console.log(`\n!! ${problems.length} problem(s):`)
  for (const p of problems) console.log('  ' + p)
  process.exitCode = 1
} else {
  console.log('placeholder parity OK for every merged value')
}