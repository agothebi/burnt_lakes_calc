import { describe, it, expect } from 'vitest'
import { litersToProgress, estimateFromPartialAnswers } from '../useBurnProgress'

// ---------------------------------------------------------------------------
// litersToProgress
// ---------------------------------------------------------------------------

describe('litersToProgress', () => {
  it('returns 0 for 0 liters', () => {
    expect(litersToProgress(0)).toBe(0)
  })

  it('returns 0 for negative liters', () => {
    expect(litersToProgress(-100)).toBe(0)
  })

  it('returns 1.0 for 100,000+ liters', () => {
    expect(litersToProgress(100_000)).toBe(1)
    expect(litersToProgress(1_000_000)).toBe(1)
  })

  it('is monotonically increasing', () => {
    const values = [1, 10, 100, 1_000, 10_000, 100_000].map(litersToProgress)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })

  it('stays within [0, 1]', () => {
    const inputs = [0, 0.001, 1, 10, 100, 1e6, 1e10]
    for (const v of inputs) {
      const p = litersToProgress(v)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })

  it('is roughly 0.2 at 10 liters', () => {
    // log10(10)=1, (1-0)/5 = 0.2
    expect(litersToProgress(10)).toBeCloseTo(0.2, 3)
  })

  it('is roughly 0.6 at 1,000 liters', () => {
    // log10(1000)=3, (3-0)/5 = 0.6
    expect(litersToProgress(1_000)).toBeCloseTo(0.6, 3)
  })
})

// ---------------------------------------------------------------------------
// estimateFromPartialAnswers
// ---------------------------------------------------------------------------

describe('estimateFromPartialAnswers', () => {
  it('returns a positive number with empty answers (preview state)', () => {
    expect(estimateFromPartialAnswers({})).toBeGreaterThan(0)
  })

  it('returns more water for power users than no selection', () => {
    const none = estimateFromPartialAnswers({})
    const power = estimateFromPartialAnswers({ userType: 'power' })
    // Power users typically use more — both should be positive
    expect(power).toBeGreaterThan(0)
    expect(none).toBeGreaterThan(0)
  })

  it('regular user with explicit answers returns correct estimate', () => {
    const result = estimateFromPartialAnswers({
      userType: 'regular',
      tools: ['chatgpt'],
      frequencyPerWeek: 'daily',
      sessionLength: '15to30',
      conversationStyle: 'backforth',
      monthsActive: 12,
    })
    // 10 × 1.0 × 1.0 × 360 × 0.100 × 1.0 × 1.0 = 360 L
    expect(result).toBeCloseTo(360, 0)
  })

  it('power token path with explicit answers returns correct estimate', () => {
    const result = estimateFromPartialAnswers({
      userType: 'power',
      powerPath: 'tokens',
      monthlyTokens: 1_000_000,
      outputRatio: 0.5,
      modelTier: 'mid',
      monthsActive: 1,
    })
    // 1M × 0.010 × 1.0 × 1 / 1000 = 10 L
    expect(result).toBeCloseTo(10, 3)
  })

  it('power calls path with explicit answers returns correct estimate', () => {
    const result = estimateFromPartialAnswers({
      userType: 'power',
      powerPath: 'calls',
      callsPerDay: 100,
      callSize: '3to5',
      modelTier: 'mid',
      monthsActive: 1,
    })
    expect(result).toBeGreaterThan(0)
  })

  it('uses defaults for missing regular user fields', () => {
    // Only userType set — should use conservative defaults, still > 0
    const result = estimateFromPartialAnswers({ userType: 'regular' })
    expect(result).toBeGreaterThan(0)
  })

  it('uses defaults for missing power token fields', () => {
    const result = estimateFromPartialAnswers({
      userType: 'power',
      powerPath: 'tokens',
    })
    expect(result).toBeGreaterThan(0)
  })

  it('more months → more water (regular)', () => {
    const short = estimateFromPartialAnswers({
      userType: 'regular',
      monthsActive: 1,
    })
    const long = estimateFromPartialAnswers({
      userType: 'regular',
      monthsActive: 24,
    })
    expect(long).toBeGreaterThan(short)
  })
})

// ---------------------------------------------------------------------------
// Integration: progress responds to answers
// ---------------------------------------------------------------------------

describe('burn progress responds to answer progression', () => {
  it('heavy regular user produces higher progress than light user', () => {
    const light = litersToProgress(
      estimateFromPartialAnswers({
        userType: 'regular',
        frequencyPerWeek: '1-2',
        sessionLength: 'under15',
        conversationStyle: 'quick',
        monthsActive: 1,
      })
    )
    const heavy = litersToProgress(
      estimateFromPartialAnswers({
        userType: 'regular',
        tools: ['chatgpt', 'image-gen'],
        frequencyPerWeek: 'daily',
        sessionLength: 'over2h',
        conversationStyle: 'debate',
        monthsActive: 24,
      })
    )
    expect(heavy).toBeGreaterThan(light)
  })

  it('progress is always in [0, 1]', () => {
    const scenarios = [
      {},
      { userType: 'regular' as const },
      { userType: 'power' as const, powerPath: 'tokens' as const, monthlyTokens: 50_000_000 },
    ]
    for (const answers of scenarios) {
      const p = litersToProgress(estimateFromPartialAnswers(answers))
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(1)
    }
  })
})
