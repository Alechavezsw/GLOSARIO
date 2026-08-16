import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import { copyShareUrl } from '../lib/enrichStore'
import { downloadSectionsPdf } from '../lib/pdf'
import { loadLawsCatalog } from '../lib/store'
import { useState, useEffect } from 'react'

export function LawDetailPage() {
  const { id = '' } = useParams()
  const catalog = useMemo(() => loadLawsCatalog(), [])
  const law = catalog.norms.find((n) => n.id === id) ?? null
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(''), 2000)
    return () => window.clearTimeout(t)
  }, [msg])

  if (!law) {
    return (
      <div className="min-h-full bg-carbon text-bone">
        <AppNav />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="font-serif text-xl">Norma no encontrada</p>
          <Link to="/leyes" className="mt-4 inline-block text-ochre hover:underline">
            Volver a leyes
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
          {law.scope}
          {law.ref ? ` · ${law.ref}` : ''}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
          {law.title}
        </h1>

        <div className="no-print mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await copyShareUrl(`/ley/${law.id}`)
              setMsg('Link copiado')
            }}
            className="min-h-10 border border-steel/30 px-3 text-sm hover:border-ochre hover:text-ochre"
          >
            Copiar link
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                setMsg('Generando…')
                await downloadSectionsPdf({
                  title: law.title,
                  subtitle: [law.scope, law.ref].filter(Boolean).join(' · '),
                  filename: law.id || law.title,
                  sections: [
                    { heading: 'Resumen', body: law.summary },
                    {
                      heading: 'Temas',
                      body: law.topics.join(', '),
                    },
                    {
                      heading: 'Fuente',
                      body: `${catalog.sourceLabel}\n${catalog.sourceUrl}`,
                    },
                  ],
                })
                setMsg('PDF descargado')
              } catch (err) {
                console.error(err)
                setMsg('No se pudo generar el PDF')
              }
            }}
            className="min-h-10 border border-steel/30 px-3 text-sm hover:border-ochre hover:text-ochre"
          >
            Descargar PDF
          </button>
          <a
            href={catalog.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center border border-steel/30 px-3 text-sm hover:border-ochre hover:text-ochre"
          >
            Fuente oficial
          </a>
          {msg ? <span className="self-center text-xs text-ochre">{msg}</span> : null}
        </div>

        <p className="mt-8 font-serif text-lg leading-relaxed text-steel-bright">
          {law.summary}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {law.topics.map((t) => (
            <Link
              key={t}
              to={`/glosario?q=${encodeURIComponent(t)}`}
              className="border border-steel/25 px-2.5 py-1 text-xs text-steel hover:border-copper hover:text-copper-glow"
            >
              {t}
            </Link>
          ))}
        </div>

        <p className="mt-8 text-sm text-steel">{catalog.updatedNote}</p>

        <div className="no-print mt-10">
          <Link to="/leyes" className="text-sm text-ochre hover:underline">
            ← Volver a leyes
          </Link>
        </div>
      </main>
    </div>
  )
}
