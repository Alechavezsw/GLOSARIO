import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { BrandLogo } from '../components/BrandLogo'
import { SearchBox } from '../components/SearchBox'
import { enrichAll } from '../lib/enrichStore'
import { usePrefs } from '../lib/prefs'
import { searchGlossary, searchLaws, loadGlossary, loadLawsCatalog, GLOSSARY_META } from '../lib/store'

type Hit =
  | { kind: 'term'; id: string; label: string; blurb: string }
  | { kind: 'law'; id: string; label: string; blurb: string }

export function HomePage() {
  const nav = useNavigate()
  const prefs = usePrefs()
  const [query, setQuery] = useState('')
  const terms = useMemo(() => enrichAll(loadGlossary()), [])
  const laws = useMemo(() => loadLawsCatalog(), [])

  const suggestions = useMemo(() => {
    const q = query.trim()
    if (q.length < 2) return []
    const tHits = searchGlossary(terms, q).slice(0, 5)
    const lHits = searchLaws(laws.norms, q).slice(0, 3)
    return [
      ...tHits.map((t) => ({ id: `t:${t.id}`, term: `Término · ${t.term}` })),
      ...lHits.map((n) => ({ id: `l:${n.id}`, term: `Ley · ${n.title}` })),
    ]
  }, [terms, laws, query])

  const unified: Hit[] = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const tHits = searchGlossary(terms, q).slice(0, 6)
    const lHits = searchLaws(laws.norms, q).slice(0, 4)
    return [
      ...tHits.map((t) => ({
        kind: 'term' as const,
        id: t.id,
        label: t.term,
        blurb: t.plain,
      })),
      ...lHits.map((n) => ({
        kind: 'law' as const,
        id: n.id,
        label: n.title,
        blurb: n.summary,
      })),
    ]
  }, [terms, laws, query])

  const favTerms = terms.filter((t) => prefs.favorites.includes(t.id)).slice(0, 6)
  const recentTerms = prefs.recent
    .map((id) => terms.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 6)

  return (
    <div className="relative min-h-full overflow-hidden bg-carbon text-bone">
      {/* Fondo: camino a mina / yacimiento San Juan */}
      <div
        className="absolute inset-0 animate-fade bg-cover bg-center"
        style={{
          backgroundImage: 'url(/hero-mina-san-juan.jpg)',
          backgroundPosition: 'center 40%',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            linear-gradient(105deg,
              rgba(15, 20, 25, 0.9) 0%,
              rgba(15, 20, 25, 0.78) 36%,
              rgba(15, 20, 25, 0.48) 68%,
              rgba(15, 20, 25, 0.62) 100%
            ),
            linear-gradient(to top,
              rgba(15, 20, 25, 0.88) 0%,
              rgba(15, 20, 25, 0.28) 48%,
              rgba(15, 20, 25, 0.4) 100%
            ),
            radial-gradient(ellipse 70% 55% at 18% 78%,
              rgba(196, 92, 38, 0.2) 0%,
              transparent 65%
            )
          `,
        }}
      />
      <div className="relative z-10 flex min-h-full flex-col">
        <AppNav />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <div className="animate-rise mt-4">
            <BrandLogo size="lg" to={null} priority />
          </div>
          <h1 className="animate-rise-delay mt-6 font-display text-5xl tracking-[0.08em] sm:text-6xl md:text-7xl">
            GLOSARIO DE MINERÍA
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-xl font-serif text-lg leading-relaxed text-steel-bright md:text-xl">
            {GLOSSARY_META.subtitle}. Buscá términos y leyes en un solo lugar.
          </p>

          <div className="animate-rise-delay-2 mt-8 max-w-2xl">
            <SearchBox
              value={query}
              onChange={setQuery}
              placeholder="Buscar en glosario y leyes… (cateo, IIA, regalías)"
              suggestions={suggestions}
              onPickSuggestion={(s) => {
                if (s.id.startsWith('t:')) nav(`/termino/${s.id.slice(2)}`)
                else if (s.id.startsWith('l:')) nav(`/ley/${s.id.slice(2)}`)
              }}
              chips={['cateo', 'IIA', 'regalías', 'relaves', 'pórfido']}
              onChip={setQuery}
            />
          </div>

          {unified.length > 0 && (
            <ul className="mt-6 max-w-2xl divide-y divide-steel/15 border border-steel/20 bg-carbon/70">
              {unified.map((h) => (
                <li key={`${h.kind}-${h.id}`}>
                  <Link
                    to={h.kind === 'term' ? `/termino/${h.id}` : `/ley/${h.id}`}
                    className="block px-4 py-3 hover:bg-carbon-soft"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-ochre">
                      {h.kind === 'term' ? 'Término' : 'Ley'}
                    </p>
                    <p className="font-medium text-bone">{h.label}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-steel">
                      {h.blurb}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="animate-rise-delay-2 mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              to="/glosario"
              className="inline-flex min-h-11 items-center justify-center bg-copper px-6 text-sm font-semibold text-bone hover:bg-copper-glow"
            >
              Glosario
            </Link>
            <Link
              to="/leyes"
              className="inline-flex min-h-11 items-center justify-center border border-steel/40 px-6 text-sm hover:border-ochre hover:text-ochre"
            >
              Leyes
            </Link>
            <Link
              to="/diferencias"
              className="inline-flex min-h-11 items-center justify-center border border-steel/40 px-6 text-sm hover:border-ochre hover:text-ochre"
            >
              Diferencias
            </Link>
            <Link
              to="/quiz"
              className="inline-flex min-h-11 items-center justify-center border border-steel/40 px-6 text-sm hover:border-ochre hover:text-ochre"
            >
              Quiz
            </Link>
          </div>

          {(favTerms.length > 0 || recentTerms.length > 0) && (
            <div className="mt-12 grid gap-8 md:grid-cols-2">
              {recentTerms.length > 0 && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
                    Vistos recientemente
                  </h2>
                  <ul className="mt-3 space-y-1">
                    {recentTerms.map((t) =>
                      t ? (
                        <li key={t.id}>
                          <Link
                            to={`/termino/${t.id}`}
                            className="text-sm text-steel-bright hover:text-ochre"
                          >
                            {t.term}
                          </Link>
                        </li>
                      ) : null,
                    )}
                  </ul>
                </section>
              )}
              {favTerms.length > 0 && (
                <section>
                  <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
                    Favoritos
                  </h2>
                  <ul className="mt-3 space-y-1">
                    {favTerms.map((t) => (
                      <li key={t.id}>
                        <Link
                          to={`/termino/${t.id}`}
                          className="text-sm text-steel-bright hover:text-ochre"
                        >
                          {t.term}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
