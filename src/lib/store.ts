import seedGlossary from '../data/glossary.json'
import glossaryMeta from '../data/glossary-meta.json'
import seedLaws from '../data/laws.json'
import { rankGlossary, rankLaws, type Ranked } from './search'
import type { GlossaryTerm, LawNorm, LawsCatalog } from './types'

/** v3 = glosario ampliado (+76 términos); invalidar ediciones locales del seed anterior */
const GLOSSARY_KEY = 'glosario-mineria:terms:v3'
const LAWS_KEY = 'glosario-mineria:laws:v2'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export const GLOSSARY_META = glossaryMeta as {
  title: string
  subtitle: string
  disclaimer: string
  sourceFile: string
  termCount: number
  version: string
}

export function loadGlossary(): GlossaryTerm[] {
  const stored = readJson<GlossaryTerm[]>(GLOSSARY_KEY)
  if (stored?.length) return stored
  return seedGlossary as GlossaryTerm[]
}

export function saveGlossary(terms: GlossaryTerm[]) {
  localStorage.setItem(GLOSSARY_KEY, JSON.stringify(terms))
}

export function resetGlossary() {
  localStorage.removeItem(GLOSSARY_KEY)
  return seedGlossary as GlossaryTerm[]
}

export function loadLawsCatalog(): LawsCatalog {
  const stored = readJson<LawsCatalog>(LAWS_KEY)
  if (stored?.norms?.length) return stored
  return seedLaws as LawsCatalog
}

export function saveLawsCatalog(catalog: LawsCatalog) {
  localStorage.setItem(LAWS_KEY, JSON.stringify(catalog))
}

export function resetLawsCatalog() {
  localStorage.removeItem(LAWS_KEY)
  return seedLaws as LawsCatalog
}

export function searchGlossary(
  terms: GlossaryTerm[],
  query: string,
): Ranked<GlossaryTerm>[] {
  return rankGlossary(terms, query)
}

export function searchLaws(
  norms: LawNorm[],
  query: string,
): Ranked<LawNorm>[] {
  return rankLaws(norms, query)
}

export function categoriesOf(terms: GlossaryTerm[]) {
  return [...new Set(terms.map((t) => t.category))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
}
