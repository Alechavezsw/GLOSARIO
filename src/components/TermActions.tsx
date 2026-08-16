import { useEffect, useState } from 'react'
import { copyShareUrl } from '../lib/enrichStore'
import { downloadSectionsPdf } from '../lib/pdf'
import { usePrefs } from '../lib/prefs'
import type { GlossaryTerm, SourceLink } from '../lib/types'

export function SourceList({ sources }: { sources: SourceLink[] }) {
  if (!sources.length) return null
  return (
    <ul className="mt-2 space-y-1">
      {sources.map((s) => (
        <li key={s.url}>
          <a
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-ochre hover:underline"
          >
            {s.label} →
          </a>
        </li>
      ))}
    </ul>
  )
}

export function TermActions({ term }: { term: GlossaryTerm }) {
  const prefs = usePrefs()
  const fav = prefs.favorites.includes(term.id)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!msg) return
    const t = window.setTimeout(() => setMsg(''), 2000)
    return () => window.clearTimeout(t)
  }, [msg])

  const downloadPdf = async () => {
    setBusy(true)
    try {
      const sections = [
        { heading: 'En simple', body: term.plain },
        { heading: 'Detalle', body: term.detail },
      ]
      if (term.exampleSj) {
        sections.push({ heading: 'Ejemplo San Juan', body: term.exampleSj })
      }
      if (term.articlesAyr?.length) {
        sections.push({
          heading: 'En Acero y Roca',
          body: term.articlesAyr
            .map((a) => `${a.label}\n${a.url}`)
            .join('\n\n'),
        })
      }
      if (term.sources?.length) {
        sections.push({
          heading: 'Fuentes',
          body: term.sources.map((s) => `${s.label}\n${s.url}`).join('\n\n'),
        })
      }
      await downloadSectionsPdf({
        title: term.term,
        subtitle: term.category,
        filename: term.id || term.term,
        sections,
      })
      setMsg('PDF descargado')
    } catch (err) {
      console.error(err)
      setMsg('No se pudo generar el PDF')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="no-print flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => prefs.toggleFavorite(term.id)}
        className={`min-h-10 border px-3 text-sm ${
          fav
            ? 'border-ochre bg-ochre/15 text-ochre'
            : 'border-steel/30 text-steel-bright hover:border-ochre'
        }`}
      >
        {fav ? '★ Favorito' : '☆ Favorito'}
      </button>
      <button
        type="button"
        onClick={async () => {
          await copyShareUrl(`/termino/${term.id}`)
          setMsg('Link copiado')
        }}
        className="min-h-10 border border-steel/30 px-3 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
      >
        Copiar link
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => void downloadPdf()}
        className="min-h-10 border border-steel/30 px-3 text-sm text-steel-bright hover:border-ochre hover:text-ochre disabled:opacity-50"
      >
        {busy ? 'Generando…' : 'Descargar PDF'}
      </button>
      {msg ? <span className="self-center text-xs text-ochre">{msg}</span> : null}
    </div>
  )
}
