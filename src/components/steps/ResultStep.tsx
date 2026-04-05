import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ClayButton } from '../ui/ClayButton'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import type { WizardControls } from '../../hooks/useWizard'
import {
  calculateRegularUser,
  calculatePowerUserTokens,
  calculatePowerUserCalls,
  formatResult,
} from '../../utils/calculator'

function computeResult(answers: WizardControls['answers']) {
  if (answers.userType === 'power') {
    if (answers.powerPath === 'tokens') {
      return calculatePowerUserTokens({
        monthlyTokens: answers.monthlyTokens ?? 500_000,
        outputRatio: answers.outputRatio ?? 0.5,
        modelTier: answers.modelTier ?? 'mid',
        monthsActive: answers.monthsActive ?? 6,
      })
    }
    return calculatePowerUserCalls({
      callsPerDay: answers.callsPerDay ?? 500,
      callSize: answers.callSize ?? '3to5',
      modelTier: answers.modelTier ?? 'mid',
      monthsActive: answers.monthsActive ?? 6,
    })
  }
  return calculateRegularUser({
    tools: answers.tools ?? ['chatgpt'],
    frequencyPerWeek: answers.frequencyPerWeek ?? '3-4',
    sessionLength: answers.sessionLength ?? '15to30',
    conversationStyle: answers.conversationStyle ?? 'backforth',
    monthsActive: answers.monthsActive ?? 6,
  })
}

function buildShareText(liters: number, lakeEquivalent: number, lakeUnit: string) {
  const l = Math.round(liters).toLocaleString()
  const eq = lakeEquivalent < 1
    ? `${Math.round(lakeEquivalent * 100)}% of a ${lakeUnit.replace(/s$/, '')}`
    : `${lakeEquivalent.toFixed(1)} ${lakeUnit}`
  return `I just found out I've evaporated ~${l} liters of water through AI usage. That's ${eq}. Find out yours: https://burnedlakes.dev`
}

const COMPARISON_COPY = [
  (bathtubs: number) => `Enough to fill ${Math.round(bathtubs).toLocaleString()} bathtubs`,
  (liters: number) => `${Math.round(liters / 2).toLocaleString()} days of drinking water for one person`,
  (liters: number) => `${Math.round(liters / 6).toLocaleString()} toilet flushes`,
]

export function ResultStep({ wizard }: { wizard: WizardControls }) {
  const confettiFired = useRef(false)
  const totalLiters = computeResult(wizard.answers)
  const result = formatResult(totalLiters)

  useEffect(() => {
    if (confettiFired.current) return
    confettiFired.current = true
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#5BCEFA', '#FF6B6B', '#FFD93D', '#A8E063', '#C084FC'],
      })
    }, 400)
  }, [])

  const shareText = buildShareText(totalLiters, result.lakeEquivalent, result.lakeUnit)

  function handleShare() {
    navigator.clipboard.writeText(shareText).catch(() => {})
  }

  const bathtubs = totalLiters / 2_500

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl text-[#1A1A2E] mb-1">Your damage report</h2>
        <p className="font-body text-sm text-[#1A1A2E]/50">
          On behalf of the lakes: we need to talk.
        </p>
      </motion.div>

      {/* Primary stat */}
      <motion.div
        className="clay clay-coral p-4 md:p-6 flex flex-col gap-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <p className="font-body text-sm font-bold text-[#1A1A2E]/60 uppercase tracking-widest">
          Water evaporated
        </p>
        <p className="font-display text-6xl md:text-7xl text-[#1A1A2E]">
          {totalLiters < 1 ? (
            <span>&lt; 1</span>
          ) : (
            <AnimatedNumber
              value={Math.round(totalLiters)}
              formatFn={n => Math.round(n).toLocaleString()}
              duration={1600}
            />
          )}
          <span className="text-xl md:text-2xl ml-2">{totalLiters === 1 ? 'liter' : 'liters'}</span>
        </p>
      </motion.div>

      {/* Lake equivalent */}
      <motion.div
        className="clay clay-blue p-4 md:p-6 flex flex-col gap-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <p className="font-body text-sm font-bold text-[#1A1A2E]/60 uppercase tracking-widest">
          That's equivalent to
        </p>
        <p className="font-display text-3xl md:text-4xl text-[#1A1A2E]">
          <AnimatedNumber
            value={result.lakeEquivalent}
            formatFn={n => n < 1 ? n.toFixed(2) : n.toFixed(1)}
            duration={1400}
          />
          <span className="text-2xl ml-2">{result.lakeEquivalent === 1 ? result.lakeUnit.replace(/s$/, '') : result.lakeUnit}</span>
        </p>
      </motion.div>

      {/* Comparisons */}
      <motion.div
        className="flex flex-col gap-2 md:gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {COMPARISON_COPY.map((fn, i) => (
          <div
            key={i}
            className="clay clay-cream px-5 py-3 font-body text-sm font-semibold text-[#1A1A2E]/70"
          >
            {fn(i === 0 ? bathtubs : totalLiters)}
          </div>
        ))}

        <p className="font-body text-xs text-[#1A1A2E]/30 px-1">
          For context: Lake Tahoe holds ~150 billion liters. You're getting there.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <ClayButton color="coral" onClick={handleShare} fullWidth>
          Share this tragedy
        </ClayButton>
        <ClayButton color="cream" onClick={wizard.reset} fullWidth>
          Recalculate
        </ClayButton>
      </motion.div>
    </div>
  )
}
