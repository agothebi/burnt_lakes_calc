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
import { interpolateStops, STOPS } from '../scene/sceneUtils'

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

function formatLakes(lakes: number): string {
  if (lakes < 0.01) return `${(lakes * 100).toFixed(1)}% of a lake`
  if (lakes < 10)   return `${lakes.toFixed(2)} lakes`
  if (lakes < 1000) return `${Math.round(lakes)} lakes`
  return `${Math.round(lakes).toLocaleString()} lakes`
}

function buildShareText(liters: number, lakes: number) {
  const l = Math.round(liters).toLocaleString()
  return `I just burned ${formatLakes(lakes)} worth of water through AI usage — that's ~${l} liters. How many lakes have you burned? burnedlakes.dev`
}


export function ResultStep({ wizard }: { wizard: WizardControls }) {
  const confettiFired = useRef(false)
  const totalLiters = computeResult(wizard.answers)
  const result = formatResult(totalLiters)

  // Burn progress (0–1 log scale) — used for the mobile accent bar color
  const burnProgress = Math.min(1, Math.max(0, (Math.log10(Math.max(1, totalLiters)) / 5)))
  const accentLeft = interpolateStops(STOPS.skyTop, burnProgress)
  const accentRight = interpolateStops(STOPS.skyBot, burnProgress)

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

  const shareText = buildShareText(totalLiters, result.lakes)

  function handleShare() {
    navigator.clipboard.writeText(shareText).catch(() => {})
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-lg">
      {/* Mobile-only accent bar: replaces the lake scene visual cue */}
      <motion.div
        className="md:hidden h-1.5 rounded-full"
        style={{ background: `linear-gradient(to right, ${accentLeft}, ${accentRight})` }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />

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

      {/* Primary stat — lakes */}
      <motion.div
        className="clay clay-coral p-4 md:p-6 flex flex-col gap-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <p className="font-body text-sm font-bold text-[#1A1A2E]/60 uppercase tracking-widest">
          Lakes burned
        </p>
        <p className="font-display text-6xl md:text-7xl text-[#1A1A2E]">
          {result.lakes < 0.01 ? (
            <span>{(result.lakes * 100).toFixed(1)}%</span>
          ) : (
            <AnimatedNumber
              value={result.lakes}
              formatFn={n => n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString()}
              duration={1600}
            />
          )}
          {result.lakes >= 0.01 && (
            <span className="text-xl md:text-2xl ml-2">{result.lakes === 1 ? 'lake' : 'lakes'}</span>
          )}
          {result.lakes < 0.01 && (
            <span className="text-xl md:text-2xl ml-2">of a lake</span>
          )}
        </p>
        <p className="font-body text-xs text-[#1A1A2E]/40 mt-1">
          (~{Math.round(totalLiters).toLocaleString()} liters of real water)
        </p>
      </motion.div>

      {/* Reaction line */}
      <motion.div
        className="clay clay-blue p-4 md:p-6 flex flex-col gap-1"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <p className="font-display text-2xl md:text-3xl text-[#1A1A2E]">
          {result.reactionLine}
        </p>
      </motion.div>

      {/* Comparisons */}
      <motion.div
        className="flex flex-col gap-2 md:gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {result.comparisons.map((c, i) => (
          <div
            key={i}
            className="clay clay-cream px-5 py-3 font-body text-sm font-semibold text-[#1A1A2E]/70"
          >
            {c.value.toLocaleString()} {c.unit}
          </div>
        ))}
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
          Try again (different answers won't help)
        </ClayButton>
      </motion.div>
    </div>
  )
}
