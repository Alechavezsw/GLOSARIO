import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { SourceList, TermActions } from '../components/TermActions'
import { enrichTerm } from '../lib/enrichStore'
import { usePrefs } from '../lib/prefs'
import { loadGlossary } from '../lib/store'

export function TermDetailPage() {
  const { id = '' } = useParams()
  const prefs = usePrefs()
  const terms = useMemo(() => loadGlossary().map(enrichTerm), [])
  const term = terms.find((t) => t.id === id) ?? null

  useEffect(() => {
    if (term) prefs.pushRecent(term.id)
  }, [term?.id])

  if (!term) {
    return (
      <div className="min-h-full bg-carbon text-bone">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-serif text-xl">Término no encontrado</p>
          <Link to="/glosario" className="mt-4 inline-block text-ochre hover:underline">
            Volver al glosario
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-carbon text-bone print-ficha">
      <div className="no-print">
        <AppNav />
      </div>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
          {term.category}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
          {term.term}
        </h1>
        <div className="mt-6">
          <TermActions term={term} />
        </div>

        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
            En simple
          </h2>
          <p className="mt-2 font-serif text-lg leading-relaxed text-steel-bright">
            {term.plain}
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
            Detalle
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-dim">{term.detail}</p>
        </section>

        {term.exampleSj && (
          <section className="mt-8 border border-copper/30 bg-copper/10 p-4">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-copper-glow">
              Ejemplo San Juan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-bone">{term.exampleSj}</p>
          </section>
        )}

        {term.articlesAyr && term.articlesAyr.length > 0 && (
          <section className="mt-8 border border-ochre/25 bg-ochre/5 p-4">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-ochre">
              En Acero y Roca
            </h2>
            <ul className="mt-3 space-y-2">
              {term.articlesAyr.map((a) => (
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
          </section>
        )}

        {term.related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
              Relacionados
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {term.related.map((r) => {
                const t = terms.find((x) => x.id === r)
                return (
                  <Link
                    key={r}
                    to={`/termino/${r}`}
                    className="border border-steel/25 px-2.5 py-1 text-xs text-steel-bright hover:border-ochre hover:text-ochre"
                  >
                    {t?.term ?? r}
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-[11px] uppercase tracking-[0.14em] text-steel">
            Fuentes
          </h2>
          <SourceList sources={term.sources ?? []} />
        </section>

        <div className="no-print mt-10">
          <Link to="/glosario" className="text-sm text-ochre hover:underline">
            ← Volver al glosario
          </Link>
        </div>
      </main>
    </div>
  )
}
