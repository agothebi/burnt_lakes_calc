import { ClayCard } from '../ui/ClayCard'
import { BackButton } from './shared/BackButton'
import type { WizardControls } from '../../hooks/useWizard'

export function PowerPathSelectStep({ wizard }: { wizard: WizardControls }) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <BackButton onClick={wizard.back} />

      <div>
        <h2 className="text-4xl text-[#1A1A2E] mb-2">How do you track your usage?</h2>
        <p className="font-body text-base text-[#1A1A2E]/50">
          Pick the one you can actually answer.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ClayCard
          color="yellow"
          hoverable
          onClick={() => wizard.submitAndNext({ powerPath: 'tokens' })}
        >
          <p className="font-display text-xl text-[#1A1A2E] mb-1">I track token usage</p>
          <p className="font-body text-sm text-[#1A1A2E]/60">
            I know roughly how many tokens I use per month from my API dashboard.
          </p>
        </ClayCard>

        <ClayCard
          color="lime"
          hoverable
          onClick={() => wizard.submitAndNext({ powerPath: 'calls' })}
        >
          <p className="font-display text-xl text-[#1A1A2E] mb-1">I count API calls</p>
          <p className="font-body text-sm text-[#1A1A2E]/60">
            I know roughly how many requests per day I'm making.
          </p>
        </ClayCard>
      </div>
    </div>
  )
}
