import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import type { ClayColor } from './ClayButton'

interface ClayCardProps {
  children: ReactNode
  color?: ClayColor
  onClick?: () => void
  selected?: boolean
  hoverable?: boolean
  className?: string
  padding?: 'sm' | 'md' | 'lg'
}

const SHADOW_MAP: Record<ClayColor, string> = {
  blue:   '#2A9BC4',
  coral:  '#C94040',
  lime:   '#6BAA1E',
  purple: '#8B2FCF',
  yellow: '#C9A400',
  cream:  '#D4A96A',
}

const SELECTED_RING: Record<ClayColor, string> = {
  blue:   '0 0 0 3px #2A9BC4',
  coral:  '0 0 0 3px #C94040',
  lime:   '0 0 0 3px #6BAA1E',
  purple: '0 0 0 3px #8B2FCF',
  yellow: '0 0 0 3px #C9A400',
  cream:  '0 0 0 3px #D4A96A',
}

const PADDING_CLASSES = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

export function ClayCard({
  children,
  color = 'cream',
  onClick,
  selected = false,
  hoverable = false,
  className = '',
  padding = 'md',
}: ClayCardProps) {
  const shadow = SHADOW_MAP[color]
  const isInteractive = !!onClick || hoverable

  const boxShadow = selected
    ? `0 8px 0 0 ${shadow}, inset 0 2px 5px rgba(255,255,255,0.55), ${SELECTED_RING[color]}`
    : `0 8px 0 0 ${shadow}, inset 0 2px 5px rgba(255,255,255,0.55)`

  return (
    <motion.div
      onClick={onClick}
      className={[
        'clay',
        `clay-${color}`,
        PADDING_CLASSES[padding],
        isInteractive ? 'cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{
        '--clay-shadow': shadow,
        boxShadow,
      } as React.CSSProperties}
      whileHover={isInteractive ? { scale: 1.02, y: -2 } : {}}
      whileTap={isInteractive ? {
        y: 4,
        boxShadow: `0 4px 0 0 ${shadow}, inset 0 2px 5px rgba(255,255,255,0.55)`,
      } : {}}
      animate={{ boxShadow }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {children}
    </motion.div>
  )
}
