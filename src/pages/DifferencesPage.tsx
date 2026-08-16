import { useState } from 'react'
import { Link } from 'react-router-dom'
import differences from '../data/differences.json'
import { AppNav } from '../components/AppNav'
import { downloadSectionsPdf } from '../lib/pdf'

export function DifferencesPage() {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  return (
    <div className="min-h-full bg-carbon text-bone print-ficha">
      <div className="no-print">
        <AppNav />
      </div>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
          Para no confundir
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.06em] sm:text-5xl">
          DIFERENCIAS ESENCIALES
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-steel-bright">
          Pares que suelen mezclarse en notas, informes y debates públicos.
        </p>
        <div className="no-print mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setMsg('')
              try {
                await downloadSectionsPdf({
                  title: 'Diferencias esenciales',
                  subtitle:
                    'Pares que suelen mezclarse en notas, informes y debates públicos.',
                  filename: 'diferencias-esenciales',
                  sections: differences.map((d) => ({
                    heading: d.pair,
                    body: d.difference,
                  })),
                })
                setMsg('PDF descargado')
              } catch (err) {
                console.error(err)
                setMsg('No se pudo generar el PDF')
              } finally {
                setBusy(false)
              }
            }}
            className="min-h-10 border border-steel/30 px-3 text-sm hover:border-ochre hover:text-ochre disabled:opacity-50"
          >
            {busy ? 'Generando…' : 'Descargar PDF'}
          </button>
          {msg ? <span className="text-xs text-ochre">{msg}</span> : null}
        </div>

        <ul className="mt-10 divide-y divide-steel/15 border-y border-steel/15">
          {differences.map((d) => (
            <li key={d.pair} className="py-5">
              <h2 className="font-serif text-xl text-bone">{d.pair}</h2>
              <p className="mt-2 text-sm leading-relaxed text-steel-bright">
                {d.difference}
              </p>
            </li>
          ))}
        </ul>

        <div className="no-print mt-10 flex flex-wrap gap-3">
          <Link
            to="/quiz"
            className="inline-flex min-h-11 items-center bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow"
          >
            Probar con el quiz
          </Link>
          <Link
            to="/glosario"
            className="inline-flex min-h-11 items-center border border-steel/40 px-5 text-sm hover:border-ochre hover:text-ochre"
          >
            Ir al glosario
          </Link>
        </div>
      </main>
    </div>
  )
}
