import { motion } from 'framer-motion'
import { ClayButton } from '../ui/ClayButton'
import type { WizardControls } from '../../hooks/useWizard'

export function HeroStep({ wizard }: { wizard: WizardControls }) {
  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div>
        <motion.h1
          className="text-5xl md:text-6xl text-[#1A1A2E] mb-4 leading-tight"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          How many lakes have you burned?
        </motion.h1>
        <p className="font-body text-xl text-[#1A1A2E]/60 font-semibold">
          Let's keep it real.
        </p>
      </div>

      <p className="font-body text-base text-[#1A1A2E]/50 leading-relaxed">
        Every AI conversation evaporates real water through data center cooling.
        We did the math so you don't have to feel good about yourself.
      </p>

      <ClayButton color="coral" size="lg" onClick={wizard.next}>
        Calculate my damage
      </ClayButton>
    </div>
  )
}
