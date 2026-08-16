export type SourceLink = { label: string; url: string }

export type GlossaryTerm = {
  id: string
  term: string
  category: string
  plain: string
  detail: string
  related: string[]
  exampleSj?: string | null
  sources?: SourceLink[]
  /** Notas de aceroyroca.com relacionadas al término */
  articlesAyr?: SourceLink[]
}

export type LawNorm = {
  id: string
  title: string
  scope: string
  ref?: string | null
  summary: string
  topics: string[]
}

export type LawsCatalog = {
  sourceUrl: string
  sourceLabel: string
  updatedNote: string
  norms: LawNorm[]
}

export type HistoryEntry = {
  id: string
  termId: string
  action: string
  at: string
  snapshot?: GlossaryTerm
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function normText(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}
