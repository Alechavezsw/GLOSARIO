import { Link } from 'react-router-dom'

interface BrandLogoProps {
  to?: string | null
  size?: 'sm' | 'md' | 'lg' | 'hero'
  className?: string
  priority?: boolean
}

const SIZE: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-14 w-auto md:h-16',
  hero: 'h-16 w-auto md:h-24 lg:h-28',
}

export function BrandLogo({
  to = '/',
  size = 'md',
  className = '',
  priority = false,
}: BrandLogoProps) {
  const img = (
    <img
      src="/aceroyroca-300x95.webp"
      alt="Acero y Roca"
      width={300}
      height={95}
      className={`${SIZE[size]} object-contain object-left ${className}`}
      decoding="async"
      {...(priority ? { fetchPriority: 'high' as const } : {})}
    />
  )

  if (to === null) return img

  return (
    <Link to={to} className="inline-flex items-center" aria-label="Inicio">
      {img}
    </Link>
  )
}
