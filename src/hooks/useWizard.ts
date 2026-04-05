import { useState, useCallback } from 'react'
import type {
  AiTool,
  ModelTier,
  FrequencyPerWeek,
  SessionLength,
  ConversationStyle,
  CallSize,
} from '../utils/calculator'

// ---------------------------------------------------------------------------
// Step model
// ---------------------------------------------------------------------------

export type WizardStep =
  | 'hero'
  | 'userType'
  | 'powerPathSelect'
  | 'questions'
  | 'loading'
  | 'results'

export type UserType = 'regular' | 'power'
export type PowerPath = 'tokens' | 'calls'

// ---------------------------------------------------------------------------
// Answers — one flat bag; fields are populated as the user proceeds
// ---------------------------------------------------------------------------

export interface WizardAnswers {
  userType?: UserType
  powerPath?: PowerPath

  // Regular user
  tools?: AiTool[]
  frequencyPerWeek?: FrequencyPerWeek
  sessionLength?: SessionLength
  conversationStyle?: ConversationStyle
  monthsActive?: number

  // Power user — tokens path
  monthlyTokens?: number
  outputRatio?: number   // 0.0–1.0

  // Power user — calls path
  callsPerDay?: number
  callSize?: CallSize

  // Shared for both power paths
  modelTier?: ModelTier
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface WizardState {
  step: WizardStep
  /** 1 = moving forward, -1 = moving backward (drives slide direction) */
  direction: 1 | -1
  answers: WizardAnswers
}

// ---------------------------------------------------------------------------
// Ordered step sequence helpers
// ---------------------------------------------------------------------------

function stepsFor(userType?: UserType): WizardStep[] {
  const base: WizardStep[] = ['hero', 'userType']
  if (userType === 'power') {
    return [...base, 'powerPathSelect', 'questions', 'loading', 'results']
  }
  return [...base, 'questions', 'loading', 'results']
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface WizardControls {
  step: WizardStep
  direction: 1 | -1
  answers: WizardAnswers
  /** Advance to the next logical step */
  next: () => void
  /** Go back one step */
  back: () => void
  /** Merge partial answers into state (call before next() or independently) */
  setAnswers: (partial: Partial<WizardAnswers>) => void
  /** Convenience: set + advance in one call */
  submitAndNext: (partial: Partial<WizardAnswers>) => void
  /** Reset everything back to hero */
  reset: () => void
  canGoBack: boolean
}

const INITIAL_STATE: WizardState = {
  step: 'hero',
  direction: 1,
  answers: {},
}

export function useWizard(): WizardControls {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)

  const setAnswers = useCallback((partial: Partial<WizardAnswers>) => {
    setState(prev => ({
      ...prev,
      answers: { ...prev.answers, ...partial },
    }))
  }, [])

  const next = useCallback(() => {
    setState(prev => {
      const steps = stepsFor(prev.answers.userType)
      const currentIndex = steps.indexOf(prev.step)
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1)
      return {
        ...prev,
        step: steps[nextIndex],
        direction: 1,
      }
    })
  }, [])

  const back = useCallback(() => {
    setState(prev => {
      const steps = stepsFor(prev.answers.userType)
      const currentIndex = steps.indexOf(prev.step)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return {
        ...prev,
        step: steps[prevIndex],
        direction: -1,
      }
    })
  }, [])

  const submitAndNext = useCallback((partial: Partial<WizardAnswers>) => {
    setState(prev => {
      const merged = { ...prev.answers, ...partial }
      const steps = stepsFor(merged.userType)
      const currentIndex = steps.indexOf(prev.step)
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1)
      return {
        answers: merged,
        step: steps[nextIndex],
        direction: 1,
      }
    })
  }, [])

  const reset = useCallback(() => {
    setState({ ...INITIAL_STATE })
  }, [])

  const canGoBack =
    state.step !== 'hero' &&
    state.step !== 'loading' &&
    state.step !== 'results'

  return {
    step: state.step,
    direction: state.direction,
    answers: state.answers,
    next,
    back,
    setAnswers,
    submitAndNext,
    reset,
    canGoBack,
  }
}
