import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ClayButton } from '../ui/ClayButton'
import { ClayChipGroup } from '../ui/ClayChip'
import { ClaySlider } from '../ui/ClaySlider'
import { BackButton } from './shared/BackButton'
import { QuestionProgress } from './shared/QuestionProgress'
import { PillGroup } from './shared/PillGroup'
import type { WizardControls } from '../../hooks/useWizard'
import type {
  AiTool,
  FrequencyPerWeek,
  SessionLength,
  ConversationStyle,
} from '../../utils/calculator'

const TOOL_OPTIONS: { value: AiTool; label: string }[] = [
  { value: 'chatgpt',    label: 'ChatGPT' },
  { value: 'claude',     label: 'Claude' },
  { value: 'gemini',     label: 'Gemini' },
  { value: 'copilot',    label: 'Copilot' },
  { value: 'perplexity', label: 'Perplexity' },
  { value: 'image-gen',  label: 'Image Generation' },
  { value: 'other',      label: 'Other' },
]

const FREQUENCY_OPTIONS: { value: FrequencyPerWeek; label: string }[] = [
  { value: '1-2',   label: '1–2 days a week' },
  { value: '3-4',   label: '3–4 days a week' },
  { value: '5-6',   label: '5–6 days a week' },
  { value: 'daily', label: 'Every single day' },
]

const SESSION_OPTIONS: { value: SessionLength; label: string }[] = [
  { value: 'under15', label: 'Under 15 min' },
  { value: '15to30',  label: '15–30 min' },
  { value: '30to60',  label: '30–60 min' },
  { value: '1to2h',   label: '1–2 hours' },
  { value: 'over2h',  label: 'More than 2 hours' },
]

const STYLE_OPTIONS: { value: ConversationStyle; label: string }[] = [
  { value: 'quick',     label: 'One quick question' },
  { value: 'backforth', label: 'Back and forth, a few rounds' },
  { value: 'long',      label: 'Long session, deep in the weeds' },
  { value: 'debate',    label: 'Full rabbit hole, lose track of time' },
]

const MONTH_LABELS: Record<number, string> = {
  1: 'Just started', 6: '6 months', 12: '1 year',
  24: '2 years', 36: '3+ years',
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
}

export function RegularUserSteps({ wizard }: { wizard: WizardControls }) {
  const [q, setQ] = useState(0)
  const [dir, setDir] = useState(1)

  // Local state — initialized from wizard.answers so back-nav restores values
  const [tools, setTools] = useState<AiTool[]>(
    (wizard.answers.tools as AiTool[]) ?? []
  )
  const [frequency, setFrequency] = useState<FrequencyPerWeek | null>(
    wizard.answers.frequencyPerWeek ?? null
  )
  const [session, setSession] = useState<SessionLength | null>(
    wizard.answers.sessionLength ?? null
  )
  const [style, setStyle] = useState<ConversationStyle | null>(
    wizard.answers.conversationStyle ?? null
  )
  const [months, setMonths] = useState(wizard.answers.monthsActive ?? 12)

  const TOTAL = 5

  function advance() {
    setDir(1)
    if (q < TOTAL - 1) {
      setQ(q + 1)
    } else {
      wizard.setAnswers({ tools, frequencyPerWeek: frequency!, sessionLength: session!, conversationStyle: style!, monthsActive: months })
      wizard.next()
    }
  }

  function goBack() {
    if (q === 0) {
      wizard.back()
    } else {
      setDir(-1)
      setQ(q - 1)
    }
  }

  // Auto-advance on single-select after brief highlight
  function selectAndAdvance<T>(setter: (v: T) => void, answerKey: string, value: T) {
    setter(value)
    wizard.setAnswers({ [answerKey]: value })
    setTimeout(() => {
      setDir(1)
      if (q < TOTAL - 1) setQ(q + 1)
      else wizard.next()
    }, 220)
  }

  const questions = [
    {
      heading: 'Which AI tools do you use most?',
      subheading: 'Pick everything you use.',
      canContinue: tools.length > 0,
      content: (
        <ClayChipGroup
          options={TOOL_OPTIONS}
          selected={tools}
          onChange={v => { setTools(v); wizard.setAnswers({ tools: v }) }}
          color="blue"
        />
      ),
    },
    {
      heading: 'How many days a week do you use AI?',
      subheading: 'Count the lazy days too.',
      canContinue: frequency !== null,
      content: (
        <PillGroup
          options={FREQUENCY_OPTIONS}
          selected={frequency}
          onSelect={v => selectAndAdvance(setFrequency, 'frequencyPerWeek', v)}
        />
      ),
    },
    {
      heading: 'On a typical day, how long are you at it?',
      subheading: 'Across everything.',
      canContinue: session !== null,
      content: (
        <PillGroup
          options={SESSION_OPTIONS}
          selected={session}
          onSelect={v => selectAndAdvance(setSession, 'sessionLength', v)}
        />
      ),
    },
    {
      heading: 'What does a typical session look like?',
      subheading: 'Pick the closest match.',
      canContinue: style !== null,
      content: (
        <PillGroup
          options={STYLE_OPTIONS}
          selected={style}
          onSelect={v => selectAndAdvance(setStyle, 'conversationStyle', v)}
        />
      ),
    },
    {
      heading: 'How long have you been using AI tools regularly?',
      subheading: 'At least weekly counts.',
      canContinue: true,
      content: (
        <ClaySlider
          min={1}
          max={36}
          value={months}
          onChange={v => { setMonths(v); wizard.setAnswers({ monthsActive: v }) }}
          color="coral"
          formatLabel={v => MONTH_LABELS[v] ?? `${v} months`}
          minLabel="1 month"
          maxLabel="3+ years"
        />
      ),
    },
  ]

  const current = questions[q]

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

      {/* Show explicit Continue only for multi-select and slider questions */}
      {(q === 0 || q === 4) && (
        <ClayButton
          color="coral"
          onClick={advance}
          disabled={!current.canContinue}
        >
          {q === TOTAL - 1 ? 'Show me my lakes' : 'Continue'}
        </ClayButton>
      )}
    </div>
  )
}
