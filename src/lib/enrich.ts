import examplesSj from '../data/examples-sj.json'
import articlesAyr from '../data/articles-ayr.json'
import sourcesCatalog from '../data/sources.json'
import type { GlossaryTerm, SourceLink } from './types'

const EXAMPLES = examplesSj as Record<string, string>
const ARTICLES = articlesAyr as Record<string, SourceLink[]>
const SOURCES = sourcesCatalog as Record<string, { label: string; url: string }>

/** Heurística de fuentes por id/categoría de término */
const SOURCE_BY_HINT: Array<{ test: RegExp; keys: string[] }> = [
  { test: /codigo|cateo|concesion|canon|pertenencia|amparo|descubr|mensura|av[ií]o|caducidad|mina\b|cantera|criadero|demasia|titular|propiedad/, keys: ['codigo'] },
  { test: /dominio|autoridad|constitucional/, keys: ['cn', 'codigo'] },
  { test: /iia|dia|ambiental|impacto|cierre|drenaje|relave|colas|cianur|lixiv|botadero|certificado/, keys: ['ley24585', 'sjambiental', 'lga'] },
  { test: /regalia|inversion|estabilidad|canon/, keys: ['inversiones', 'normasSj'] },
  { test: /ipeem|procedimiento|expediente|catastro|policia/, keys: ['sjprocedimiento', 'normasSj'] },
  { test: /recurso|reserva|factibilidad|prefactibilidad|crirsco|factor/, keys: ['crirsco'] },
  { test: /yacimiento|porfido|geolog|segemar|afloramiento|buzamiento/, keys: ['segemar'] },
]

export function exampleFor(id: string): string | null {
  return EXAMPLES[id] ?? null
}

export function articlesFor(id: string): SourceLink[] {
  return ARTICLES[id] ?? []
}

export function sourcesFor(term: GlossaryTerm): SourceLink[] {
  const blob = `${term.id} ${term.term} ${term.category}`.toLowerCase()
  const keys = new Set<string>(['normasSj'])
  for (const rule of SOURCE_BY_HINT) {
    if (rule.test.test(blob)) rule.keys.forEach((k) => keys.add(k))
  }
  if (/san juan|sanjuan|veladero|gualcamayo|calingasta|iglesia/i.test(term.plain + term.detail)) {
    keys.add('mapaminero')
    keys.add('visualizador')
  }
  return [...keys]
    .map((k) => SOURCES[k])
    .filter(Boolean)
    .map((s) => ({ label: s.label, url: s.url }))
}

export { SOURCES }
