import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { Highlight, SearchBox } from '../components/SearchBox'
import { enrichAll } from '../lib/enrichStore'
import {
  SUGGESTED_GLOSSARY,
  suggestTerms,
} from '../lib/search'
import {
  categoriesOf,
  GLOSSARY_META,
  loadGlossary,
  searchGlossary,
} from '../lib/store'
import type { GlossaryTerm } from '../lib/types'

export function GlossaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [terms] = useState(() => enrichAll(loadGlossary()))
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [category, setCategory] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q != null) setQuery(q)
  }, [searchParams])

  const categories = useMemo(() => categoriesOf(terms), [terms])
  const searching = query.trim().length > 0

  const suggestions = useMemo(
    () => suggestTerms(terms, query, 8),
    [terms, query],
  )

  const filtered = useMemo(() => {
    let list = searchGlossary(terms, query)
    if (category) list = list.filter((t) => t.category === category)
    return list
  }, [terms, query, category])

  const byLetter = useMemo(() => {
    if (searching) return null
    const map = new Map<string, GlossaryTerm[]>()
    for (const t of filtered) {
      const letter = t.term.charAt(0).toUpperCase()
      const key = /[A-ZÁÉÍÓÚÑ]/i.test(letter)
        ? letter.normalize('NFD')[0].toUpperCase()
        : '#'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(t)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [filtered, searching])

  const letters = useMemo(
    () => (byLetter ? byLetter.map(([l]) => l) : []),
    [byLetter],
  )

  const setQuerySynced = (q: string) => {
    setQuery(q)
    if (q.trim()) setSearchParams({ q: q.trim() }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  return (
    <div className="min-h-full bg-carbon text-bone">
      <AppNav />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
          {GLOSSARY_META.title}
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.06em] sm:text-5xl">
          GLOSARIO
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-bright">
          {GLOSSARY_META.subtitle}. {GLOSSARY_META.disclaimer}
        </p>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <SearchBox
              value={query}
              onChange={setQuerySynced}
              placeholder="Buscar término, sinónimo o tema… (cateo, IIA, relaves)"
              suggestions={suggestions}
              onPickSuggestion={(s) => {
                setQuerySynced(s.term)
                setOpenId(s.id)
              }}
              chips={SUGGESTED_GLOSSARY}
              onChip={setQuerySynced}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-12 border border-steel/25 bg-carbon-soft px-3 text-sm text-bone outline-none focus:border-copper lg:w-52"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-steel">
          <p>
            {filtered.length} término{filtered.length === 1 ? '' : 's'}
            {searching ? ' · ordenados por relevancia' : ''}
            {category ? ` · ${category}` : ''}
          </p>
          {(query || category) && (
            <button
              type="button"
              onClick={() => {
                setQuerySynced('')
                setCategory('')
              }}
              className="text-ochre hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {!searching && letters.length > 0 && (
          <nav
            className="mt-5 flex flex-wrap gap-1 border border-steel/15 bg-carbon-soft/40 p-2"
            aria-label="Índice alfabético"
          >
            {letters.map((l) => (
              <a
                key={l}
                href={`#letra-${l}`}
                className="inline-flex min-h-8 min-w-8 items-center justify-center text-xs text-steel-bright hover:text-ochre"
              >
                {l}
              </a>
            ))}
          </nav>
        )}

        {searching ? (
          <ul className="mt-8 divide-y divide-steel/15 border-y border-steel/15">
            {filtered.map((t) => {
              const open = openId === t.id
              return (
                <TermRow
                  key={t.id}
                  term={t}
                  open={open}
                  query={query}
                  showMatch
                  onToggle={() => setOpenId(open ? null : t.id)}
                  terms={terms}
                />
              )
            })}
          </ul>
        ) : (
          <div className="mt-8 space-y-10">
            {byLetter?.map(([letter, items]) => (
              <section key={letter} id={`letra-${letter}`}>
                <h2 className="font-display text-3xl tracking-[0.12em] text-copper">
                  {letter}
                </h2>
                <ul className="mt-4 divide-y divide-steel/15 border-y border-steel/15">
                  {items.map((t) => {
                    const open = openId === t.id
                    return (
                      <TermRow
                        key={t.id}
                        term={t}
                        open={open}
                        query={query}
                        showMatch={false}
                        onToggle={() => setOpenId(open ? null : t.id)}
                        terms={terms}
                      />
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        {!filtered.length && (
          <p className="mt-10 text-sm text-steel">
            No hay resultados para “{query}”. Probá un sinónimo (exploración →
            cateo) u otra ortografía.
          </p>
        )}
      </main>
    </div>
  )
}

function TermRow({
  term: t,
  open,
  query,
  showMatch,
  onToggle,
  terms,
}: {
  term: GlossaryTerm & { score?: number; matchIn?: string }
  open: boolean
  query: string
  showMatch: boolean
  onToggle: () => void
  terms: GlossaryTerm[]
}) {
  return (
    <li className="py-4">
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to={`/termino/${t.id}`}
            className="font-medium text-bone hover:text-ochre"
          >
            {query.trim() ? <Highlight text={t.term} query={query} /> : t.term}
          </Link>
          <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ochre">
            {t.category}
            {showMatch && t.matchIn ? (
              <span className="ml-2 font-sans normal-case tracking-normal text-steel">
                · coincide en {t.matchIn}
              </span>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 text-steel"
          aria-label={open ? 'Cerrar detalle' : 'Abrir detalle'}
        >
          {open ? '−' : '+'}
        </button>
      </div>
      <p className="mt-2 font-serif text-base leading-relaxed text-steel-bright">
        {query.trim() ? <Highlight text={t.plain} query={query} /> : t.plain}
      </p>
      {t.exampleSj ? (
        <p className="mt-2 text-xs text-copper-glow">Ejemplo SJ disponible →</p>
      ) : null}
      {t.articlesAyr && t.articlesAyr.length > 0 ? (
        <p className="mt-1 text-xs text-ochre">
          Nota en Acero y Roca →
        </p>
      ) : null}
      {open && (
        <div className="mt-3 space-y-3 border-l-2 border-copper/50 pl-3">
          <p className="text-sm leading-relaxed text-bone-dim">{t.detail}</p>
          {t.exampleSj ? (
            <p className="text-sm text-steel-bright">
              <span className="text-copper-glow">SJ: </span>
              {t.exampleSj}
            </p>
          ) : null}
          {t.articlesAyr && t.articlesAyr.length > 0 ? (
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-ochre">
                En Acero y Roca
              </p>
              <ul className="mt-1.5 space-y-1">
                {t.articlesAyr.map((a) => (
                  <li key={a.url}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-ochre hover:underline"
                    >
                      {a.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {t.related.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {t.related.map((r) => {
                const target = terms.find((x) => x.id === r)
                return (
                  <Link
                    key={r}
                    to={`/termino/${r}`}
                    className="border border-steel/25 px-2 py-0.5 text-[11px] text-steel hover:border-copper hover:text-copper-glow"
                  >
                    {target?.term ?? r}
                  </Link>
                )
              })}
            </div>
          )}
          <Link
            to={`/termino/${t.id}`}
            className="inline-block text-xs text-ochre hover:underline"
          >
            Ver ficha completa →
          </Link>
        </div>
      )}
    </li>
  )
}
