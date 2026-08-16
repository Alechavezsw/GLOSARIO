import { articlesFor, exampleFor, sourcesFor } from './enrich'
import type { GlossaryTerm, HistoryEntry } from './types'
import { supabase, supabaseConfigured } from './supabase'

const HISTORY_KEY = 'glosario-mineria:history:v1'

export function enrichTerm(t: GlossaryTerm): GlossaryTerm {
  return {
    ...t,
    exampleSj: t.exampleSj ?? exampleFor(t.id),
    sources: t.sources?.length ? t.sources : sourcesFor(t),
    articlesAyr: t.articlesAyr?.length ? t.articlesAyr : articlesFor(t.id),
  }
}

export function enrichAll(terms: GlossaryTerm[]) {
  return terms.map(enrichTerm)
}

export function loadLocalHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function pushLocalHistory(entry: Omit<HistoryEntry, 'id' | 'at'>) {
  const full: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
  }
  const next = [full, ...loadLocalHistory()].slice(0, 80)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  if (supabaseConfigured && supabase) {
    void supabase.from('glosario_history').insert({
      term_id: entry.termId,
      action: entry.action,
      snapshot: entry.snapshot ?? null,
    })
  }
  return next
}

export async function submitProposal(term: GlossaryTerm, note: string) {
  if (!supabaseConfigured || !supabase) {
    pushLocalHistory({
      termId: term.id,
      action: 'proposal-local',
      snapshot: term,
    })
    return { ok: true, mode: 'local' as const }
  }
  const { error } = await supabase.from('glosario_proposals').insert({
    term_id: term.id,
    payload: term,
    note: note || null,
    status: 'pending',
  })
  if (error) return { ok: false as const, error: error.message }
  pushLocalHistory({ termId: term.id, action: 'proposal', snapshot: term })
  return { ok: true as const, mode: 'supabase' as const }
}

export function relatedLinks(term: GlossaryTerm) {
  return {
    sources: sourcesFor(term),
    example: exampleFor(term.id),
  }
}

export async function copyShareUrl(path: string) {
  const url = `${window.location.origin}${path}`
  await navigator.clipboard.writeText(url)
  return url
}
