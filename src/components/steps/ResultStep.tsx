import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { ClayButton } from '../ui/ClayButton'
import { AnimatedNumber } from '../ui/AnimatedNumber'
import type { WizardControls } from '../../hooks/useWizard'
import {
  calculateRegularUser,
  calculatePowerUserTokens,
  calculatePowerUserCalls,
  formatResult,
  MESSAGES_PER_SESSION,
  FREQUENCY_MULTIPLIER,
  CONVERSATION_MULTIPLIER,
  TOKENS_PER_CALL,
  ML_PER_1K_TOKENS,
  outputRatioMultiplier,
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
  if (lakes < 0.002) return `${(lakes * 100).toFixed(2)}% of a lake`
  if (lakes < 10)    return `${lakes.toFixed(2)} lakes`
  if (lakes < 1000)  return `${Math.round(lakes)} lakes`
  return `${Math.round(lakes).toLocaleString()} lakes`
}

function buildShareText(liters: number, lakes: number) {
  const l = Math.round(liters).toLocaleString()
  return `I just burned ${formatLakes(lakes)} worth of water through AI usage — that's ~${l} liters. How many lakes have you burned? https://burnt-lakes.vercel.app`
}

const FREQ_LABEL: Record<string, string> = {
  '1-2': '1–2 days/week', '3-4': '3–4 days/week',
  '5-6': '5–6 days/week', 'daily': 'Every day',
}
const SESSION_LABEL: Record<string, string> = {
  'under15': '< 15 min', '15to30': '15–30 min',
  '30to60': '30–60 min', '1to2h': '1–2 hours', 'over2h': '2+ hours',
}
const STYLE_LABEL: Record<string, string> = {
  'quick': 'Quick question', 'backforth': 'Back and forth',
  'long': 'Long session', 'debate': 'Full rabbit hole',
}
const MODEL_LABEL: Record<string, string> = {
  'small': 'Small / fast', 'mid': 'Mid-tier', 'frontier': 'Frontier',
}
const CALL_SIZE_LABEL: Record<string, string> = {
  'single': 'Single exchange', '3to5': '3–5 messages',
  '10plus': '10+ messages', 'full': 'Full conversation',
}

function buildInfoLines(answers: WizardControls['answers'], totalLiters: number): string[] {
  const lines: string[] = []
  if (answers.userType === 'power') {
    const tier = answers.modelTier ?? 'mid'
    const rate = ML_PER_1K_TOKENS[tier]
    lines.push(`Model tier:        ${MODEL_LABEL[tier]}  (${rate}ml / 1K tokens)`)
    if (answers.powerPath === 'tokens') {
      const tokens = answers.monthlyTokens ?? 500_000
      const ratio = answers.outputRatio ?? 0.5
      const mult = outputRatioMultiplier(ratio)
      lines.push(`Monthly tokens:    ~${tokens.toLocaleString()}`)
      lines.push(`Output ratio:      ${Math.round(ratio * 100)}% output  (${mult.toFixed(1)}× multiplier)`)
    } else {
      const calls = answers.callsPerDay ?? 500
      const size = answers.callSize ?? '3to5'
      const tpc = TOKENS_PER_CALL[size]
      const monthly = calls * 30 * tpc
      lines.push(`Calls/day:         ~${calls.toLocaleString()}`)
      lines.push(`Call size:         ${CALL_SIZE_LABEL[size]}  (~${tpc.toLocaleString()} tokens/call)`)
      lines.push(`Est. monthly tokens: ~${monthly.toLocaleString()}`)
    }
  } else {
    const freq = answers.frequencyPerWeek ?? '3-4'
    const sess = answers.sessionLength ?? '15to30'
    const style = answers.conversationStyle ?? 'backforth'
    const msgs = MESSAGES_PER_SESSION[sess]
    const freqMult = FREQUENCY_MULTIPLIER[freq]
    const convMult = CONVERSATION_MULTIPLIER[style]
    const msgsPerDay = Math.round(msgs * freqMult * convMult)
    const days = (answers.monthsActive ?? 6) * 30
    lines.push(`Frequency:         ${FREQ_LABEL[freq]}  (${freqMult}× multiplier)`)
    lines.push(`Session length:    ${SESSION_LABEL[sess]}  (~${msgs} messages/session)`)
    lines.push(`Style:             ${STYLE_LABEL[style]}  (${convMult}× multiplier)`)
    lines.push(`Est. msgs/day:     ~${msgsPerDay}  over ${days} days`)
    lines.push(`Water per message: ~100ml  (total data center footprint)`)
  }
  lines.push(`Duration:          ${answers.monthsActive ?? 6} months`)
  lines.push(`Total water:       ~${Math.round(totalLiters).toLocaleString()} liters`)
  lines.push(`Source: Li et al. 2023 (UC Riverside) — arxiv.org/abs/2304.03271`)
  return lines
}


export function ResultStep({ wizard }: { wizard: WizardControls }) {
  const confettiFired = useRef(false)
  const [showInfo, setShowInfo] = useState(false)
  const totalLiters = computeResult(wizard.answers)
  const result = formatResult(totalLiters)
  const infoLines = buildInfoLines(wizard.answers, totalLiters)

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
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-3xl md:text-4xl text-[#1A1A2E]">Your damage report</h2>
          <button
            onClick={() => setShowInfo(v => !v)}
            className="w-6 h-6 rounded-full font-body font-bold text-xs text-[#1A1A2E]/50 border border-[#1A1A2E]/20 flex items-center justify-center cursor-pointer hover:text-[#1A1A2E]/80 hover:border-[#1A1A2E]/40 transition-colors flex-shrink-0"
            aria-label="Show calculation details"
          >
            i
          </button>
        </div>
        <p className="font-body text-sm text-[#1A1A2E]/50">
          On behalf of the lakes: we need to talk.
        </p>
      </motion.div>

      <AnimatePresence>
        {showInfo && (
          <motion.div
            className="clay clay-cream px-5 py-4 flex flex-col gap-1 overflow-hidden"
            initial={{ opacity: 0, height: 0, marginTop: -16 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: -16 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {infoLines.map((line, i) => (
              <p key={i} className="font-body text-xs text-[#1A1A2E]/60 font-mono whitespace-pre">
                {line}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

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
          {result.lakes < 0.002 ? (
            <span>{(result.lakes * 100).toFixed(2)}%</span>
          ) : (
            <AnimatedNumber
              value={result.lakes}
              formatFn={n => n < 10 ? n.toFixed(2) : Math.round(n).toLocaleString()}
              duration={1600}
            />
          )}
          {result.lakes >= 0.002 && (
            <span className="text-xl md:text-2xl ml-2">{result.lakes === 1 ? 'lake' : 'lakes'}</span>
          )}
          {result.lakes < 0.002 && (
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
