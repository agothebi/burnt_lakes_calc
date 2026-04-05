import { useMemo } from 'react'
import type { WizardAnswers } from './useWizard'
import {
  calculateRegularUser,
  calculatePowerUserTokens,
  calculatePowerUserCalls,
  FREQUENCY_MULTIPLIER,
  MESSAGES_PER_SESSION,
  CONVERSATION_MULTIPLIER,
  MODEL_MULTIPLIER,
  LITERS_PER_MESSAGE_BASELINE,
} from '../utils/calculator'

/**
 * Maps total water liters to a 0–1 burn progress value for the lake scene.
 *
 * The scale is logarithmic so the scene reacts early (a few liters already
 * moves the needle) but also keeps growing for enterprise-level usage.
 *
 * Reference points:
 *   0 L   → 0.0  (pristine lake)
 *   10 L  → ~0.2 (slight haze)
 *   100 L → ~0.4 (sky warming)
 *   1K L  → ~0.6 (trees wilting)
 *   10K L → ~0.8 (lake half empty)
 *   100K+ → 1.0  (apocalypse)
 */
function litersToProgress(liters: number): number {
  if (liters <= 0) return 0
  // log10(1) = 0, log10(100_000) = 5 → normalize to 0–1
  const MIN_LOG = 0    // 10^0 = 1 L
  const MAX_LOG = 5    // 10^5 = 100,000 L
  const log = Math.log10(liters)
  return Math.min(Math.max((log - MIN_LOG) / (MAX_LOG - MIN_LOG), 0), 1)
}

/**
 * Estimates water usage from partial answers, filling in conservative defaults
 * for any question not yet answered. This lets the lake scene start updating
 * as soon as the user answers their first question.
 */
function estimateFromPartialAnswers(answers: WizardAnswers): number {
  if (answers.userType === 'power') {
    if (answers.powerPath === 'tokens') {
      return calculatePowerUserTokens({
        monthlyTokens: answers.monthlyTokens ?? 100_000,
        outputRatio: answers.outputRatio ?? 0.5,
        modelTier: answers.modelTier ?? 'mid',
        monthsActive: answers.monthsActive ?? 6,
      })
    }
    if (answers.powerPath === 'calls') {
      return calculatePowerUserCalls({
        callsPerDay: answers.callsPerDay ?? 100,
        callSize: answers.callSize ?? '3to5',
        modelTier: answers.modelTier ?? 'mid',
        monthsActive: answers.monthsActive ?? 6,
      })
    }
    // Power user selected but path not chosen yet — use a rough mid estimate
    // based on a typical developer: 1M tokens/month, mid-tier, 6 months
    return calculatePowerUserTokens({
      monthlyTokens: 1_000_000,
      outputRatio: 0.5,
      modelTier: 'mid',
      monthsActive: 6,
    })
  }

  if (answers.userType === 'regular') {
    return calculateRegularUser({
      tools: answers.tools ?? ['chatgpt'],
      frequencyPerWeek: answers.frequencyPerWeek ?? '3-4',
      sessionLength: answers.sessionLength ?? '15to30',
      conversationStyle: answers.conversationStyle ?? 'backforth',
      monthsActive: answers.monthsActive ?? 6,
    })
  }

  // No user type selected yet — return a small preview value so the scene
  // isn't completely static on the hero step
  const previewMessages = MESSAGES_PER_SESSION['15to30']
  const previewDays = 6 * 30 // 6 months
  return (
    previewMessages *
    FREQUENCY_MULTIPLIER['3-4'] *
    CONVERSATION_MULTIPLIER['backforth'] *
    previewDays *
    LITERS_PER_MESSAGE_BASELINE *
    MODEL_MULTIPLIER['mid']
  )
}

/**
 * Returns a 0–1 value representing how much of the lake has been "burned".
 * Recalculates whenever answers change. Used by LakeScene to drive
 * all color/position/opacity animations reactively.
 */
export function useBurnProgress(answers: WizardAnswers): number {
  return useMemo(() => {
    const liters = estimateFromPartialAnswers(answers)
    return litersToProgress(liters)
  }, [answers])
}

/** Exposed for testing */
export { litersToProgress, estimateFromPartialAnswers }
