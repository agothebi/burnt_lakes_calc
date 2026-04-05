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
export type AiTool = 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'perplexity' | 'image-gen' | 'other'

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
  lakes: number
  reactionLine: string
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
 * Represents direct on-site data center cooling water only.
 * Source: Li et al. (2023) estimates ~10–25mL per exchange for on-site cooling;
 * we use 10mL as the conservative low-end of that range.
 */
export const LITERS_PER_MESSAGE_BASELINE = 0.010

/**
 * Water per 1000 tokens in mL, by model tier.
 * Direct on-site cooling estimate. Frontier models run on larger GPU
 * clusters with higher power draw, resulting in proportionally more water.
 */
export const ML_PER_1K_TOKENS: Record<ModelTier, number> = {
  small: 1.0,
  mid:   2.5,
  frontier: 6.0,
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
  quick: 0.5,
  backforth: 1.0,
  long: 1.3,
  debate: 1.6,
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
 * Tool multiplier — image generation is GPU-heavy and adds significant overhead.
 * If the user uses image generation tools, apply a multiplier to their total.
 */
export function toolMultiplier(tools: AiTool[] | readonly AiTool[]): number {
  return tools.includes('image-gen') ? 1.6 : 1.0
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

  // Infer model tier: image generation implies heavier GPU compute
  const inferredTier: ModelTier = input.tools.includes('image-gen') ? 'frontier' : 'mid'
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

/**
 * A "lake" is defined as a small natural lake (~50,000 liters / 50 kL).
 * This gives satisfying numbers: casual users burn small fractions,
 * heavy users approach a lake, power devs burn several.
 */
export const LITERS_PER_LAKE = 200_000

function getReactionLine(lakes: number): string {
  if (lakes < 0.005)  return 'Barely a splash. For now.'
  if (lakes < 0.02)   return 'The fish have noticed.'
  if (lakes < 0.1)    return 'The waterline is measurably lower.'
  if (lakes < 0.5)    return 'A meaningful chunk of a lake, gone.'
  if (lakes < 1)      return 'Almost a whole lake. Almost.'
  if (lakes < 2)      return 'One whole lake. The ducks are furious.'
  if (lakes < 5)      return 'Multiple lakes. The ducks have filed a complaint.'
  if (lakes < 20)     return 'A regional aquatic incident.'
  if (lakes < 100)    return 'You are the drought.'
  return 'Scientists are naming the dry basin after you.'
}

export function formatResult(totalLiters: number): CalculationResult {
  const lakes = totalLiters / LITERS_PER_LAKE

  const comparisons: Comparison[] = [
    {
      label: 'showers',
      // Average shower uses ~65L
      value: Math.round(totalLiters / 65),
      unit: 'showers',
    },
    {
      label: 'Olympic pools',
      // Olympic swimming pool = 2,500,000 liters
      value: +(totalLiters / 2_500_000).toFixed(6),
      unit: 'Olympic swimming pools',
    },
  ]

  return {
    totalLiters,
    lakes,
    reactionLine: getReactionLine(lakes),
    comparisons,
  }
}
