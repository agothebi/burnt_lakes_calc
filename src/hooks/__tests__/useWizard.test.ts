import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useWizard } from '../useWizard'

// renderHook needs a React environment — set jsdom in vite.config.ts
// For now we test the pure step-sequencing logic separately.

// ---------------------------------------------------------------------------
// Step sequencing (pure logic, extracted for unit testing without hooks)
// ---------------------------------------------------------------------------

// Re-test the step sequence logic by calling the hook directly.
// We use renderHook so React's useState works.

describe('useWizard — initial state', () => {
  it('starts on the hero step', () => {
    const { result } = renderHook(() => useWizard())
    expect(result.current.step).toBe('hero')
  })

  it('starts with empty answers', () => {
    const { result } = renderHook(() => useWizard())
    expect(result.current.answers).toEqual({})
  })

  it('canGoBack is false on hero', () => {
    const { result } = renderHook(() => useWizard())
    expect(result.current.canGoBack).toBe(false)
  })
})

describe('useWizard — navigation (regular user path)', () => {
  it('hero → userType on next()', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    expect(result.current.step).toBe('userType')
  })

  it('direction is 1 after next()', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    expect(result.current.direction).toBe(1)
  })

  it('regular user full path: hero → userType → questions → loading → results', () => {
    const { result } = renderHook(() => useWizard())

    // hero → userType
    act(() => result.current.next())
    expect(result.current.step).toBe('userType')

    // userType → questions (selecting regular)
    act(() => result.current.submitAndNext({ userType: 'regular' }))
    expect(result.current.step).toBe('questions')

    act(() => result.current.next())
    expect(result.current.step).toBe('loading')

    act(() => result.current.next())
    expect(result.current.step).toBe('results')
  })

  it('does NOT include powerPathSelect for regular users', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    act(() => result.current.submitAndNext({ userType: 'regular' }))
    // After selecting regular, we land on 'questions', not 'powerPathSelect'
    expect(result.current.step).not.toBe('powerPathSelect')
  })
})

describe('useWizard — navigation (power user path)', () => {
  it('power user path includes powerPathSelect before questions', () => {
    const { result } = renderHook(() => useWizard())

    // hero → userType
    act(() => result.current.next())
    // userType → powerPathSelect (selecting power)
    act(() => result.current.submitAndNext({ userType: 'power' }))
    expect(result.current.step).toBe('powerPathSelect')

    act(() => result.current.next())
    expect(result.current.step).toBe('questions')
  })

  it('full power user path: hero → userType → powerPathSelect → questions → loading → results', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())                                   // → userType
    act(() => result.current.submitAndNext({ userType: 'power' }))    // → powerPathSelect
    act(() => result.current.next())                                   // → questions
    act(() => result.current.next())                                   // → loading
    act(() => result.current.next())                                   // → results
    expect(result.current.step).toBe('results')
  })
})

describe('useWizard — back navigation', () => {
  it('back() reverses direction', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    act(() => result.current.back())
    expect(result.current.direction).toBe(-1)
  })

  it('back() from userType returns to hero', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    expect(result.current.step).toBe('userType')
    act(() => result.current.back())
    expect(result.current.step).toBe('hero')
  })

  it('cannot go back past hero', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.back())
    expect(result.current.step).toBe('hero')
  })

  it('canGoBack is true on userType', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    expect(result.current.canGoBack).toBe(true)
  })

  it('canGoBack is false on loading step', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())                                    // → userType
    act(() => result.current.submitAndNext({ userType: 'regular' }))   // → questions
    act(() => result.current.next())                                    // → loading
    expect(result.current.step).toBe('loading')
    expect(result.current.canGoBack).toBe(false)
  })

  it('canGoBack is false on results step', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())
    act(() => result.current.submitAndNext({ userType: 'regular' }))
    act(() => result.current.next())
    act(() => result.current.next())
    expect(result.current.step).toBe('results')
    expect(result.current.canGoBack).toBe(false)
  })
})

describe('useWizard — setAnswers & submitAndNext', () => {
  it('setAnswers merges into existing answers', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.setAnswers({ userType: 'regular' }))
    act(() => result.current.setAnswers({ monthsActive: 12 }))
    expect(result.current.answers.userType).toBe('regular')
    expect(result.current.answers.monthsActive).toBe(12)
  })

  it('submitAndNext saves answers AND advances step', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.next())                                    // → userType
    act(() => result.current.submitAndNext({ userType: 'regular' }))   // → questions
    expect(result.current.answers.userType).toBe('regular')
    expect(result.current.step).toBe('questions')
  })

  it('later setAnswers do not overwrite earlier ones', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.setAnswers({ userType: 'regular', monthsActive: 6 }))
    act(() => result.current.setAnswers({ frequencyPerWeek: 'daily' }))
    expect(result.current.answers.userType).toBe('regular')
    expect(result.current.answers.monthsActive).toBe(6)
    expect(result.current.answers.frequencyPerWeek).toBe('daily')
  })
})

describe('useWizard — reset', () => {
  it('reset returns to hero with empty answers', () => {
    const { result } = renderHook(() => useWizard())
    act(() => result.current.submitAndNext({ userType: 'regular' }))
    act(() => result.current.setAnswers({ monthsActive: 24 }))
    act(() => result.current.reset())
    expect(result.current.step).toBe('hero')
    expect(result.current.answers).toEqual({})
    expect(result.current.direction).toBe(1)
  })
})
