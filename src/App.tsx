import { AnimatePresence, motion } from 'framer-motion'
import { SplitLayout } from './components/layout/SplitLayout'
import { LakeScene } from './components/scene/LakeScene'
import { HeroStep } from './components/steps/HeroStep'
import { UserTypeStep } from './components/steps/UserTypeStep'
import { PowerPathSelectStep } from './components/steps/PowerPathSelectStep'
import { RegularUserSteps } from './components/steps/RegularUserSteps'
import { PowerUserSteps } from './components/steps/PowerUserSteps'
import { LoadingStep } from './components/steps/LoadingStep'
import { ResultStep } from './components/steps/ResultStep'
import { useWizard } from './hooks/useWizard'
import { useBurnProgress } from './hooks/useBurnProgress'

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? '6%' : '-6%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? '-6%' : '6%', opacity: 0 }),
}

function renderStep(wizard: ReturnType<typeof useWizard>) {
  switch (wizard.step) {
    case 'hero':            return <HeroStep wizard={wizard} />
    case 'userType':        return <UserTypeStep wizard={wizard} />
    case 'powerPathSelect': return <PowerPathSelectStep wizard={wizard} />
    case 'questions':
      return wizard.answers.userType === 'power'
        ? <PowerUserSteps wizard={wizard} />
        : <RegularUserSteps wizard={wizard} />
    case 'loading':  return <LoadingStep wizard={wizard} />
    case 'results':  return <ResultStep wizard={wizard} />
  }
}

function App() {
  const wizard      = useWizard()
  const burnProgress = useBurnProgress(wizard.answers)

  return (
    <SplitLayout
      left={<LakeScene progress={burnProgress} />}
      right={
        <div className="max-w-xl w-full mx-auto">
          <AnimatePresence mode="wait" custom={wizard.direction}>
            <motion.div
              key={wizard.step}
              custom={wizard.direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              {renderStep(wizard)}
            </motion.div>
          </AnimatePresence>
        </div>
      }
    />
  )
}

export default App
