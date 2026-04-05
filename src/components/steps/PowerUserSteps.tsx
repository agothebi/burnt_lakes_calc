import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ClayButton } from '../ui/ClayButton'
import { ClaySlider, LabeledRangeSlider } from '../ui/ClaySlider'
import { BackButton } from './shared/BackButton'
import { QuestionProgress } from './shared/QuestionProgress'
import { PillGroup } from './shared/PillGroup'
import type { WizardControls } from '../../hooks/useWizard'
import type { ModelTier, CallSize } from '../../utils/calculator'

const MODEL_OPTIONS: { value: ModelTier; label: string }[] = [
  { value: 'small',    label: 'Small / fast  (GPT-3.5, Haiku, Flash)' },
  { value: 'mid',      label: 'Mid-tier  (GPT-4o, Sonnet, Pro)' },
  { value: 'frontier', label: 'Frontier  (GPT-4, Opus, Ultra)' },
]

const CALL_SIZE_OPTIONS: { value: CallSize; label: string }[] = [
  { value: 'single',  label: 'Single exchange' },
  { value: '3to5',    label: '3–5 messages' },
  { value: '10plus',  label: '10+ messages' },
  { value: 'full',    label: 'Full conversations' },
]

const CALLS_PER_DAY_OPTIONS = [
  { value: 50,     label: '< 100 / day' },
  { value: 500,    label: '100–1K / day' },
  { value: 5000,   label: '1K–10K / day' },
  { value: 25000,  label: '10K+ / day' },
]

const TOKEN_PRESET_OPTIONS = [
  { value: 50_000,      label: '< 100K / mo' },
  { value: 500_000,     label: '100K–1M / mo' },
  { value: 5_000_000,   label: '1M–10M / mo' },
  { value: 25_000_000,  label: '10M+ / mo' },
]

const MONTH_LABELS: Record<number, string> = {
  1: 'Just started', 6: '6 months', 12: '1 year', 24: '2 years', 36: '3+ years',
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function PowerUserSteps({ wizard }: { wizard: WizardControls }) {
  const isTokenPath = wizard.answers.powerPath === 'tokens'
  const [q, setQ] = useState(0)
  const [dir, setDir] = useState(1)

  const [monthlyTokens, setMonthlyTokens] = useState(wizard.answers.monthlyTokens ?? 500_000)
  const [outputRatio, setOutputRatio] = useState(wizard.answers.outputRatio ?? 0.5)
  const [callsPerDay, setCallsPerDay] = useState(wizard.answers.callsPerDay ?? 500)
  const [callSize, setCallSize] = useState<CallSize | null>(wizard.answers.callSize ?? null)
  const [modelTier, setModelTier] = useState<ModelTier | null>(wizard.answers.modelTier ?? null)
  const [months, setMonths] = useState(wizard.answers.monthsActive ?? 12)

  const TOTAL = 4

  function advance() {
    setDir(1)
    if (q < TOTAL - 1) {
      setQ(q + 1)
    } else {
      wizard.setAnswers({
        monthlyTokens, outputRatio, callsPerDay,
        callSize: callSize ?? '3to5',
        modelTier: modelTier ?? 'mid',
        monthsActive: months,
      })
      wizard.next()
    }
  }

  function goBack() {
    if (q === 0) { wizard.back(); return }
    setDir(-1)
    setQ(q - 1)
  }

  function selectModelAndAdvance(value: ModelTier) {
    setModelTier(value)
    wizard.setAnswers({ modelTier: value })
    setTimeout(() => { setDir(1); setQ(q + 1) }, 220)
  }

  function selectCallSizeAndAdvance(value: CallSize) {
    setCallSize(value)
    wizard.setAnswers({ callSize: value })
    setTimeout(() => { setDir(1); setQ(q + 1) }, 220)
  }

  const tokenQuestions = [
    {
      heading: 'Roughly how many tokens per month?',
      subheading: 'Input + output combined. Check your API dashboard.',
      canContinue: true,
      content: (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {TOKEN_PRESET_OPTIONS.map(opt => (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => { setMonthlyTokens(opt.value); wizard.setAnswers({ monthlyTokens: opt.value }) }}
                className="rounded-2xl px-4 py-2 font-body font-bold text-sm text-[#1A1A2E] cursor-pointer border-none select-none"
                style={{
                  background: monthlyTokens === opt.value
                    ? 'linear-gradient(160deg, #FFE878, #FFD93D)'
                    : 'linear-gradient(160deg, #FFF8EE, #FFF0D6)',
                  boxShadow: monthlyTokens === opt.value
                    ? '0 5px 0 0 #C9A400, inset 0 2px 4px rgba(255,255,255,0.55)'
                    : '0 5px 0 0 #D4A96A, inset 0 2px 4px rgba(255,255,255,0.55)',
                }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ y: 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
          <p className="font-body text-xs text-[#1A1A2E]/40">
            Selected: ~{monthlyTokens.toLocaleString()} tokens / month
          </p>
        </div>
      ),
    },
    {
      heading: "What's your input/output split?",
      subheading: 'Output tokens cost more compute — and more water.',
      canContinue: true,
      content: (
        <LabeledRangeSlider
          value={outputRatio}
          onChange={v => { setOutputRatio(v); wizard.setAnswers({ outputRatio: v }) }}
          leftLabel="Mostly input (prompts)"
          rightLabel="Mostly output (responses)"
          color="yellow"
        />
      ),
    },
    {
      heading: 'Which model family do you mainly use?',
      subheading: 'Bigger models, bigger thirst.',
      canContinue: modelTier !== null,
      content: (
        <PillGroup
          options={MODEL_OPTIONS}
          selected={modelTier}
          onSelect={selectModelAndAdvance}
        />
      ),
    },
    {
      heading: 'How long have you been at this usage level?',
      subheading: 'Give or take a couple months.',
      canContinue: true,
      content: (
        <ClaySlider
          min={1} max={36} value={months}
          onChange={v => { setMonths(v); wizard.setAnswers({ monthsActive: v }) }}
          color="yellow"
          formatLabel={v => MONTH_LABELS[v] ?? `${v} months`}
          minLabel="1 month"
          maxLabel="3+ years"
        />
      ),
    },
  ]

  const callsQuestions = [
    {
      heading: 'How many API calls per day on average?',
      subheading: "Across all services and environments.",
      canContinue: true,
      content: (
        <div className="flex flex-wrap gap-3">
          {CALLS_PER_DAY_OPTIONS.map(opt => (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => { setCallsPerDay(opt.value); wizard.setAnswers({ callsPerDay: opt.value }) }}
              className="rounded-2xl px-5 py-3 font-body font-bold text-sm text-[#1A1A2E] cursor-pointer border-none select-none"
              style={{
                background: callsPerDay === opt.value
                  ? 'linear-gradient(160deg, #C4ED8A, #A8E063)'
                  : 'linear-gradient(160deg, #FFF8EE, #FFF0D6)',
                boxShadow: callsPerDay === opt.value
                  ? '0 5px 0 0 #6BAA1E, inset 0 2px 4px rgba(255,255,255,0.55)'
                  : '0 5px 0 0 #D4A96A, inset 0 2px 4px rgba(255,255,255,0.55)',
              }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ y: 3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {opt.label}
            </motion.button>
          ))}
        </div>
      ),
    },
    {
      heading: 'How many messages per API call?',
      subheading: 'How big is a typical request/response cycle.',
      canContinue: callSize !== null,
      content: (
        <PillGroup
          options={CALL_SIZE_OPTIONS}
          selected={callSize}
          onSelect={selectCallSizeAndAdvance}
        />
      ),
    },
    {
      heading: 'Which model family do you mainly use?',
      subheading: 'Bigger models, bigger thirst.',
      canContinue: modelTier !== null,
      content: (
        <PillGroup
          options={MODEL_OPTIONS}
          selected={modelTier}
          onSelect={selectModelAndAdvance}
        />
      ),
    },
    {
      heading: 'How long have you been at this usage level?',
      subheading: 'Give or take a couple months.',
      canContinue: true,
      content: (
        <ClaySlider
          min={1} max={36} value={months}
          onChange={v => { setMonths(v); wizard.setAnswers({ monthsActive: v }) }}
          color="lime"
          formatLabel={v => MONTH_LABELS[v] ?? `${v} months`}
          minLabel="1 month"
          maxLabel="3+ years"
        />
      ),
    },
  ]

  const questions = isTokenPath ? tokenQuestions : callsQuestions
  const color = isTokenPath ? 'yellow' : 'lime'
  const current = questions[q]

  // Auto-advance not applicable on Q0 (preset select), Q1 (slider), Q3 (slider)
  // Q2 (model) auto-advances via selectModelAndAdvance
  // Q1 calls: callSize auto-advances via selectCallSizeAndAdvance
  const showContinue = q !== 2 && !(q === 1 && !isTokenPath)

  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <BackButton onClick={goBack} />
      <QuestionProgress current={q + 1} total={TOTAL} />

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={q}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="flex flex-col gap-5"
        >
          <div>
            <h2 className="text-3xl text-[#1A1A2E] mb-2">{current.heading}</h2>
            <p className="font-body text-sm text-[#1A1A2E]/50">{current.subheading}</p>
          </div>
          {current.content}
        </motion.div>
      </AnimatePresence>

      {showContinue && (
        <ClayButton
          color={color as 'yellow' | 'lime'}
          onClick={advance}
          disabled={!current.canContinue}
        >
          {q === TOTAL - 1 ? 'See my damage' : 'Continue'}
        </ClayButton>
      )}
    </div>
  )
}
