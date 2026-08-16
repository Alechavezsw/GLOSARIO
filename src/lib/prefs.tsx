import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type Prefs = {
  contrast: boolean
  largeType: boolean
  favorites: string[]
  recent: string[]
  editorUnlocked: boolean
}

const KEY = 'glosario-mineria:prefs:v1'
const PIN = 'mineria'

const defaultPrefs: Prefs = {
  contrast: false,
  largeType: false,
  favorites: [],
  recent: [],
  editorUnlocked: false,
}

type Ctx = Prefs & {
  setContrast: (v: boolean) => void
  setLargeType: (v: boolean) => void
  toggleFavorite: (id: string) => void
  pushRecent: (id: string) => void
  unlockEditor: (pin: string) => boolean
  lockEditor: () => void
}

const PrefsContext = createContext<Ctx | null>(null)

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultPrefs
    return { ...defaultPrefs, ...JSON.parse(raw) }
  } catch {
    return defaultPrefs
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Prefs>(() => load())

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs))
    document.documentElement.dataset.contrast = prefs.contrast ? '1' : '0'
    document.documentElement.dataset.large = prefs.largeType ? '1' : '0'
  }, [prefs])

  const value = useMemo<Ctx>(
    () => ({
      ...prefs,
      setContrast: (contrast) => setPrefs((p) => ({ ...p, contrast })),
      setLargeType: (largeType) => setPrefs((p) => ({ ...p, largeType })),
      toggleFavorite: (id) =>
        setPrefs((p) => ({
          ...p,
          favorites: p.favorites.includes(id)
            ? p.favorites.filter((x) => x !== id)
            : [...p.favorites, id],
        })),
      pushRecent: (id) =>
        setPrefs((p) => ({
          ...p,
          recent: [id, ...p.recent.filter((x) => x !== id)].slice(0, 12),
        })),
      unlockEditor: (pin) => {
        if (pin.trim() !== PIN) return false
        setPrefs((p) => ({ ...p, editorUnlocked: true }))
        return true
      },
      lockEditor: () => setPrefs((p) => ({ ...p, editorUnlocked: false })),
    }),
    [prefs],
  )

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
}

export function usePrefs() {
  const ctx = useContext(PrefsContext)
  if (!ctx) throw new Error('usePrefs outside provider')
  return ctx
}
