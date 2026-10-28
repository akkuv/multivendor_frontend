/**
 * Reads scripts/check-i18n.mjs --missing-only output and writes the missing keys
 * as real JSON, split into balanced batches.
 *
 * The report prints each key inside double quotes followed by the source
 * location, which is convenient to read but awkward to parse - a key that
 * itself contains a quote breaks naive JSON.parse. Parsing the printed form
 * directly keeps the split honest instead of routing it through another
 * round of shell quoting.
 *
 * Usage: node scripts/split-missing.mjs <report-file> <batch-count> <out-prefix>
 *   report file: output of `node scripts/check-i18n.mjs --missing-only`
 *   out prefix:  writes <prefix>.json and <prefix>1.json .. <prefix>N.json
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [, , reportFile, batchCountArg = '4', prefix = '/tmp/miss'] = process.argv
const batchCount = Number(batchCountArg)

const report = readFileSync(reportFile, 'utf8')
const marker = report.indexOf('--- missing')
if (marker < 0) {
  console.error('no "--- missing" section in ' + reportFile)
  process.exit(1)
}

// Every line after the marker is `<indent>"<key>"  (<file>:<line>)`. The key is
// printed as a JSON string, so read it with a small state machine that tracks
// whether it is inside a string and honours backslash escapes. That keeps a key
// containing a quote intact.
const keys = []
for (const line of report.slice(marker).split('\n')) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('"')) continue
  let out = ''
  let inString = false
  let escaped = false
  for (const ch of trimmed) {
    if (!inString) {
      if (ch === '"') inString = true
      continue
    }
    if (escaped) {
      out += '\\' + ch
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = false
      break
    }
    out += ch
  }
  if (!out) continue
  if (!/\s\(/.test(trimmed)) continue
  try {
    keys.push(JSON.parse('"' + out + '"'))
  } catch {
    // A key the report could not print; keep the raw text so the batch is
    // never silently short.
    keys.push(out)
  }
}

const unique = [...new Set(keys)].sort((a, b) => a.localeCompare(b))
const batches = Array.from({ length: batchCount }, () => [])
const weights = new Array(batchCount).fill(0)
for (const k of unique) {
  let i = weights.indexOf(Math.min(...weights))
  batches[i].push(k)
  weights[i] += k.length + 8
}

writeFileSync(prefix + '.json', JSON.stringify(unique, null, 1))
batches.forEach((b, i) => writeFileSync(prefix + (i + 1) + '.json', JSON.stringify(b, null, 1)))
console.log(`${unique.length} key(s) -> ${batchCount} batch(es): ${batches.map((b) => b.length).join(' / ')}`)
