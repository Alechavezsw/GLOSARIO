import { normText } from './types'

const STOP = new Set([
  'de',
  'del',
  'la',
  'las',
  'el',
  'los',
  'un',
  'una',
  'y',
  'o',
  'en',
  'a',
  'al',
  'para',
  'por',
  'con',
  'sin',
  'que',
  'se',
  'su',
  'sus',
  'es',
  'son',
  'como',
  'sobre',
  'entre',
  'desde',
  'hasta',
  'the',
  'of',
  'or',
  'and',
])

/** Sinónimos / alias frecuentes en minería argentina */
const SYNONYMS: Record<string, string[]> = {
  cateo: ['exploracion', 'permiso', 'prospeccion'],
  exploracion: ['cateo', 'prospeccion', 'permiso'],
  prospeccion: ['exploracion', 'cateo'],
  concesion: ['mina', 'explotacion', 'pertenencia'],
  canon: ['amparo', 'pago'],
  regalia: ['regalias', 'boca', 'produccion'],
  regalias: ['regalia', 'boca', 'produccion'],
  iia: ['impacto', 'ambiental', 'dia', 'eia'],
  dia: ['iia', 'impacto', 'ambiental'],
  eia: ['iia', 'impacto', 'ambiental'],
  impacto: ['iia', 'ambiental', 'dia'],
  ambiental: ['iia', 'ambiente', 'dia'],
  ambiente: ['ambiental', 'iia'],
  relave: ['relaves', 'colas', 'tailings'],
  relaves: ['relave', 'colas'],
  colas: ['relaves', 'relave'],
  lixiviacion: ['heap', 'cianuracion', 'pilas'],
  cianuracion: ['cianuro', 'lixiviacion'],
  porfido: ['cobre', 'diseminado'],
  mensura: ['pertenencia', 'catastro', 'poligono'],
  catastro: ['mensura', 'padron', 'inscripcion'],
  expediente: ['tramite', 'autoridad', 'resolucion'],
  ipeem: ['instituto', 'areas', 'provincial'],
  recurso: ['recursos', 'reserva', 'reservas'],
  recursos: ['recurso', 'reserva'],
  reserva: ['reservas', 'recurso', 'recursos'],
  reservas: ['reserva', 'recurso'],
  factibilidad: ['viabilidad', 'pfs', 'fs', 'prefactibilidad'],
  prefactibilidad: ['factibilidad', 'pfs'],
  cierre: ['poscierre', 'rehabilitacion', 'abandono'],
  dar: ['acido', 'drenaje', 'sulfuro'],
  cueq: ['cobre', 'equivalente'],
  sx: ['solventes', 'electroobtencion', 'ew'],
  ew: ['electroobtencion', 'sx', 'catodo'],
  mina: ['yacimiento', 'explotacion', 'concesion'],
  yacimiento: ['mina', 'criadero', 'deposito'],
  titular: ['concesionario', 'permiso'],
  autoridad: ['provincial', 'tramite', 'expediente'],
}

export function tokens(query: string): string[] {
  return normText(query)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP.has(t))
}

export function expandTokens(toks: string[]): string[] {
  const out = new Set(toks)
  for (const t of toks) {
    const syns = SYNONYMS[t]
    if (syns) for (const s of syns) out.add(s)
  }
  return [...out]
}

function scoreField(
  field: string,
  queryTokens: string[],
  weights: { exact: number; prefix: number; includes: number; token: number },
): number {
  if (!field) return 0
  const n = normText(field)
  let score = 0
  const joined = queryTokens.join(' ')
  if (joined && n === joined) score += weights.exact
  else if (joined && n.startsWith(joined)) score += weights.prefix
  else if (joined && n.includes(joined)) score += weights.includes

  for (const t of queryTokens) {
    if (n === t) score += weights.token * 1.5
    else if (n.startsWith(t)) score += weights.token
    else if (n.includes(t)) score += weights.token * 0.6
  }
  return score
}

export type Ranked<T> = T & { score: number; matchIn: string }

export function rankGlossary<
  T extends {
    id: string
    term: string
    category: string
    plain: string
    detail: string
    related: string[]
  },
>(items: T[], query: string): Ranked<T>[] {
  const raw = tokens(query)
  if (!raw.length) {
    return items
      .map((t) => ({ ...t, score: 0, matchIn: '' }))
      .sort((a, b) => a.term.localeCompare(b.term, 'es'))
  }

  const q = expandTokens(raw)
  const ranked: Ranked<T>[] = []

  for (const item of items) {
    const termScore = scoreField(item.term, q, {
      exact: 100,
      prefix: 70,
      includes: 45,
      token: 28,
    })
    const catScore = scoreField(item.category, q, {
      exact: 25,
      prefix: 18,
      includes: 12,
      token: 10,
    })
    const plainScore = scoreField(item.plain, q, {
      exact: 20,
      prefix: 12,
      includes: 10,
      token: 6,
    })
    const detailScore = scoreField(item.detail, q, {
      exact: 8,
      prefix: 5,
      includes: 4,
      token: 2.5,
    })
    const relatedScore = scoreField(item.related.join(' '), q, {
      exact: 15,
      prefix: 10,
      includes: 8,
      token: 5,
    })
    const idScore = scoreField(item.id, raw, {
      exact: 40,
      prefix: 25,
      includes: 15,
      token: 12,
    })

    const score =
      termScore + catScore + plainScore + detailScore + relatedScore + idScore
    if (score <= 0) continue

    let matchIn = 'definición'
    if (termScore >= catScore && termScore >= plainScore) matchIn = 'término'
    else if (catScore > plainScore) matchIn = 'categoría'
    else if (relatedScore > plainScore) matchIn = 'relacionado'

    ranked.push({ ...item, score, matchIn })
  }

  return ranked.sort(
    (a, b) => b.score - a.score || a.term.localeCompare(b.term, 'es'),
  )
}

export function rankLaws<
  T extends {
    id: string
    title: string
    scope: string
    ref?: string | null
    summary: string
    topics: string[]
  },
>(items: T[], query: string): Ranked<T>[] {
  const raw = tokens(query)
  if (!raw.length) {
    return items.map((n) => ({ ...n, score: 0, matchIn: '' }))
  }

  const q = expandTokens(raw)
  const ranked: Ranked<T>[] = []

  for (const item of items) {
    const titleScore = scoreField(item.title, q, {
      exact: 100,
      prefix: 70,
      includes: 45,
      token: 28,
    })
    const refScore = scoreField(item.ref ?? '', q, {
      exact: 60,
      prefix: 40,
      includes: 30,
      token: 20,
    })
    const scopeScore = scoreField(item.scope, q, {
      exact: 20,
      prefix: 12,
      includes: 10,
      token: 8,
    })
    const summaryScore = scoreField(item.summary, q, {
      exact: 18,
      prefix: 10,
      includes: 8,
      token: 5,
    })
    const topicsScore = scoreField(item.topics.join(' '), q, {
      exact: 35,
      prefix: 22,
      includes: 16,
      token: 12,
    })

    const score =
      titleScore + refScore + scopeScore + summaryScore + topicsScore
    if (score <= 0) continue

    let matchIn = 'resumen'
    if (titleScore >= topicsScore && titleScore >= refScore) matchIn = 'título'
    else if (refScore > topicsScore) matchIn = 'referencia'
    else if (topicsScore > summaryScore) matchIn = 'tema'

    ranked.push({ ...item, score, matchIn })
  }

  return ranked.sort(
    (a, b) => b.score - a.score || a.title.localeCompare(b.title, 'es'),
  )
}

export function suggestTerms(
  items: Array<{ term: string; id: string }>,
  query: string,
  limit = 6,
): Array<{ term: string; id: string }> {
  const q = normText(query.trim())
  if (q.length < 2) return []
  return items
    .map((t) => {
      const n = normText(t.term)
      let score = 0
      if (n === q) score = 100
      else if (n.startsWith(q)) score = 80
      else if (n.includes(q)) score = 40
      return { ...t, score }
    })
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term, 'es'))
    .slice(0, limit)
    .map(({ term, id }) => ({ term, id }))
}

/** Resalta coincidencias de la query en un texto (sin HTML inseguro: React nodes). */
export function splitHighlight(
  text: string,
  query: string,
): Array<{ text: string; hit: boolean }> {
  const toks = tokens(query)
  if (!toks.length || !text) return [{ text, hit: false }]

  const pattern = toks
    .slice(0, 8)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  if (!pattern) return [{ text, hit: false }]

  try {
    const re = new RegExp(`(${pattern})`, 'gi')
    const parts = text.split(re)
    return parts.filter(Boolean).map((part) => ({
      text: part,
      hit: toks.some((t) => normText(part) === t || normText(part).includes(t)),
    }))
  } catch {
    return [{ text, hit: false }]
  }
}

export const SUGGESTED_GLOSSARY = [
  'cateo',
  'concesión',
  'canon',
  'regalías',
  'IIA',
  'relaves',
  'mensura',
  'pórfido',
  'factibilidad',
  'cierre de mina',
]

export const SUGGESTED_LAWS = [
  'IIA',
  'regalías',
  'IPEEM',
  'procedimiento',
  'ambiente',
  'Veladero',
  'Código de Minería',
]
