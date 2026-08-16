import { useEffect, useId, useRef, useState } from 'react'
import { splitHighlight } from '../lib/search'

type Suggestion = { id: string; term: string }

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: Suggestion[]
  onPickSuggestion?: (s: Suggestion) => void
  chips?: string[]
  onChip?: (chip: string) => void
}

export function SearchBox({
  value,
  onChange,
  placeholder,
  suggestions = [],
  onPickSuggestion,
  chips = [],
  onChip,
}: SearchBoxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setActive(0)
  }, [suggestions, value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const showSuggest = open && suggestions.length > 0 && value.trim().length >= 2

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!showSuggest) {
              if (e.key === 'Escape' && value) {
                e.preventDefault()
                onChange('')
              }
              return
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setActive((i) => Math.min(i + 1, suggestions.length - 1))
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              setActive((i) => Math.max(i - 1, 0))
            } else if (e.key === 'Enter' && suggestions[active]) {
              e.preventDefault()
              onPickSuggestion?.(suggestions[active])
              setOpen(false)
            } else if (e.key === 'Escape') {
              setOpen(false)
            }
          }}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={showSuggest}
          aria-controls={listId}
          aria-autocomplete="list"
          className="min-h-12 w-full border border-steel/25 bg-carbon-soft py-2 pl-3 pr-20 text-sm text-bone outline-none placeholder:text-steel/50 focus:border-copper"
        />
        <div className="absolute inset-y-0 right-1 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="min-h-9 min-w-9 text-steel hover:text-bone"
              aria-label="Limpiar búsqueda"
            >
              ✕
            </button>
          ) : null}
        </div>

        {showSuggest && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto border border-steel/30 bg-carbon shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <li key={s.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  className={`block w-full px-3 py-2.5 text-left text-sm ${
                    i === active
                      ? 'bg-copper/25 text-bone'
                      : 'text-steel-bright hover:bg-carbon-soft hover:text-bone'
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onPickSuggestion?.(s)
                    setOpen(false)
                  }}
                >
                  <Highlight text={s.term} query={value} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChip?.(c)}
              className="border border-steel/25 px-2.5 py-1 text-[11px] text-steel transition hover:border-ochre hover:text-ochre"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const parts = splitHighlight(text, query)
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark
            key={`${i}-${p.text.slice(0, 8)}`}
            className="bg-ochre/30 text-inherit"
          >
            {p.text}
          </mark>
        ) : (
          <span key={`${i}-${p.text.slice(0, 8)}`}>{p.text}</span>
        ),
      )}
    </>
  )
}
