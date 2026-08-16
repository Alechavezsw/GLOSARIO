import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppNav } from '../components/AppNav'
import {
  loadLocalHistory,
  pushLocalHistory,
  submitProposal,
} from '../lib/enrichStore'
import { usePrefs } from '../lib/prefs'
import { supabaseConfigured } from '../lib/supabase'
import {
  loadGlossary,
  loadLawsCatalog,
  resetGlossary,
  resetLawsCatalog,
  saveGlossary,
  saveLawsCatalog,
} from '../lib/store'
import type { GlossaryTerm, HistoryEntry, LawNorm } from '../lib/types'
import { slugify } from '../lib/types'

type Tab = 'glossary' | 'laws' | 'history'

const emptyTerm = (): GlossaryTerm => ({
  id: '',
  term: '',
  category: 'Derechos',
  plain: '',
  detail: '',
  related: [],
})

const emptyLaw = (): LawNorm => ({
  id: '',
  title: '',
  scope: 'Provincial',
  ref: '',
  summary: '',
  topics: [],
})

function termsToMarkdown(terms: GlossaryTerm[]) {
  return terms
    .map((t) => {
      const related = t.related.length ? t.related.join(', ') : ''
      return [
        `## ${t.term}`,
        '',
        `- id: ${t.id}`,
        `- categoría: ${t.category}`,
        related ? `- relacionados: ${related}` : null,
        '',
        '### En simple',
        t.plain,
        '',
        '### Detalle',
        t.detail,
        '',
      ]
        .filter((x) => x !== null)
        .join('\n')
    })
    .join('\n---\n\n')
}

function parseMarkdownTerms(md: string): GlossaryTerm[] {
  const chunks = md.split(/\n---\n+/).map((c) => c.trim()).filter(Boolean)
  const out: GlossaryTerm[] = []
  for (const chunk of chunks) {
    const title = chunk.match(/^##\s+(.+)$/m)?.[1]?.trim()
    if (!title) continue
    const id =
      chunk.match(/^- id:\s*(.+)$/m)?.[1]?.trim() || slugify(title)
    const category =
      chunk.match(/^- categor[ií]a:\s*(.+)$/im)?.[1]?.trim() || 'General'
    const relatedRaw =
      chunk.match(/^- relacionados:\s*(.+)$/im)?.[1]?.trim() || ''
    const plain =
      chunk.match(/### En simple\s*\n([\s\S]*?)(?=\n### |\n## |$)/)?.[1]?.trim() ||
      ''
    const detail =
      chunk.match(/### Detalle\s*\n([\s\S]*?)(?=\n### |\n## |$)/)?.[1]?.trim() ||
      ''
    if (!plain) continue
    out.push({
      id,
      term: title,
      category,
      plain,
      detail,
      related: relatedRaw
        .split(',')
        .map((s) => slugify(s.trim()))
        .filter(Boolean),
    })
  }
  return out
}

export function EditPage() {
  const prefs = usePrefs()
  const [searchParams] = useSearchParams()
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState<Tab>('glossary')
  const [terms, setTerms] = useState(() => loadGlossary())
  const [catalog, setCatalog] = useState(() => loadLawsCatalog())
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadLocalHistory())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTerm, setDraftTerm] = useState<GlossaryTerm>(emptyTerm)
  const [draftLaw, setDraftLaw] = useState<LawNorm>(emptyLaw)
  const [relatedRaw, setRelatedRaw] = useState('')
  const [topicsRaw, setTopicsRaw] = useState('')
  const [proposalNote, setProposalNote] = useState('')
  const [status, setStatus] = useState('')
  const [filter, setFilter] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const openedTerm = useRef(false)

  useEffect(() => {
    if (openedTerm.current || !prefs.editorUnlocked) return
    const termId = searchParams.get('term')
    if (!termId) return
    const t = loadGlossary().find((x) => x.id === termId)
    if (!t) return
    openedTerm.current = true
    setTab('glossary')
    selectTerm(t)
  }, [prefs.editorUnlocked, searchParams])

  const categories = useMemo(
    () =>
      [...new Set(terms.map((t) => t.category))].sort((a, b) =>
        a.localeCompare(b, 'es'),
      ),
    [terms],
  )

  const termList = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const list = !q
      ? terms
      : terms.filter(
          (t) =>
            t.term.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q),
        )
    return [...list].sort((a, b) => a.term.localeCompare(b.term, 'es'))
  }, [terms, filter])

  const lawList = useMemo(() => {
    const q = filter.trim().toLowerCase()
    const list = !q
      ? catalog.norms
      : catalog.norms.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.summary.toLowerCase().includes(q),
        )
    return list
  }, [catalog, filter])

  function selectTerm(t: GlossaryTerm) {
    setSelectedId(t.id)
    setDraftTerm({ ...t })
    setRelatedRaw(t.related.join(', '))
    setStatus('')
  }

  const selectLaw = (n: LawNorm) => {
    setSelectedId(n.id)
    setDraftLaw({ ...n, ref: n.ref ?? '' })
    setTopicsRaw(n.topics.join(', '))
    setStatus('')
  }

  const newTerm = () => {
    setSelectedId(null)
    setDraftTerm(emptyTerm())
    setRelatedRaw('')
    setStatus('')
  }

  const newLaw = () => {
    setSelectedId(null)
    setDraftLaw(emptyLaw())
    setTopicsRaw('')
    setStatus('')
  }

  const saveTerm = () => {
    const term = draftTerm.term.trim()
    const plain = draftTerm.plain.trim()
    if (!term || !plain) {
      setStatus('Faltan término o explicación simple.')
      return
    }
    const id = draftTerm.id || slugify(term)
    const next: GlossaryTerm = {
      ...draftTerm,
      id,
      term,
      plain,
      detail: draftTerm.detail.trim(),
      category: draftTerm.category.trim() || 'General',
      related: relatedRaw
        .split(',')
        .map((s) => slugify(s.trim()))
        .filter(Boolean),
    }
    const without = terms.filter((t) => t.id !== id)
    const updated = [...without, next].sort((a, b) =>
      a.term.localeCompare(b.term, 'es'),
    )
    setTerms(updated)
    saveGlossary(updated)
    setSelectedId(id)
    setDraftTerm(next)
    setHistory(
      pushLocalHistory({
        termId: id,
        action: selectedId ? 'update' : 'create',
        snapshot: next,
      }),
    )
    setStatus('Término guardado en este navegador.')
  }

  const deleteTerm = () => {
    if (!selectedId) return
    if (!confirm('¿Borrar este término?')) return
    const snap = terms.find((t) => t.id === selectedId)
    const updated = terms.filter((t) => t.id !== selectedId)
    setTerms(updated)
    saveGlossary(updated)
    if (snap) {
      setHistory(
        pushLocalHistory({
          termId: selectedId,
          action: 'delete',
          snapshot: snap,
        }),
      )
    }
    newTerm()
    setStatus('Término borrado.')
  }

  const proposeTerm = async () => {
    const term = draftTerm.term.trim()
    const plain = draftTerm.plain.trim()
    if (!term || !plain) {
      setStatus('Completá término y explicación antes de proponer.')
      return
    }
    const id = draftTerm.id || slugify(term)
    const next: GlossaryTerm = {
      ...draftTerm,
      id,
      term,
      plain,
      detail: draftTerm.detail.trim(),
      category: draftTerm.category.trim() || 'General',
      related: relatedRaw
        .split(',')
        .map((s) => slugify(s.trim()))
        .filter(Boolean),
    }
    const res = await submitProposal(next, proposalNote.trim())
    setHistory(loadLocalHistory())
    if (!res.ok) {
      setStatus(`Error al enviar: ${res.error}`)
      return
    }
    setStatus(
      res.mode === 'supabase'
        ? 'Propuesta enviada a Supabase.'
        : 'Propuesta guardada en historial local (Supabase no configurado).',
    )
  }

  const saveLaw = () => {
    const title = draftLaw.title.trim()
    const summary = draftLaw.summary.trim()
    if (!title || !summary) {
      setStatus('Faltan título o resumen.')
      return
    }
    const id = draftLaw.id || slugify(title)
    const next: LawNorm = {
      ...draftLaw,
      id,
      title,
      summary,
      scope: draftLaw.scope.trim() || 'Provincial',
      ref: draftLaw.ref?.trim() || null,
      topics: topicsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    }
    const without = catalog.norms.filter((n) => n.id !== id)
    const updated = { ...catalog, norms: [...without, next] }
    setCatalog(updated)
    saveLawsCatalog(updated)
    setSelectedId(id)
    setDraftLaw({ ...next, ref: next.ref ?? '' })
    setStatus('Norma guardada en este navegador.')
  }

  const deleteLaw = () => {
    if (!selectedId) return
    if (!confirm('¿Borrar esta norma?')) return
    const updated = {
      ...catalog,
      norms: catalog.norms.filter((n) => n.id !== selectedId),
    }
    setCatalog(updated)
    saveLawsCatalog(updated)
    newLaw()
    setStatus('Norma borrada.')
  }

  const doReset = () => {
    if (!confirm('¿Restablecer datos de fábrica? Se pierden ediciones locales.'))
      return
    if (tab === 'glossary') {
      const fresh = resetGlossary()
      setTerms(fresh)
      newTerm()
    } else if (tab === 'laws') {
      const fresh = resetLawsCatalog()
      setCatalog(fresh)
      newLaw()
    }
    setStatus('Datos restablecidos.')
  }

  const exportJson = () => {
    const payload = tab === 'laws' ? catalog : terms
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download =
      tab === 'laws' ? 'laws-export.json' : 'glossary-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportMarkdown = () => {
    const blob = new Blob([termsToMarkdown(terms)], {
      type: 'text/markdown;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'glossary-export.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFile = async (file: File) => {
    const text = await file.text()
    try {
      if (file.name.endsWith('.md')) {
        const parsed = parseMarkdownTerms(text)
        if (!parsed.length) {
          setStatus('No se pudieron leer términos del markdown.')
          return
        }
        const byId = new Map(terms.map((t) => [t.id, t]))
        for (const t of parsed) byId.set(t.id, t)
        const updated = [...byId.values()].sort((a, b) =>
          a.term.localeCompare(b.term, 'es'),
        )
        setTerms(updated)
        saveGlossary(updated)
        setHistory(
          pushLocalHistory({
            termId: 'bulk',
            action: 'import-md',
            snapshot: parsed[0],
          }),
        )
        setStatus(`Importados ${parsed.length} términos desde markdown.`)
        return
      }
      const data = JSON.parse(text) as GlossaryTerm[] | { norms: LawNorm[] }
      if (Array.isArray(data)) {
        setTerms(data)
        saveGlossary(data)
        setStatus(`Importados ${data.length} términos JSON.`)
      } else if (data && Array.isArray(data.norms)) {
        const next = { ...catalog, ...data }
        setCatalog(next)
        saveLawsCatalog(next)
        setStatus(`Importadas ${data.norms.length} normas JSON.`)
      } else {
        setStatus('JSON no reconocido.')
      }
    } catch {
      setStatus('No se pudo leer el archivo.')
    }
  }

  if (!prefs.editorUnlocked) {
    return (
      <div className="min-h-full bg-carbon text-bone">
        <AppNav />
        <main className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
            Acceso editor
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-[0.06em]">
            EDITAR
          </h1>
          <p className="mt-3 text-sm text-steel-bright">
            Ingresá el PIN para editar, proponer cambios e importar/exportar.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (prefs.unlockEditor(pin)) setStatus('')
              else setStatus('PIN incorrecto.')
            }}
          >
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="field"
              autoComplete="current-password"
            />
            {status ? <p className="text-sm text-ochre">{status}</p> : null}
            <button
              type="submit"
              className="min-h-11 w-full bg-copper text-sm font-semibold text-bone hover:bg-copper-glow"
            >
              Entrar
            </button>
          </form>
          <style>{fieldCss}</style>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-carbon text-bone">
      <AppNav />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
              Panel local
              {supabaseConfigured ? ' · Supabase listo' : ' · solo navegador'}
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-[0.06em] sm:text-5xl">
              EDITAR
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-bright">
              Guardá en este navegador, exportá JSON/Markdown, o enviá
              propuestas
              {supabaseConfigured ? ' a Supabase' : ' (historial local)'}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => prefs.lockEditor()}
            className="min-h-10 border border-steel/30 px-3 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
          >
            Bloquear
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setTab('glossary')
              setFilter('')
              newTerm()
            }}
            className={`min-h-10 px-4 text-sm ${
              tab === 'glossary'
                ? 'bg-copper text-bone'
                : 'border border-steel/30 text-steel-bright'
            }`}
          >
            Términos
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('laws')
              setFilter('')
              newLaw()
            }}
            className={`min-h-10 px-4 text-sm ${
              tab === 'laws'
                ? 'bg-copper text-bone'
                : 'border border-steel/30 text-steel-bright'
            }`}
          >
            Leyes
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`min-h-10 px-4 text-sm ${
              tab === 'history'
                ? 'bg-copper text-bone'
                : 'border border-steel/30 text-steel-bright'
            }`}
          >
            Historial
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="min-h-10 border border-steel/30 px-4 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
          >
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={exportMarkdown}
            className="min-h-10 border border-steel/30 px-4 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
          >
            Exportar MD
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-10 border border-steel/30 px-4 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
          >
            Importar
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.md,application/json,text/markdown"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
          {tab !== 'history' && (
            <button
              type="button"
              onClick={doReset}
              className="min-h-10 border border-steel/30 px-4 text-sm text-steel-bright hover:border-ochre hover:text-ochre"
            >
              Restablecer
            </button>
          )}
        </div>

        {status && <p className="mt-4 text-sm text-ochre">{status}</p>}

        {tab === 'history' ? (
          <ul className="mt-8 divide-y divide-steel/15 border-y border-steel/15">
            {history.length === 0 && (
              <li className="py-6 text-sm text-steel">Sin eventos aún.</li>
            )}
            {history.map((h) => (
              <li key={h.id} className="py-4">
                <p className="text-sm text-bone">
                  <span className="text-ochre">{h.action}</span>
                  {' · '}
                  {h.termId}
                  {h.snapshot?.term ? ` · ${h.snapshot.term}` : ''}
                </p>
                <p className="mt-1 text-xs text-steel">
                  {new Date(h.at).toLocaleString('es-AR')}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,16rem)_1fr]">
            <aside className="border border-steel/20 bg-carbon-soft/40 p-3">
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filtrar lista…"
                className="mb-3 min-h-10 w-full border border-steel/25 bg-carbon px-2 text-sm outline-none focus:border-copper"
              />
              <button
                type="button"
                onClick={tab === 'glossary' ? newTerm : newLaw}
                className="mb-3 w-full min-h-10 border border-dashed border-steel/40 text-sm text-steel-bright hover:border-copper hover:text-copper-glow"
              >
                + Nuevo
              </button>
              <ul className="max-h-[28rem] space-y-0.5 overflow-y-auto text-sm">
                {tab === 'glossary'
                  ? termList.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => selectTerm(t)}
                          className={`w-full px-2 py-2 text-left ${
                            selectedId === t.id
                              ? 'bg-copper/20 text-bone'
                              : 'text-steel-bright hover:bg-carbon hover:text-bone'
                          }`}
                        >
                          {t.term}
                        </button>
                      </li>
                    ))
                  : lawList.map((n) => (
                      <li key={n.id}>
                        <button
                          type="button"
                          onClick={() => selectLaw(n)}
                          className={`w-full px-2 py-2 text-left ${
                            selectedId === n.id
                              ? 'bg-copper/20 text-bone'
                              : 'text-steel-bright hover:bg-carbon hover:text-bone'
                          }`}
                        >
                          {n.title}
                        </button>
                      </li>
                    ))}
              </ul>
            </aside>

            <section className="border border-steel/20 bg-carbon-soft/30 p-4 md:p-6">
              {tab === 'glossary' ? (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveTerm()
                  }}
                >
                  <Field label="Término">
                    <input
                      value={draftTerm.term}
                      onChange={(e) =>
                        setDraftTerm((d) => ({ ...d, term: e.target.value }))
                      }
                      className="field"
                    />
                  </Field>
                  <Field label="Categoría">
                    <input
                      list="cats"
                      value={draftTerm.category}
                      onChange={(e) =>
                        setDraftTerm((d) => ({
                          ...d,
                          category: e.target.value,
                        }))
                      }
                      className="field"
                    />
                    <datalist id="cats">
                      {categories.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </Field>
                  <Field label="En simple (para cualquiera)">
                    <textarea
                      value={draftTerm.plain}
                      onChange={(e) =>
                        setDraftTerm((d) => ({ ...d, plain: e.target.value }))
                      }
                      rows={4}
                      className="field"
                    />
                  </Field>
                  <Field label="Detalle">
                    <textarea
                      value={draftTerm.detail}
                      onChange={(e) =>
                        setDraftTerm((d) => ({ ...d, detail: e.target.value }))
                      }
                      rows={3}
                      className="field"
                    />
                  </Field>
                  <Field label="Relacionados (ids separados por coma)">
                    <input
                      value={relatedRaw}
                      onChange={(e) => setRelatedRaw(e.target.value)}
                      className="field"
                      placeholder="cateo, canon, iia"
                    />
                  </Field>
                  <Field label="Nota de propuesta (opcional)">
                    <input
                      value={proposalNote}
                      onChange={(e) => setProposalNote(e.target.value)}
                      className="field"
                      placeholder="Motivo del cambio…"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="submit"
                      className="min-h-11 bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => void proposeTerm()}
                      className="min-h-11 border border-ochre/50 px-5 text-sm text-ochre hover:bg-ochre/10"
                    >
                      Enviar propuesta
                    </button>
                    {selectedId && (
                      <button
                        type="button"
                        onClick={deleteTerm}
                        className="min-h-11 border border-steel/40 px-5 text-sm hover:border-ochre hover:text-ochre"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveLaw()
                  }}
                >
                  <Field label="Título">
                    <input
                      value={draftLaw.title}
                      onChange={(e) =>
                        setDraftLaw((d) => ({ ...d, title: e.target.value }))
                      }
                      className="field"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Ámbito">
                      <select
                        value={draftLaw.scope}
                        onChange={(e) =>
                          setDraftLaw((d) => ({ ...d, scope: e.target.value }))
                        }
                        className="field"
                      >
                        <option>Nacional</option>
                        <option>Provincial</option>
                      </select>
                    </Field>
                    <Field label="Referencia (opcional)">
                      <input
                        value={draftLaw.ref ?? ''}
                        onChange={(e) =>
                          setDraftLaw((d) => ({ ...d, ref: e.target.value }))
                        }
                        className="field"
                        placeholder="Ley 7199"
                      />
                    </Field>
                  </div>
                  <Field label="Resumen">
                    <textarea
                      value={draftLaw.summary}
                      onChange={(e) =>
                        setDraftLaw((d) => ({ ...d, summary: e.target.value }))
                      }
                      rows={4}
                      className="field"
                    />
                  </Field>
                  <Field label="Temas (separados por coma)">
                    <input
                      value={topicsRaw}
                      onChange={(e) => setTopicsRaw(e.target.value)}
                      className="field"
                      placeholder="IIA, ambiente, regalías"
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="submit"
                      className="min-h-11 bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow"
                    >
                      Guardar
                    </button>
                    {selectedId && (
                      <button
                        type="button"
                        onClick={deleteLaw}
                        className="min-h-11 border border-steel/40 px-5 text-sm hover:border-ochre hover:text-ochre"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
      <style>{fieldCss}</style>
    </div>
  )
}

const fieldCss = `
  .field {
    width: 100%;
    min-height: 2.75rem;
    border: 1px solid color-mix(in srgb, #8a9ba8 25%, transparent);
    background: #0f1419;
    padding: 0.5rem 0.75rem;
    color: #e8e2d6;
    font-size: 0.875rem;
    outline: none;
  }
  .field:focus {
    border-color: #c45c26;
  }
  textarea.field {
    min-height: auto;
    resize: vertical;
  }
`

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-steel">
        {label}
      </span>
      {children}
    </label>
  )
}
