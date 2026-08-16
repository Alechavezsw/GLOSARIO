/**
 * Importa Glosario_amplio_minero_argentino.md → src/data/glossary.json
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const mdPath = path.join(root, 'Glosario_amplio_minero_argentino.md')
const outPath = path.join(root, 'src', 'data', 'glossary.json')
const metaPath = path.join(root, 'src', 'data', 'glossary-meta.json')

function slugify(input) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function mapCategory(raw) {
  const s = raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  if (s.includes('juridico')) return 'Jurídico'
  if (s.includes('geolog')) return 'Geológico'
  if (s.includes('ambiental')) return 'Ambiental'
  if (s.includes('economic')) return 'Económico'
  if (s.includes('metalurg')) return 'Metalúrgico'
  if (s.includes('exploracion')) return 'Exploración'
  if (s.includes('geotec')) return 'Geotécnico'
  if (s.includes('comercial')) return 'Comercial'
  if (s.includes('operativo') || s.includes('tecnico')) return 'Operativo'
  return raw.split(/[-/]/)[0].trim() || 'General'
}

function stripFootnotes(text) {
  return text
    .replace(/\[\^[^\]]+\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function stripMd(text) {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim()
}

const md = fs.readFileSync(mdPath, 'utf8')

// Cortar antes de secciones finales no-término
const cutAt = md.search(/\n## Diferencias esenciales/)
const body = cutAt > 0 ? md.slice(0, cutAt) : md

const entryRe =
  /###\s+(.+?)\n\n\*\*([^*]+)\.\*\*\s*([\s\S]*?)(?=\n### |\n## [A-ZÁÉÍÓÚÑ]|\n## Diferencias|$)/g

const terms = []
let m
while ((m = entryRe.exec(body)) !== null) {
  const term = m[1].trim()
  const catRaw = m[2].trim()
  let def = stripFootnotes(m[3].trim())
  // quitar párrafos vacíos extras
  def = def.replace(/\n{3,}/g, '\n\n').trim()
  const plain = stripMd(def.split(/\n\n/)[0] || def)
  const rest = stripMd(def.slice(plain.length).trim())
  terms.push({
    id: slugify(term),
    term,
    category: mapCategory(catRaw),
    plain,
    detail: rest || `Categoría de origen: ${catRaw}. Fuente: Glosario amplio minero argentino.`,
    related: [],
  })
}

// Siglas frecuentes
const siglasBlock = md.match(/## Siglas frecuentes\n\n\|[\s\S]*?\n\n## Fuentes/)
if (siglasBlock) {
  const rows = [...siglasBlock[0].matchAll(/\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|/g)]
  for (const r of rows) {
    const acronym = r[1].trim()
    const meaning = stripMd(r[2].trim())
    const id = slugify(acronym)
    if (terms.some((t) => t.id === id)) continue
    terms.push({
      id,
      term: acronym,
      category: 'Siglas',
      plain: `${acronym}: ${meaning}.`,
      detail: 'Sigla frecuente del sector minero. Fuente: Glosario amplio minero argentino.',
      related: [],
    })
  }
}

// Relacionados: si el texto menciona otro término (palabra completa), vincular
const byNorm = terms.map((t) => ({
  ...t,
  norm: t.term
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, ''),
}))

for (const t of byNorm) {
  const hay = `${t.plain} ${t.detail}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
  const related = []
  for (const other of byNorm) {
    if (other.id === t.id) continue
    if (other.norm.length < 4) continue
    // evitar matches demasiado genéricos
    if (['mina', 'oro', 'agua', 'roca', 'ley'].includes(other.norm)) continue
    const re = new RegExp(
      `(^|[^a-z0-9])${other.norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`,
      'i',
    )
    if (re.test(hay)) related.push(other.id)
  }
  t.related = related.slice(0, 8)
}

const cleaned = byNorm
  .map(({ norm: _n, ...rest }) => rest)
  .sort((a, b) => a.term.localeCompare(b.term, 'es'))

// Deduplicar por id (mantener primero)
const seen = new Set()
const unique = []
for (const t of cleaned) {
  if (seen.has(t.id)) continue
  seen.add(t.id)
  unique.push(t)
}

fs.writeFileSync(outPath, JSON.stringify(unique, null, 2) + '\n', 'utf8')

const meta = {
  title: 'Glosario amplio minero argentino',
  subtitle:
    'Enfoque jurídico, geológico, técnico, ambiental y económico — con referencias a San Juan',
  disclaimer:
    'Material de consulta en lenguaje claro. No reemplaza el texto legal, un informe profesional ni la evaluación de la autoridad competente.',
  sourceFile: 'Glosario_amplio_minero_argentino.md',
  termCount: unique.length,
  version: '1.0',
}

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf8')

console.log(`Importados ${unique.length} términos → ${path.relative(root, outPath)}`)
console.log(
  'Categorías:',
  [...new Set(unique.map((t) => t.category))].sort().join(', '),
)
