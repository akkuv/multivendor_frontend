/**
 * Merges the per-group Hindi fragments produced during localization into
 * frontend/src/i18n/locales/hi.json.
 *
 * Groups write to /tmp/i18n_<GROUP>.json. The glossary at
 * /tmp/i18n_glossary.json wins over group output so approved terminology is
 * never overwritten by an inconsistent per-page variant.
 *
 * Usage: node scripts/merge-i18n.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { globSync } from 'node:fs'

const LOCALES = 'src/i18n/locales/hi.json'
const GLOSSARY = '/tmp/i18n_glossary.json'

const readJson = (path, fallback = {}) => {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    console.error(`  ! failed to parse ${path}: ${err.message}`)
    return fallback
  }
}

const glossary = readJson(GLOSSARY)
const approved = new Map()
for (const [group, entries] of Object.entries(glossary)) {
  if (group.startsWith('_')) continue
  for (const [key, value] of Object.entries(entries)) approved.set(key, value)
}
console.log(`glossary: ${approved.size} approved entries`)

const merged = readJson(LOCALES)
const before = Object.keys(merged).length

const groups = globSync('/tmp/i18n_*.json').filter((p) => !p.endsWith('i18n_glossary.json'))
const conflicts = []

for (const path of groups) {
  const entries = readJson(path)
  let added = 0
  let overridden = 0
  let glossaryAligned = 0

  for (const [key, value] of Object.entries(entries)) {
    if (typeof value !== 'string' || !value.trim()) continue

    if (approved.has(key)) {
      if (approved.get(key) !== value) {
        conflicts.push({ key, from: value, approved: approved.get(key), group: path })
      } else {
        glossaryAligned++
      }
      merged[key] = approved.get(key)
      continue
    }

    if (merged[key] && merged[key] !== value) {
      // First writer wins so already-reviewed translations stay stable.
      continue
    }
    if (!merged[key]) added++
    merged[key] = value
    overridden++
  }

  console.log(
    `${path.replace('/tmp/i18n_', '').replace('.json', '').padEnd(14)} keys=${String(Object.keys(entries).length).padStart(4)} new=${String(added).padStart(4)} glossary-matched=${String(glossaryAligned).padStart(3)}`,
  )
}

if (conflicts.length) {
  console.log(`\nglossary conflicts (approved term kept): ${conflicts.length}`)
  for (const c of conflicts.slice(0, 20)) {
    console.log(`  "${c.key}": group said "${c.from}" -> kept "${c.approved}"`)
  }
}

const sorted = Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(LOCALES, `${JSON.stringify(sorted, null, 2)}\n`, 'utf8')

console.log(`\nhi.json: ${before} -> ${Object.keys(sorted).length} keys`)