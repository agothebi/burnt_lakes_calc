import { ClayCard } from '../ui/ClayCard'
import { BackButton } from './shared/BackButton'
import type { WizardControls } from '../../hooks/useWizard'

export function UserTypeStep({ wizard }: { wizard: WizardControls }) {
  return (
    <div className="flex flex-col gap-6 max-w-lg">
      <BackButton onClick={wizard.back} />

      <div>
        <h2 className="text-4xl text-[#1A1A2E] mb-2">Who are you?</h2>
        <p className="font-body text-base text-[#1A1A2E]/50">
          Be honest. The lake already knows.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <ClayCard
          color="blue"
          hoverable
          onClick={() => wizard.submitAndNext({ userType: 'regular' })}
        >
          <p className="font-display text-xl text-[#1A1A2E] mb-1">Regular Human</p>
          <p className="font-body text-sm text-[#1A1A2E]/60">
            I use ChatGPT, Claude, Gemini, etc. I vibe-check AI assistants.
          </p>
        </ClayCard>

        <ClayCard
          color="purple"
          hoverable
          onClick={() => wizard.submitAndNext({ userType: 'power' })}
        >
          <p className="font-display text-xl text-[#1A1A2E] mb-1">Power User / Developer</p>
          <p className="font-body text-sm text-[#1A1A2E]/60">
            I have an API key and I'm not afraid to use it.
          </p>
        </ClayCard>
      </div>
    </div>
  )
}
