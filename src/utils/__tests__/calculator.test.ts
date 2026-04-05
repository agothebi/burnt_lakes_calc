import { describe, it, expect } from 'vitest'
import {
  calculateRegularUser,
  calculatePowerUserTokens,
  calculatePowerUserCalls,
  formatResult,
  selectLakeUnit,
  outputRatioMultiplier,
  toolMultiplier,
  MODEL_MULTIPLIER,
  FREQUENCY_MULTIPLIER,
  MESSAGES_PER_SESSION,
  TOKENS_PER_CALL,
  ML_PER_1K_TOKENS,
} from '../calculator'

// ---------------------------------------------------------------------------
// Helper constants
// ---------------------------------------------------------------------------

describe('constants sanity checks', () => {
  it('all model multipliers are positive', () => {
    for (const v of Object.values(MODEL_MULTIPLIER)) expect(v).toBeGreaterThan(0)
  })

  it('frontier tier costs more than mid, mid more than small', () => {
    expect(MODEL_MULTIPLIER.frontier).toBeGreaterThan(MODEL_MULTIPLIER.mid)
    expect(MODEL_MULTIPLIER.mid).toBeGreaterThan(MODEL_MULTIPLIER.small)
  })

  it('daily frequency multiplier is highest', () => {
    expect(FREQUENCY_MULTIPLIER.daily).toBe(1.0)
    expect(FREQUENCY_MULTIPLIER['1-2']).toBeLessThan(FREQUENCY_MULTIPLIER['3-4'])
    expect(FREQUENCY_MULTIPLIER['3-4']).toBeLessThan(FREQUENCY_MULTIPLIER['5-6'])
    expect(FREQUENCY_MULTIPLIER['5-6']).toBeLessThan(FREQUENCY_MULTIPLIER.daily)
  })

  it('longer sessions produce more messages', () => {
    expect(MESSAGES_PER_SESSION.under15).toBeLessThan(MESSAGES_PER_SESSION['15to30'])
    expect(MESSAGES_PER_SESSION['15to30']).toBeLessThan(MESSAGES_PER_SESSION['30to60'])
    expect(MESSAGES_PER_SESSION['30to60']).toBeLessThan(MESSAGES_PER_SESSION['1to2h'])
    expect(MESSAGES_PER_SESSION['1to2h']).toBeLessThan(MESSAGES_PER_SESSION.over2h)
  })

  it('frontier uses more water per 1k tokens than smaller models', () => {
    expect(ML_PER_1K_TOKENS.frontier).toBeGreaterThan(ML_PER_1K_TOKENS.mid)
    expect(ML_PER_1K_TOKENS.mid).toBeGreaterThan(ML_PER_1K_TOKENS.small)
  })
})

// ---------------------------------------------------------------------------
// outputRatioMultiplier
// ---------------------------------------------------------------------------

describe('outputRatioMultiplier', () => {
  it('returns 0.3 at ratio=0 (all input)', () => {
    expect(outputRatioMultiplier(0)).toBeCloseTo(0.3)
  })

  it('returns 1.0 at ratio=0.5 (even split)', () => {
    expect(outputRatioMultiplier(0.5)).toBeCloseTo(1.0)
  })

  it('returns 3.0 at ratio=1.0 (all output)', () => {
    expect(outputRatioMultiplier(1.0)).toBeCloseTo(3.0)
  })

  it('is monotonically increasing', () => {
    const values = [0, 0.25, 0.5, 0.75, 1.0].map(outputRatioMultiplier)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1])
    }
  })
})

// ---------------------------------------------------------------------------
// toolMultiplier
// ---------------------------------------------------------------------------

describe('toolMultiplier', () => {
  it('returns 1.0 when no image AI tools', () => {
    expect(toolMultiplier(['chatgpt', 'claude'])).toBe(1.0)
  })

  it('returns 1.6 when image AI is included', () => {
    expect(toolMultiplier(['chatgpt', 'image-ai'])).toBe(1.6)
  })

  it('handles empty tools array', () => {
    expect(toolMultiplier([])).toBe(1.0)
  })
})

// ---------------------------------------------------------------------------
// calculateRegularUser
// ---------------------------------------------------------------------------

describe('calculateRegularUser', () => {
  const baseInput = {
    tools: ['chatgpt'] as const,
    frequencyPerWeek: 'daily' as const,
    sessionLength: '15to30' as const,
    conversationStyle: 'backforth' as const,
    monthsActive: 1,
  }

  it('returns a positive number of liters', () => {
    const result = calculateRegularUser(baseInput)
    expect(result).toBeGreaterThan(0)
  })

  it('base case: daily, 15-30min, back-and-forth, 1 month, mid-tier = reasonable range', () => {
    // 10 msgs/session × 1.0 (daily) × 1.0 (backforth) × 30 days × 0.100L × 1.0 (mid) × 1.0 (no img)
    // = 10 × 30 × 0.100 = 30 liters
    const result = calculateRegularUser(baseInput)
    expect(result).toBeCloseTo(30.0, 1)
  })

  it('more months → more water (proportional)', () => {
    const oneMonth = calculateRegularUser({ ...baseInput, monthsActive: 1 })
    const sixMonths = calculateRegularUser({ ...baseInput, monthsActive: 6 })
    expect(sixMonths).toBeCloseTo(oneMonth * 6, 5)
  })

  it('image AI tools increase total vs no image AI', () => {
    const withoutImg = calculateRegularUser({ ...baseInput, tools: ['chatgpt'] })
    const withImg = calculateRegularUser({ ...baseInput, tools: ['chatgpt', 'image-ai'] })
    expect(withImg).toBeGreaterThan(withoutImg)
  })

  it('longer sessions use more water', () => {
    const short = calculateRegularUser({ ...baseInput, sessionLength: 'under15' })
    const long = calculateRegularUser({ ...baseInput, sessionLength: 'over2h' })
    expect(long).toBeGreaterThan(short)
  })

  it('philosophical debates use more water than quick questions', () => {
    const quick = calculateRegularUser({ ...baseInput, conversationStyle: 'quick' })
    const debate = calculateRegularUser({ ...baseInput, conversationStyle: 'debate' })
    expect(debate).toBeGreaterThan(quick)
  })

  it('daily usage uses more water than 1-2 days/week', () => {
    const rare = calculateRegularUser({ ...baseInput, frequencyPerWeek: '1-2' })
    const daily = calculateRegularUser({ ...baseInput, frequencyPerWeek: 'daily' })
    expect(daily).toBeGreaterThan(rare)
  })

  it('minimum plausible usage is still > 0', () => {
    const result = calculateRegularUser({
      tools: ['other'],
      frequencyPerWeek: '1-2',
      sessionLength: 'under15',
      conversationStyle: 'quick',
      monthsActive: 1,
    })
    expect(result).toBeGreaterThan(0)
  })

  it('heavy user 2 years produces dramatic result', () => {
    const result = calculateRegularUser({
      tools: ['chatgpt', 'image-ai'],
      frequencyPerWeek: 'daily',
      sessionLength: 'over2h',
      conversationStyle: 'debate',
      monthsActive: 24,
    })
    // Should be thousands of liters
    expect(result).toBeGreaterThan(10_000)
  })
})

// ---------------------------------------------------------------------------
// calculatePowerUserTokens
// ---------------------------------------------------------------------------

describe('calculatePowerUserTokens', () => {
  const baseInput = {
    monthlyTokens: 1_000_000,
    outputRatio: 0.5,
    modelTier: 'mid' as const,
    monthsActive: 1,
  }

  it('returns a positive number of liters', () => {
    expect(calculatePowerUserTokens(baseInput)).toBeGreaterThan(0)
  })

  it('base case: 1M tokens, mid-tier, even split, 1 month', () => {
    // 1_000_000 tokens × (10.0mL / 1000) × 1.0 (outputMult at 0.5) × 1 / 1000 (mL→L)
    // = 1_000_000 × 0.010mL × 1.0 / 1000 = 10 liters
    const result = calculatePowerUserTokens(baseInput)
    expect(result).toBeCloseTo(10.0, 3)
  })

  it('frontier tier uses more water than mid for same tokens', () => {
    const mid = calculatePowerUserTokens({ ...baseInput, modelTier: 'mid' })
    const frontier = calculatePowerUserTokens({ ...baseInput, modelTier: 'frontier' })
    expect(frontier).toBeGreaterThan(mid)
  })

  it('all-output tokens use more water than all-input', () => {
    const allInput = calculatePowerUserTokens({ ...baseInput, outputRatio: 0 })
    const allOutput = calculatePowerUserTokens({ ...baseInput, outputRatio: 1 })
    expect(allOutput).toBeGreaterThan(allInput)
  })

  it('all-output (ratio=1) is 10× more than all-input (ratio=0)', () => {
    // 3.0 / 0.3 = 10×
    const allInput = calculatePowerUserTokens({ ...baseInput, outputRatio: 0 })
    const allOutput = calculatePowerUserTokens({ ...baseInput, outputRatio: 1 })
    expect(allOutput / allInput).toBeCloseTo(10.0, 3)
  })

  it('scales linearly with months', () => {
    const oneMonth = calculatePowerUserTokens({ ...baseInput, monthsActive: 1 })
    const twelveMonths = calculatePowerUserTokens({ ...baseInput, monthsActive: 12 })
    expect(twelveMonths).toBeCloseTo(oneMonth * 12, 5)
  })

  it('10M tokens/month frontier user for 2 years = significant water', () => {
    const result = calculatePowerUserTokens({
      monthlyTokens: 10_000_000,
      outputRatio: 0.7,
      modelTier: 'frontier',
      monthsActive: 24,
    })
    expect(result).toBeGreaterThan(1_000)
  })
})

// ---------------------------------------------------------------------------
// calculatePowerUserCalls
// ---------------------------------------------------------------------------

describe('calculatePowerUserCalls', () => {
  const baseInput = {
    callsPerDay: 100,
    callSize: '3to5' as const,
    modelTier: 'mid' as const,
    monthsActive: 1,
  }

  it('returns a positive number of liters', () => {
    expect(calculatePowerUserCalls(baseInput)).toBeGreaterThan(0)
  })

  it('full conversation calls use more water than single exchange', () => {
    const single = calculatePowerUserCalls({ ...baseInput, callSize: 'single' })
    const full = calculatePowerUserCalls({ ...baseInput, callSize: 'full' })
    expect(full).toBeGreaterThan(single)
  })

  it('10K calls/day at full conversation size is significant', () => {
    const result = calculatePowerUserCalls({
      callsPerDay: 10_000,
      callSize: 'full',
      modelTier: 'frontier',
      monthsActive: 12,
    })
    expect(result).toBeGreaterThan(10_000)
  })

  it('token count is correctly derived from calls', () => {
    // 100 calls/day × 30 days × 3000 tokens/call = 9,000,000 monthly tokens
    const callsResult = calculatePowerUserCalls({
      callsPerDay: 100,
      callSize: '3to5',
      modelTier: 'mid',
      monthsActive: 1,
    })
    const tokenResult = calculatePowerUserTokens({
      monthlyTokens: 100 * 30 * TOKENS_PER_CALL['3to5'],
      outputRatio: 0.5,
      modelTier: 'mid',
      monthsActive: 1,
    })
    expect(callsResult).toBeCloseTo(tokenResult, 5)
  })
})

// ---------------------------------------------------------------------------
// selectLakeUnit
// ---------------------------------------------------------------------------

describe('selectLakeUnit', () => {
  it('tiny amounts map to bathtubs', () => {
    expect(selectLakeUnit(25).singular).toBe('bathtub')
  })

  it('moderate amounts map to backyard pools or Olympic pools', () => {
    const unit = selectLakeUnit(50_000)
    expect(['backyard pool', 'Olympic swimming pool']).toContain(unit.singular)
  })

  it('large amounts map to small lakes', () => {
    expect(selectLakeUnit(1_000_000_000).singular).toBe('large lake')
  })

  it('returns a unit for very small amounts', () => {
    const unit = selectLakeUnit(1)
    expect(unit).toBeDefined()
  })

  it('lake equivalent < 1 is still displayable', () => {
    // 50L → well under a bathtub (2500L), so 50/2500 = 0.02 bathtubs
    const unit = selectLakeUnit(50)
    const equivalent = 50 / unit.liters
    expect(equivalent).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// formatResult
// ---------------------------------------------------------------------------

describe('formatResult', () => {
  it('returns all required fields', () => {
    const result = formatResult(1_000)
    expect(result).toHaveProperty('totalLiters')
    expect(result).toHaveProperty('lakeEquivalent')
    expect(result).toHaveProperty('lakeUnit')
    expect(result).toHaveProperty('comparisons')
  })

  it('totalLiters matches input', () => {
    expect(formatResult(5_000).totalLiters).toBe(5_000)
  })

  it('comparisons array is non-empty', () => {
    expect(formatResult(1_000).comparisons.length).toBeGreaterThan(0)
  })

  it('bathtub comparison is correct', () => {
    const result = formatResult(5_000)
    const bathtubComp = result.comparisons.find(c => c.label === 'bathtubs')
    // 5000 / 2500 = 2 bathtubs
    expect(bathtubComp?.value).toBeCloseTo(2, 1)
  })

  it('drinking water comparison is correct', () => {
    const result = formatResult(1_000)
    const drinkComp = result.comparisons.find(c => c.label === 'daily drinking water')
    // 1000 / 2 = 500
    expect(drinkComp?.value).toBe(500)
  })

  it('lakeEquivalent is totalLiters / selected unit size', () => {
    const liters = 3_000_000
    const result = formatResult(liters)
    const unit = selectLakeUnit(liters)
    expect(result.lakeEquivalent).toBeCloseTo(liters / unit.liters, 5)
  })
})

// ---------------------------------------------------------------------------
// Integration: end-to-end calculation scenarios
// ---------------------------------------------------------------------------

describe('end-to-end scenarios', () => {
  it('casual user for 1 year produces a plausible result', () => {
    const liters = calculateRegularUser({
      tools: ['chatgpt'],
      frequencyPerWeek: '3-4',
      sessionLength: '15to30',
      conversationStyle: 'backforth',
      monthsActive: 12,
    })
    const result = formatResult(liters)
    expect(result.totalLiters).toBeGreaterThan(100)
    expect(result.totalLiters).toBeLessThan(1_000_000)
    expect(result.lakeEquivalent).toBeGreaterThan(0)
  })

  it('enterprise dev with 10M tokens/month for 2 years = dramatic result', () => {
    // 10M × (25mL/1000) × 1.8 (outputMult at 0.7) × 24 / 1000 = 10,800 L
    const liters = calculatePowerUserTokens({
      monthlyTokens: 10_000_000,
      outputRatio: 0.7,
      modelTier: 'frontier',
      monthsActive: 24,
    })
    const result = formatResult(liters)
    expect(result.totalLiters).toBeGreaterThan(10_000)
    expect(result.lakeEquivalent).toBeGreaterThan(0)
    expect(result.lakeUnit).toBeDefined()
  })

  it('light API user for 3 months = modest result', () => {
    const liters = calculatePowerUserCalls({
      callsPerDay: 50,
      callSize: 'single',
      modelTier: 'small',
      monthsActive: 3,
    })
    const result = formatResult(liters)
    expect(result.totalLiters).toBeGreaterThan(0)
    expect(result.lakeUnit).toBeDefined()
  })
})
