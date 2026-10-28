/**
 * Merges translated key/value batches into the Hindi dictionary.
 *
 * Guards, so a bad batch can never quietly corrupt the dictionary:
 *   - every input key must be present in the translation file
 *   - the translation must be a non-empty string
 *   - {{placeholders}} must match between the English key and the Hindi value,
 *     so an interpolation can never go missing at runtime
 *
 * Usage: node scripts/merge-translations.mjs <keys.json> <translations.json> [locale]
 *   keys.json:         array of keys that need translating
 *   translations.json: object mapping those keys to their translations
 *   locale:            defaults to hi
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [, , keysFile, outFile, localeArg = 'hi'] = process.argv
if (!keysFile || !outFile) {
  console.error('usage: node scripts/merge-translations.mjs <keys.json> <translations.json> [locale]')
  process.exit(1)
}

const localePath = join('src/i18n/locales', `${localeArg}.json`)
const locale = JSON.parse(readFileSync(localePath, 'utf8'))
const keys = JSON.parse(readFileSync(keysFile, 'utf8'))
const out = JSON.parse(readFileSync(outFile, 'utf8'))

/** Placeholder names, deduplicated and sorted so order does not matter. */
const placeholders = (s) =>
  [...new Set([...String(s).matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))].sort()

const problems = []
for (const key of keys) {
  if (!(key in out)) problems.push(`missing translation: ${key}`)
}
for (const [key, value] of Object.entries(out)) {
  if (typeof value !== 'string' || !value.trim()) problems.push(`empty translation: ${key}`)
  if (!keys.includes(key)) problems.push(`unexpected key (not requested): ${key}`)
  if (placeholders(key).join() !== placeholders(value).join()) {
    problems.push(`placeholder mismatch: ${key}`)
  }
}

if (problems.length) {
  for (const p of problems) console.log('  ' + p)
  console.log(`${problems.length} problem(s) - nothing written`)
  process.exit(1)
}

let added = 0
for (const key of keys) {
  if (!locale[key]) added++
  locale[key] = out[key]
}

const sorted = Object.fromEntries(
  Object.entries(locale).sort(([a], [b]) => a.localeCompare(b)),
)
writeFileSync(localePath, JSON.stringify(sorted, null, 2) + '\n')

console.log(`merged ${keys.length} key(s) into ${localeArg}.json (${added} new) -> ${Object.keys(sorted).length} total`)
console.log('placeholder parity OK')
