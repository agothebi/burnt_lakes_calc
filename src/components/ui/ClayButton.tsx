import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export type ClayColor = 'blue' | 'coral' | 'lime' | 'purple' | 'yellow' | 'cream'

interface ClayButtonProps {
  children: ReactNode
  color?: ClayColor
  onClick?: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  type?: 'button' | 'submit'
  className?: string
}

const SHADOW_MAP: Record<ClayColor, string> = {
  blue:   '#2A9BC4',
  coral:  '#C94040',
  lime:   '#6BAA1E',
  purple: '#8B2FCF',
  yellow: '#C9A400',
  cream:  '#D4A96A',
}

const SIZE_CLASSES = {
  sm: 'px-5 py-2 text-base',
  md: 'px-7 py-3 text-lg',
  lg: 'px-10 py-4 text-xl',
}

export function ClayButton({
  children,
  color = 'blue',
  onClick,
  disabled = false,
  size = 'md',
  fullWidth = false,
  type = 'button',
  className = '',
}: ClayButtonProps) {
  const shadow = SHADOW_MAP[color]

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        'clay',
        `clay-${color}`,
        SIZE_CLASSES[size],
        'font-body font-bold cursor-pointer select-none',
        'text-[#1A1A2E] leading-tight',
        'border-none outline-none',
        fullWidth ? 'w-full' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
        className,
      ].filter(Boolean).join(' ')}
      style={{ '--clay-shadow': shadow } as React.CSSProperties}
      whileHover={disabled ? {} : { scale: 1.03 }}
      whileTap={disabled ? {} : {
        y: 4,
        boxShadow: `0 4px 0 0 ${shadow}, inset 0 2px 5px rgba(255,255,255,0.55)`,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {children}
    </motion.button>
  )
}
