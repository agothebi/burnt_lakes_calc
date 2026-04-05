import { motion } from 'framer-motion'
import type { ClayColor } from './ClayButton'

interface ClayChipProps {
  label: string
  selected?: boolean
  onClick: () => void
  color?: ClayColor
}

const SHADOW_MAP: Record<ClayColor, string> = {
  blue:   '#2A9BC4',
  coral:  '#C94040',
  lime:   '#6BAA1E',
  purple: '#8B2FCF',
  yellow: '#C9A400',
  cream:  '#D4A96A',
}

const IDLE_COLOR: Record<ClayColor, { light: string; base: string }> = {
  blue:   { light: '#8ADEFF', base: '#5BCEFA' },
  coral:  { light: '#FF9494', base: '#FF6B6B' },
  lime:   { light: '#C4ED8A', base: '#A8E063' },
  purple: { light: '#D4A8FF', base: '#C084FC' },
  yellow: { light: '#FFE878', base: '#FFD93D' },
  cream:  { light: '#FFF8EE', base: '#FFF0D6' },
}

export function ClayChip({ label, selected = false, onClick, color = 'blue' }: ClayChipProps) {
  const shadow = SHADOW_MAP[color]
  const idle = IDLE_COLOR[color]

  const background = selected
    ? `linear-gradient(160deg, ${idle.light}, ${idle.base})`
    : 'linear-gradient(160deg, #FFF8EE, #FFF0D6)'

  const currentShadow = selected
    ? `0 5px 0 0 ${shadow}, inset 0 2px 4px rgba(255,255,255,0.55)`
    : `0 5px 0 0 #D4A96A, inset 0 2px 4px rgba(255,255,255,0.55)`

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="rounded-2xl px-4 py-2 text-sm font-bold font-body text-[#1A1A2E] cursor-pointer border-none outline-none select-none"
      style={{ background, boxShadow: currentShadow }}
      animate={{ background, boxShadow: currentShadow }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ y: 3, boxShadow: selected
        ? `0 2px 0 0 ${shadow}, inset 0 2px 4px rgba(255,255,255,0.55)`
        : '0 2px 0 0 #D4A96A, inset 0 2px 4px rgba(255,255,255,0.55)'
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {label}
    </motion.button>
  )
}

// ─── Multi-select group ───────────────────────────────────────────────────────

interface ChipGroupProps<T extends string> {
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (values: T[]) => void
  color?: ClayColor
}

export function ClayChipGroup<T extends string>({
  options,
  selected,
  onChange,
  color = 'blue',
}: ChipGroupProps<T>) {
  function toggle(value: T) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <ClayChip
          key={opt.value}
          label={opt.label}
          selected={selected.includes(opt.value)}
          onClick={() => toggle(opt.value)}
          color={color}
        />
      ))}
    </div>
  )
}
