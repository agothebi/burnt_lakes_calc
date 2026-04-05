import { motion } from 'framer-motion'

interface PillOption<T> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  selected: T | null
  onSelect: (value: T) => void
}

export function PillGroup<T extends string>({ options, selected, onSelect }: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map(opt => {
        const isSelected = selected === opt.value
        return (
          <motion.button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className="rounded-2xl px-5 py-3 font-body font-bold text-sm text-[#1A1A2E] cursor-pointer border-none select-none"
            style={{
              background: isSelected
                ? 'linear-gradient(160deg, #FF9494, #FF6B6B)'
                : 'linear-gradient(160deg, #FFF8EE, #FFF0D6)',
              boxShadow: isSelected
                ? '0 5px 0 0 #C94040, inset 0 2px 4px rgba(255,255,255,0.55)'
                : '0 5px 0 0 #D4A96A, inset 0 2px 4px rgba(255,255,255,0.55)',
            }}
            animate={{
              background: isSelected
                ? 'linear-gradient(160deg, #FF9494, #FF6B6B)'
                : 'linear-gradient(160deg, #FFF8EE, #FFF0D6)',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ y: 3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {opt.label}
          </motion.button>
        )
      })}
    </div>
  )
}
