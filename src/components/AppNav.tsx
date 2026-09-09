import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'

export type NavItem = { to: string; label: string }

const LINKS: NavItem[] = [
  { to: '/', label: 'Inicio' },
  { to: '/glosario', label: 'Glosario' },
  { to: '/leyes', label: 'Leyes' },
  { to: '/diferencias', label: 'Diferencias' },
  { to: '/quiz', label: 'Quiz' },
]

function linkActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function AppNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 border-b border-steel/20 px-4 py-4 sm:px-6 md:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo size="sm" to="https://aceroyroca.com/" />
        <span className="hidden truncate font-display text-lg tracking-[0.12em] text-bone sm:inline">
          GLOSARIO DE MINERÍA
        </span>
      </div>

      <nav className="hidden items-center gap-5 text-sm md:flex">
        {LINKS.map((item) => {
          const active = linkActive(pathname, item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={
                active
                  ? 'text-ochre'
                  : 'text-steel-bright transition hover:text-copper-glow'
              }
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        className="inline-flex min-h-11 min-w-11 items-center justify-center border border-steel/30 text-bone md:hidden"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '✕' : '☰'}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-steel/20 bg-carbon px-4 py-3 md:hidden">
          <ul className="space-y-1">
            {LINKS.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={`block min-h-11 px-2 py-3 text-sm ${
                    linkActive(pathname, item.to)
                      ? 'text-ochre'
                      : 'text-steel-bright'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
