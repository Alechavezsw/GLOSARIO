import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import quizData from '../data/quiz.json'
import { AppNav } from '../components/AppNav'

type Q = {
  id: string
  prompt: string
  options: string[]
  correct: number
  explain: string
}

export function QuizPage() {
  const questions = quizData as Q[]
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[idx]
  const progress = useMemo(
    () => `${Math.min(idx + 1, questions.length)} / ${questions.length}`,
    [idx, questions.length],
  )

  const next = () => {
    if (picked === null) return
    if (picked === q.correct) setScore((s) => s + 1)
    if (idx + 1 >= questions.length) {
      setDone(true)
      return
    }
    setIdx((i) => i + 1)
    setPicked(null)
  }

  const restart = () => {
    setIdx(0)
    setPicked(null)
    setScore(0)
    setDone(false)
  }

  return (
    <div className="min-h-full bg-carbon text-bone">
      <AppNav />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 md:px-10 md:py-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-ochre">
          Autoevaluación
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.06em]">QUIZ</h1>
        <p className="mt-3 text-sm text-steel-bright">
          Ocho preguntas cortas para no mezclar conceptos clave.
        </p>

        {done ? (
          <div className="mt-10 border border-steel/25 bg-carbon-soft/40 p-6">
            <p className="font-serif text-2xl">
              {score} de {questions.length} correctas
            </p>
            <p className="mt-2 text-sm text-steel">
              {score >= 6
                ? 'Muy sólido. Repasá las diferencias esenciales si querés afinar.'
                : 'Vale la pena revisar cateo/concesión, IIA/DIA y recurso/reserva.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={restart}
                className="min-h-11 bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow"
              >
                Reintentar
              </button>
              <Link
                to="/diferencias"
                className="inline-flex min-h-11 items-center border border-steel/40 px-5 text-sm hover:border-ochre hover:text-ochre"
              >
                Ver diferencias
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-10">
            <p className="text-xs text-steel">{progress}</p>
            <h2 className="mt-3 font-serif text-xl leading-snug">{q.prompt}</h2>
            <ul className="mt-6 space-y-2">
              {q.options.map((opt, i) => {
                const selected = picked === i
                const reveal = picked !== null
                const ok = i === q.correct
                let cls =
                  'w-full border px-3 py-3 text-left text-sm transition '
                if (!reveal) {
                  cls += selected
                    ? 'border-copper bg-copper/20 text-bone'
                    : 'border-steel/25 text-steel-bright hover:border-steel/50'
                } else if (ok) {
                  cls += 'border-[#3D9B6E] bg-[#3D9B6E]/15 text-bone'
                } else if (selected) {
                  cls += 'border-copper/60 bg-copper/10 text-bone-dim'
                } else {
                  cls += 'border-steel/15 text-steel'
                }
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      disabled={picked !== null}
                      onClick={() => setPicked(i)}
                      className={cls}
                    >
                      {opt}
                    </button>
                  </li>
                )
              })}
            </ul>
            {picked !== null && (
              <p className="mt-4 text-sm leading-relaxed text-steel-bright">
                {q.explain}
              </p>
            )}
            <button
              type="button"
              disabled={picked === null}
              onClick={next}
              className="mt-6 min-h-11 bg-copper px-5 text-sm font-semibold text-bone hover:bg-copper-glow disabled:opacity-40"
            >
              {idx + 1 >= questions.length ? 'Ver resultado' : 'Siguiente'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
