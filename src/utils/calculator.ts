/**
 * Lakes Burned Calculator — Core Calculation Engine
 *
 * Water usage estimates are based on:
 * - Li et al. (2023) "Making AI Less 'Thirsty'" (UC Riverside)
 *   https://arxiv.org/abs/2304.03271
 * - Microsoft water usage disclosures (2022–2023)
 *
 * Baseline: ~500ml per 20–50 exchanges with a GPT-3.5-class model
 * → ~20ml per message exchange (mid-point estimate)
 *
 * Output tokens are ~4× more compute-intensive than input tokens,
 * so output ratio significantly affects per-token water cost.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ModelTier = 'small' | 'mid' | 'frontier'
export type FrequencyPerWeek = '1-2' | '3-4' | '5-6' | 'daily'
export type SessionLength = 'under15' | '15to30' | '30to60' | '1to2h' | 'over2h'
export type ConversationStyle = 'quick' | 'backforth' | 'long' | 'debate'
export type CallSize = 'single' | '3to5' | '10plus' | 'full'
export type AiTool = 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'perplexity' | 'image-ai' | 'other'

export interface RegularUserInput {
  tools: AiTool[] | readonly AiTool[]
  frequencyPerWeek: FrequencyPerWeek
  sessionLength: SessionLength
  conversationStyle: ConversationStyle
  monthsActive: number
}

export interface PowerUserTokenInput {
  monthlyTokens: number
  outputRatio: number  // 0.0 = all input, 1.0 = all output
  modelTier: ModelTier
  monthsActive: number
}

export interface PowerUserCallsInput {
  callsPerDay: number
  callSize: CallSize
  modelTier: ModelTier
  monthsActive: number
}

export interface CalculationResult {
  totalLiters: number
  lakeEquivalent: number
  lakeUnit: string
  comparisons: Comparison[]
}

export interface Comparison {
  label: string
  value: number
  unit: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Baseline water per message exchange in liters (GPT-3.5-class, mid-tier).
 * Reflects total data center water footprint: direct cooling + humidification
 * + water used to generate electricity (~5× direct-cooling-only estimates).
 * Source range: 10–250ml/message across published studies; we use 100ml as a
 * conservative total-footprint mid-point.
 */
export const LITERS_PER_MESSAGE_BASELINE = 0.100

/**
 * Water per 1000 tokens in mL, by model tier.
 * Total footprint (direct + indirect). Frontier models run on larger GPU
 * clusters with higher power draw, resulting in proportionally more water.
 */
export const ML_PER_1K_TOKENS: Record<ModelTier, number> = {
  small: 4.0,
  mid: 10.0,
  frontier: 25.0,
}

/** Model tier multiplier applied to message-based paths */
export const MODEL_MULTIPLIER: Record<ModelTier, number> = {
  small: 0.6,
  mid: 1.0,
  frontier: 1.8,
}

/** Fraction of days per week that map to an active multiplier */
export const FREQUENCY_MULTIPLIER: Record<FrequencyPerWeek, number> = {
  '1-2': 0.25,
  '3-4': 0.50,
  '5-6': 0.85,
  'daily': 1.00,
}

/** Estimated messages per active session */
export const MESSAGES_PER_SESSION: Record<SessionLength, number> = {
  under15: 4,
  '15to30': 10,
  '30to60': 22,
  '1to2h': 45,
  over2h: 80,
}

/** Conversation depth multiplier */
export const CONVERSATION_MULTIPLIER: Record<ConversationStyle, number> = {
  quick: 0.4,
  backforth: 1.0,
  long: 1.6,
  debate: 2.5,
}

/** Average tokens per API call by call size */
export const TOKENS_PER_CALL: Record<CallSize, number> = {
  single: 800,
  '3to5': 3_000,
  '10plus': 12_000,
  full: 30_000,
}

/**
 * Output ratio multiplier range.
 * outputRatio 0.0 → 0.3× (nearly all input tokens, cheap)
 * outputRatio 0.5 → 1.0× (even mix, baseline)
 * outputRatio 1.0 → 3.0× (nearly all output tokens, expensive)
 */
export function outputRatioMultiplier(ratio: number): number {
  // Linear interpolation: 0→0.3, 0.5→1.0, 1.0→3.0
  if (ratio <= 0.5) {
    return 0.3 + (ratio / 0.5) * 0.7
  }
  return 1.0 + ((ratio - 0.5) / 0.5) * 2.0
}

/**
 * Tool multiplier — image AI is GPU-heavy and adds significant overhead.
 * If the user uses image AI tools, apply a multiplier to their total.
 */
export function toolMultiplier(tools: AiTool[] | readonly AiTool[]): number {
  return tools.includes('image-ai') ? 1.6 : 1.0
}

// ---------------------------------------------------------------------------
// Path 1 — Regular User
// ---------------------------------------------------------------------------

/**
 * Calculate total water usage (liters) for a regular casual user.
 *
 * Formula:
 *   messages_per_day = messages_per_session × frequency_multiplier × conversation_multiplier
 *   active_days = monthsActive × 30
 *   total_liters = messages_per_day × active_days × LITERS_PER_MESSAGE_BASELINE
 *                  × model_multiplier × tool_multiplier
 *
 * Model tier is inferred from the tools used (image AI → frontier GPU pressure,
 * otherwise mid as a conservative default for casual users).
 */
export function calculateRegularUser(input: RegularUserInput): number {
  const messagesPerSession = MESSAGES_PER_SESSION[input.sessionLength]
  const freqMult = FREQUENCY_MULTIPLIER[input.frequencyPerWeek]
  const convMult = CONVERSATION_MULTIPLIER[input.conversationStyle]
  const toolMult = toolMultiplier(input.tools)

  // Infer model tier: image AI implies heavier GPU compute
  const inferredTier: ModelTier = input.tools.includes('image-ai') ? 'frontier' : 'mid'
  const modelMult = MODEL_MULTIPLIER[inferredTier]

  const messagesPerDay = messagesPerSession * freqMult * convMult
  const activeDays = input.monthsActive * 30

  return messagesPerDay * activeDays * LITERS_PER_MESSAGE_BASELINE * modelMult * toolMult
}

// ---------------------------------------------------------------------------
// Path 2a — Power User (tokens)
// ---------------------------------------------------------------------------

/**
 * Calculate total water usage (liters) for a token-aware power user.
 *
 * Formula:
 *   water_per_token_mL = ML_PER_1K_TOKENS[tier] / 1000
 *   total_liters = monthly_tokens × water_per_token_mL
 *                  × output_ratio_multiplier × months / 1000
 *                  (÷1000 converts mL → L)
 */
export function calculatePowerUserTokens(input: PowerUserTokenInput): number {
  const mlPer1k = ML_PER_1K_TOKENS[input.modelTier]
  const mlPerToken = mlPer1k / 1_000
  const outputMult = outputRatioMultiplier(input.outputRatio)

  const totalMl = input.monthlyTokens * mlPerToken * outputMult * input.monthsActive
  return totalMl / 1_000 // mL → L
}

// ---------------------------------------------------------------------------
// Path 2b — Power User (API calls)
// ---------------------------------------------------------------------------

/**
 * Calculate total water usage (liters) for a power user who tracks API calls.
 * Converts calls → estimated tokens, then uses the token formula.
 */
export function calculatePowerUserCalls(input: PowerUserCallsInput): number {
  const tokensPerCall = TOKENS_PER_CALL[input.callSize]
  const monthlyTokens = input.callsPerDay * 30 * tokensPerCall

  return calculatePowerUserTokens({
    monthlyTokens,
    // API devs tend toward a roughly even input/output split
    outputRatio: 0.5,
    modelTier: input.modelTier,
    monthsActive: input.monthsActive,
  })
}

// ---------------------------------------------------------------------------
// Result formatting
// ---------------------------------------------------------------------------

interface LakeUnit {
  liters: number
  singular: string
  plural: string
}

const LAKE_UNITS: LakeUnit[] = [
  { liters: 2_500,           singular: 'bathtub',              plural: 'bathtubs' },
  { liters: 25_000,          singular: 'backyard pool',        plural: 'backyard pools' },
  { liters: 2_500_000,       singular: 'Olympic swimming pool', plural: 'Olympic swimming pools' },
  { liters: 500_000_000,     singular: 'small lake',           plural: 'small lakes' },
  { liters: 4_800_000_000,   singular: 'large lake',           plural: 'large lakes' },
]

/**
 * Pick the most dramatic-but-comprehensible lake unit for the given liter count.
 * We want a number between 0.01 and ~1000 for readability.
 */
export function selectLakeUnit(liters: number): LakeUnit {
  for (let i = LAKE_UNITS.length - 1; i >= 0; i--) {
    if (liters / LAKE_UNITS[i].liters >= 0.01) {
      return LAKE_UNITS[i]
    }
  }
  return LAKE_UNITS[0]
}

export function formatResult(totalLiters: number): CalculationResult {
  const unit = selectLakeUnit(totalLiters)
  const lakeEquivalent = totalLiters / unit.liters

  const comparisons: Comparison[] = [
    {
      label: 'bathtubs',
      value: Math.round(totalLiters / 2_500 * 10) / 10,
      unit: totalLiters / 2_500 === 1 ? 'bathtub' : 'bathtubs',
    },
    {
      label: 'daily drinking water',
      // Average human drinks ~2L/day
      value: Math.round(totalLiters / 2),
      unit: 'person-days of drinking water',
    },
    {
      label: 'toilet flushes',
      // Average flush ~6L
      value: Math.round(totalLiters / 6),
      unit: 'toilet flushes',
    },
  ]

  return {
    totalLiters,
    lakeEquivalent,
    lakeUnit: lakeEquivalent === 1 ? unit.singular : unit.plural,
    comparisons,
  }
}
