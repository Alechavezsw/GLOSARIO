import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { Highlight, SearchBox } from '../components/SearchBox'
import { SUGGESTED_LAWS, suggestTerms } from '../lib/search'
import { loadLawsCatalog, searchLaws } from '../lib/store'

export function LawsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [catalog] = useState(() => loadLawsCatalog())
  const [query, setQuery] = useState(() => searchParams.get('q') ?? '')
  const [scope, setScope] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q != null) setQuery(q)
  }, [searchParams])

  const scopes = useMemo(
    () =>
      [...new Set(catalog.norms.map((n) => n.scope))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [catalog],
  )

  const searching = query.trim().length > 0

  const suggestions = useMemo(
    () =>
      suggestTerms(
        catalog.norms.map((n) => ({ id: n.id, term: n.title })),
        query,
        6,
      ),
    [catalog, query],
  )

  const results = useMemo(() => {
    let list = searchLaws(catalog.norms, query)
    if (scope) list = list.filter((n) => n.scope === scope)
    return list
  }, [catalog, query, scope])

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
          Marco normativo
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.06em] sm:text-5xl">
          BUSCADOR DE LEYES
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-bright">
          {catalog.updatedNote}
        </p>
        <a
          href={catalog.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-ochre hover:underline"
        >
          {catalog.sourceLabel} →
        </a>

        <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <SearchBox
              value={query}
              onChange={setQuerySynced}
              placeholder="Buscar por título, tema o ref… (IIA, regalías, 7199)"
              suggestions={suggestions}
              onPickSuggestion={(s) => setQuerySynced(s.term)}
              chips={SUGGESTED_LAWS}
              onChip={setQuerySynced}
            />
          </div>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="min-h-12 border border-steel/25 bg-carbon-soft px-3 text-sm text-bone outline-none focus:border-copper lg:w-44"
          >
            <option value="">Todos los ámbitos</option>
            {scopes.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-steel">
          <p>
            {results.length} norma{results.length === 1 ? '' : 's'}
            {searching ? ' · por relevancia' : ''}
          </p>
          {(query || scope) && (
            <button
              type="button"
              onClick={() => {
                setQuerySynced('')
                setScope('')
              }}
              className="text-ochre hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <ul className="mt-8 divide-y divide-steel/15 border-y border-steel/15">
          {results.map((n) => (
            <li key={n.id} className="py-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-medium text-bone">
                  <Link
                    to={`/ley/${n.id}`}
                    className="hover:text-ochre"
                  >
                    {query.trim() ? (
                      <Highlight text={n.title} query={query} />
                    ) : (
                      n.title
                    )}
                  </Link>
                </h2>
                <span className="text-[10px] uppercase tracking-wider text-ochre">
                  {n.scope}
                </span>
                {n.ref ? (
                  <span className="text-xs text-steel">{n.ref}</span>
                ) : null}
                {searching && n.matchIn ? (
                  <span className="text-[10px] text-steel">
                    · {n.matchIn}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-steel-bright">
                {query.trim() ? (
                  <Highlight text={n.summary} query={query} />
                ) : (
                  n.summary
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {n.topics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setQuerySynced(t)}
                    className="border border-steel/20 px-2 py-0.5 text-[11px] text-steel hover:border-copper hover:text-copper-glow"
                  >
                    {t}
                  </button>
                ))}
                <Link
                  to={`/ley/${n.id}`}
                  className="border border-steel/20 px-2 py-0.5 text-[11px] text-ochre hover:border-ochre"
                >
                  Ficha →
                </Link>
              </div>
            </li>
          ))}
        </ul>

        {!results.length && (
          <p className="mt-10 text-sm text-steel">
            Sin coincidencias. Probá “ambiente”, “regalías” o “procedimiento”.
          </p>
        )}

        <div className="mt-10">
          <a
            href={catalog.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow"
          >
            Ver en Ministerio de Minería
          </a>
        </div>
      </main>
    </div>
  )
}
