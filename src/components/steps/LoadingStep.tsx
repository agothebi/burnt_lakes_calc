import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WizardControls } from '../../hooks/useWizard'

const LOADING_LINES = [
  'Measuring the waterline...',
  'Consulting the last surviving fish...',
  'Tallying your lake debt...',
  'Filing your arson report with the ducks...',
  'Summing up the ripple damage...',
]

export function LoadingStep({ wizard }: { wizard: WizardControls }) {
  const [lineIndex, setLineIndex] = useState(0)
  const hasAdvanced = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setLineIndex(i => (i + 1) % LOADING_LINES.length)
    }, 500)
    const timeout = setTimeout(() => {
      clearInterval(interval)
      if (!hasAdvanced.current) {
        hasAdvanced.current = true
        wizard.next()
      }
    }, 2600)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [wizard])

  return (
    <div className="flex flex-col items-center justify-center gap-8 max-w-lg mx-auto text-center py-16">
      {/* Evaporating water drop */}
      <motion.div
        className="relative w-20 h-20"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <motion.path
            d="M40 10 C40 10 12 45 12 55 C12 70 24 78 40 78 C56 78 68 70 68 55 C68 45 40 10 40 10 Z"
            fill="url(#dropGrad)"
            animate={{ d: [
              "M40 10 C40 10 12 45 12 55 C12 70 24 78 40 78 C56 78 68 70 68 55 C68 45 40 10 40 10 Z",
              "M40 30 C40 30 18 52 18 58 C18 68 28 74 40 74 C52 74 62 68 62 58 C62 52 40 30 40 30 Z",
              "M40 50 C40 50 26 60 26 63 C26 68 32 72 40 72 C48 72 54 68 54 63 C54 60 40 50 40 50 Z",
            ]}}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="dropGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5BCEFA" />
              <stop offset="100%" stopColor="#2A9BC4" />
            </linearGradient>
          </defs>
        </svg>
        {/* Steam particles */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#5BCEFA]/40"
            style={{ width: 6, height: 6, left: `${30 + i * 15}%`, bottom: '80%' }}
            animate={{ y: [-5, -25], opacity: [0.6, 0], scale: [1, 1.5] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.33,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      <div className="flex flex-col gap-2">
        <p className="font-display text-2xl text-[#1A1A2E]">Assessing the damage...</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            className="font-body text-sm text-[#1A1A2E]/50"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {LOADING_LINES[lineIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
